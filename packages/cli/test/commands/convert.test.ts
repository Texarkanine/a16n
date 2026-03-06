import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import type { A16nEngine, ConversionResult } from '@a16njs/engine';
import { CustomizationType, WarningCode } from '@a16njs/models';
import { handleConvert, type ConvertCommandOptions } from '../../src/commands/convert.js';
import type { CommandIO } from '../../src/commands/io.js';
import {
  isGitRepo,
  isGitIgnored,
  isGitTracked,
  getIgnoreSource,
  addToGitIgnore,
  addToGitExclude,
  removeFromGitIgnore,
  removeFromGitExclude,
  removeFromPreCommitHook,
} from '../../src/git-ignore.js';

/**
 * Unit tests for the convert command handler.
 * Tests the command logic in isolation using mock engine and IO.
 */

function createMockIO() {
  const logs: string[] = [];
  const errors: string[] = [];
  let exitCode: number | undefined;
  return {
    get logs() { return logs; },
    get errors() { return errors; },
    get exitCode() { return exitCode; },
    log: (msg: string) => { logs.push(msg); },
    error: (msg: string) => { errors.push(msg); },
    setExitCode: (code: number) => { exitCode = code; },
  };
}

function createMockEngine(overrides: Partial<A16nEngine> = {}): A16nEngine {
  return {
    convert: vi.fn().mockResolvedValue({
      discovered: [],
      written: [],
      warnings: [],
      unsupported: [],
    } satisfies ConversionResult),
    discover: vi.fn(),
    listPlugins: vi.fn(),
    getPlugin: vi.fn(),
    registerPlugin: vi.fn(),
    discoverAndRegisterPlugins: vi.fn(),
    ...overrides,
  } as unknown as A16nEngine;
}

describe('handleConvert', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'a16n-convert-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('directory validation', () => {
    it('should error when source directory does not exist', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        fromDir: '/nonexistent/path',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('not a valid directory'))).toBe(true);
      expect(engine.convert).not.toHaveBeenCalled();
    });

    it('should error when target directory does not exist', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        toDir: '/nonexistent/path',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('not a valid directory'))).toBe(true);
      expect(engine.convert).not.toHaveBeenCalled();
    });
  });

  describe('engine interaction', () => {
    it('should call engine.convert with correct options', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(engine.convert).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'cursor',
          target: 'claude',
          root: path.resolve(tmpDir),
        }),
      );
    });

    it('should pass sourceRoot when --from-dir is specified', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        fromDir: tmpDir,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(engine.convert).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceRoot: path.resolve(tmpDir),
        }),
      );
    });

    it('should pass dryRun when --dry-run is specified', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        dryRun: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(engine.convert).toHaveBeenCalledWith(
        expect.objectContaining({ dryRun: true }),
      );
    });

    it('should pass rewritePathRefs when --rewrite-path-refs is specified', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        rewritePathRefs: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(engine.convert).toHaveBeenCalledWith(
        expect.objectContaining({ rewritePathRefs: true }),
      );
    });
  });

  describe('output formatting', () => {
    it('should output JSON when --json is specified', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' }],
          written: [{ path: path.join(tmpDir, '.claude/rules/test.md'), type: CustomizationType.GlobalPrompt, itemCount: 1, isNewFile: true }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        json: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.logs).toHaveLength(1);
      expect(() => JSON.parse(io.logs[0]!)).not.toThrow();
    });

    it('should suppress output when --quiet is specified', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test' }],
          written: [],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        quiet: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.logs).toHaveLength(0);
    });

    it('should show "Would write" prefix in dry-run mode', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test' }],
          written: [{ path: path.join(tmpDir, '.claude/rules/test.md'), type: CustomizationType.GlobalPrompt, itemCount: 1, isNewFile: true }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        dryRun: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.logs.some(l => l.includes('Would write'))).toBe(true);
    });

    it('should show "Wrote" prefix in normal mode', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test' }],
          written: [{ path: path.join(tmpDir, '.claude/rules/test.md'), type: CustomizationType.GlobalPrompt, itemCount: 1, isNewFile: true }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.logs.some(l => l.includes('Wrote'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle engine errors gracefully', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockRejectedValue(new Error('Unknown source: badplugin')),
      });
      const options: ConvertCommandOptions = {
        from: 'badplugin',
        to: 'claude',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('Unknown source: badplugin'))).toBe(true);
    });

  });

  describe('git-ignore match mode', () => {
    vi.mock('../../src/git-ignore.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('../../src/git-ignore.js')>();
      return {
        ...original,
        isGitRepo: vi.fn(),
        isGitIgnored: vi.fn(),
        isGitTracked: vi.fn(),
        getIgnoreSource: vi.fn(),
        addToGitIgnore: vi.fn(),
        addToGitExclude: vi.fn(),
        updatePreCommitHook: vi.fn(),
        removeFromGitIgnore: vi.fn(),
        removeFromGitExclude: vi.fn(),
        removeFromPreCommitHook: vi.fn(),
      };
    });

    it('should error on unknown conflict resolution value', async () => {
      vi.mocked(isGitRepo).mockResolvedValue(true);
      // Mixed status: first source ignored via .gitignore, second not ignored
      vi.mocked(getIgnoreSource)
        .mockResolvedValueOnce('.gitignore')
        .mockResolvedValueOnce(null);

      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [
            { type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' },
            { type: CustomizationType.GlobalPrompt, content: 'b', sourcePath: 'src/b.mdc' },
          ],
          written: [{
            path: path.join(tmpDir, 'out/merged.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 2,
            isNewFile: true,
            sourceItems: [
              { type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' },
              { type: CustomizationType.GlobalPrompt, content: 'b', sourcePath: 'src/b.mdc' },
            ],
          }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        gitignoreOutputWith: 'match',
        ifGitignoreConflict: 'badvalue',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('badvalue'))).toBe(true);
    });

    it('should attempt all removals even if one fails', async () => {
      vi.mocked(isGitRepo).mockResolvedValue(true);
      // All sources ignored → all tracked means filesToCommit via 'commit' resolution
      // Two sources, both ignored via .gitignore but with mixed ignore sources to trigger conflict
      vi.mocked(getIgnoreSource)
        .mockResolvedValueOnce('.gitignore')
        .mockResolvedValueOnce(null);
      vi.mocked(removeFromGitIgnore).mockRejectedValue(new Error('gitignore remove failed'));
      vi.mocked(removeFromGitExclude).mockResolvedValue(undefined as any);
      vi.mocked(removeFromPreCommitHook).mockResolvedValue(undefined as any);

      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [
            { type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' },
            { type: CustomizationType.GlobalPrompt, content: 'b', sourcePath: 'src/b.mdc' },
          ],
          written: [{
            path: path.join(tmpDir, 'out/merged.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 2,
            isNewFile: true,
            sourceItems: [
              { type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' },
              { type: CustomizationType.GlobalPrompt, content: 'b', sourcePath: 'src/b.mdc' },
            ],
          }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        gitignoreOutputWith: 'match',
        ifGitignoreConflict: 'commit',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(removeFromGitIgnore).toHaveBeenCalled();
      expect(removeFromGitExclude).toHaveBeenCalled();
      expect(removeFromPreCommitHook).toHaveBeenCalled();
      // The failure from removeFromGitIgnore should surface as a warning in output
      expect(io.logs.some(l => l.includes('Failed to remove from .gitignore'))).toBe(true);
      expect(io.logs.some(l => l.includes('gitignore remove failed'))).toBe(true);
    });

    describe('handleGitIgnoreMatch routing', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      function matchModeOptions(overrides: Partial<ConvertCommandOptions> = {}): ConvertCommandOptions {
        return {
          from: 'cursor',
          to: 'claude',
          gitignoreOutputWith: 'match',
          ...overrides,
        };
      }

      function writtenFile(tmpDir: string, relativePath: string, sourceItems: Array<{ sourcePath: string }>, isNewFile = true) {
        return {
          path: path.join(tmpDir, relativePath),
          type: CustomizationType.GlobalPrompt,
          itemCount: sourceItems.length,
          isNewFile,
          sourceItems: sourceItems.map(s => ({
            type: CustomizationType.GlobalPrompt,
            content: 'test',
            ...s,
          })),
        };
      }

      it('B4: should route new output to .gitignore when all sources ignored via .gitignore', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource).mockResolvedValue('.gitignore');
        vi.mocked(addToGitIgnore).mockResolvedValue(undefined as any);

        const io = createMockIO();
        const engine = createMockEngine({
          convert: vi.fn().mockResolvedValue({
            discovered: [{ type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' }],
            written: [writtenFile(tmpDir, '.claude/rules/a.md', [{ sourcePath: 'src/a.mdc' }])],
            warnings: [],
            unsupported: [],
          }),
        });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        expect(addToGitIgnore).toHaveBeenCalled();
        expect(addToGitExclude).not.toHaveBeenCalled();
      });

      it('B5: should route new output to .git/info/exclude when all sources ignored via exclude', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource).mockResolvedValue('.git/info/exclude');
        vi.mocked(addToGitExclude).mockResolvedValue(undefined as any);

        const io = createMockIO();
        const engine = createMockEngine({
          convert: vi.fn().mockResolvedValue({
            discovered: [{ type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' }],
            written: [writtenFile(tmpDir, '.claude/rules/a.md', [{ sourcePath: 'src/a.mdc' }])],
            warnings: [],
            unsupported: [],
          }),
        });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        expect(addToGitExclude).toHaveBeenCalled();
        expect(addToGitIgnore).not.toHaveBeenCalled();
      });

      it('B6: should not ignore new output when all sources are tracked', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource).mockResolvedValue(null);

        const io = createMockIO();
        const engine = createMockEngine({
          convert: vi.fn().mockResolvedValue({
            discovered: [{ type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' }],
            written: [writtenFile(tmpDir, '.claude/rules/a.md', [{ sourcePath: 'src/a.mdc' }])],
            warnings: [],
            unsupported: [],
          }),
        });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        expect(addToGitIgnore).not.toHaveBeenCalled();
        expect(addToGitExclude).not.toHaveBeenCalled();
      });

      it('B7: should emit GitStatusConflict warning when new output has mixed-status sources', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource)
          .mockResolvedValueOnce('.gitignore')
          .mockResolvedValueOnce(null);

        const io = createMockIO();
        const result = {
          discovered: [
            { type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' },
            { type: CustomizationType.GlobalPrompt, content: 'b', sourcePath: 'src/b.mdc' },
          ],
          written: [writtenFile(tmpDir, '.claude/rules/merged.md', [
            { sourcePath: 'src/a.mdc' },
            { sourcePath: 'src/b.mdc' },
          ])],
          warnings: [] as any[],
          unsupported: [],
        };
        const engine = createMockEngine({ convert: vi.fn().mockResolvedValue(result) });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        const warnings = result.warnings.filter((w: any) => w.code === WarningCode.GitStatusConflict);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toContain('mixed status');
      });

      it('B8: should emit GitStatusConflict warning when sources ignored by different files', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource)
          .mockResolvedValueOnce('.gitignore')
          .mockResolvedValueOnce('.git/info/exclude');

        const io = createMockIO();
        const result = {
          discovered: [
            { type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' },
            { type: CustomizationType.GlobalPrompt, content: 'b', sourcePath: 'src/b.mdc' },
          ],
          written: [writtenFile(tmpDir, '.claude/rules/merged.md', [
            { sourcePath: 'src/a.mdc' },
            { sourcePath: 'src/b.mdc' },
          ])],
          warnings: [] as any[],
          unsupported: [],
        };
        const engine = createMockEngine({ convert: vi.fn().mockResolvedValue(result) });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        const warnings = result.warnings.filter((w: any) => w.code === WarningCode.GitStatusConflict);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toContain('different files');
      });

      it('B9: should emit GitStatusConflict warning for existing tracked output with ignored sources', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource).mockResolvedValue('.gitignore');
        vi.mocked(isGitTracked).mockResolvedValue(true);

        const io = createMockIO();
        const result = {
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' }],
          written: [writtenFile(tmpDir, '.claude/rules/a.md', [{ sourcePath: 'src/a.mdc' }], false)],
          warnings: [] as any[],
          unsupported: [],
        };
        const engine = createMockEngine({ convert: vi.fn().mockResolvedValue(result) });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        const warnings = result.warnings.filter((w: any) => w.code === WarningCode.GitStatusConflict);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toContain('tracked');
        expect(warnings[0].message).toContain('ignored');
      });

      it('B10: should emit GitStatusConflict warning for existing ignored output with tracked sources', async () => {
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(getIgnoreSource).mockResolvedValue(null);
        vi.mocked(isGitTracked).mockResolvedValue(false);
        vi.mocked(isGitIgnored).mockResolvedValue(true);

        const io = createMockIO();
        const result = {
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'a', sourcePath: 'src/a.mdc' }],
          written: [writtenFile(tmpDir, '.claude/rules/a.md', [{ sourcePath: 'src/a.mdc' }], false)],
          warnings: [] as any[],
          unsupported: [],
        };
        const engine = createMockEngine({ convert: vi.fn().mockResolvedValue(result) });

        await handleConvert(engine, tmpDir, matchModeOptions(), io);

        expect(io.exitCode).toBeUndefined();
        const warnings = result.warnings.filter((w: any) => w.code === WarningCode.GitStatusConflict);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toContain('tracked');
        expect(warnings[0].message).toContain('ignored');
      });
    });
  });

  describe('delete source', () => {
    it('should delete source files when --delete-source is specified', async () => {
      // Create a source file
      const sourceDir = path.join(tmpDir, '.cursor', 'rules');
      await fs.mkdir(sourceDir, { recursive: true });
      const sourceFile = path.join(sourceDir, 'test.mdc');
      await fs.writeFile(sourceFile, 'test content');

      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' }],
          written: [{
            path: path.join(tmpDir, '.claude/rules/test.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 1,
            isNewFile: true,
            sourceItems: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' }],
          }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        deleteSource: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      // Source file should be deleted
      await expect(fs.access(sourceFile)).rejects.toThrow();
    });

    it('should show "Would delete" in dry-run with --delete-source', async () => {
      const sourceDir = path.join(tmpDir, '.cursor', 'rules');
      await fs.mkdir(sourceDir, { recursive: true });
      const sourceFile = path.join(sourceDir, 'test.mdc');
      await fs.writeFile(sourceFile, 'test content');

      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' }],
          written: [{
            path: path.join(tmpDir, '.claude/rules/test.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 1,
            isNewFile: true,
            sourceItems: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' }],
          }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        deleteSource: true,
        dryRun: true,
        verbose: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      // Source file should NOT be deleted in dry-run
      await expect(fs.access(sourceFile)).resolves.toBeUndefined();
    });
  });

  describe('handleDeleteSource safety guards', () => {
    it('B1: should refuse to delete source that resolves outside project root', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '../../escape.txt' }],
          written: [{
            path: path.join(tmpDir, '.claude/rules/test.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 1,
            isNewFile: true,
            sourceItems: [{ type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '../../escape.txt' }],
          }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        deleteSource: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.exitCode).toBeUndefined();
      expect(io.errors.some(e => e.includes('Refusing to delete source outside project'))).toBe(true);
    });

    it('B2: should preserve sources marked as skipped even when other sources are deleted', async () => {
      const sourceDir = path.join(tmpDir, '.cursor', 'rules');
      await fs.mkdir(sourceDir, { recursive: true });
      const keptFile = path.join(sourceDir, 'kept.mdc');
      const deletedFile = path.join(sourceDir, 'deleted.mdc');
      await fs.writeFile(keptFile, 'should be preserved');
      await fs.writeFile(deletedFile, 'should be deleted');

      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [
            { type: CustomizationType.GlobalPrompt, content: 'kept', sourcePath: '.cursor/rules/kept.mdc' },
            { type: CustomizationType.GlobalPrompt, content: 'deleted', sourcePath: '.cursor/rules/deleted.mdc' },
          ],
          written: [{
            path: path.join(tmpDir, '.claude/rules/out.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 2,
            isNewFile: true,
            sourceItems: [
              { type: CustomizationType.GlobalPrompt, content: 'kept', sourcePath: '.cursor/rules/kept.mdc' },
              { type: CustomizationType.GlobalPrompt, content: 'deleted', sourcePath: '.cursor/rules/deleted.mdc' },
            ],
          }],
          warnings: [{
            code: WarningCode.Skipped,
            message: 'Skipped kept.mdc',
            sources: ['.cursor/rules/kept.mdc'],
          }],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        deleteSource: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      await expect(fs.access(keptFile)).resolves.toBeUndefined();
      await expect(fs.access(deletedFile)).rejects.toThrow();
    });

    it('B3: should handle unlink failure gracefully and continue', async () => {
      const sourceDir = path.join(tmpDir, '.cursor', 'rules');
      await fs.mkdir(sourceDir, { recursive: true });
      const realFile = path.join(sourceDir, 'real.mdc');
      await fs.writeFile(realFile, 'will be deleted');

      const io = createMockIO();
      const engine = createMockEngine({
        convert: vi.fn().mockResolvedValue({
          discovered: [
            { type: CustomizationType.GlobalPrompt, content: 'missing', sourcePath: '.cursor/rules/missing.mdc' },
            { type: CustomizationType.GlobalPrompt, content: 'real', sourcePath: '.cursor/rules/real.mdc' },
          ],
          written: [{
            path: path.join(tmpDir, '.claude/rules/out.md'),
            type: CustomizationType.GlobalPrompt,
            itemCount: 2,
            isNewFile: true,
            sourceItems: [
              { type: CustomizationType.GlobalPrompt, content: 'missing', sourcePath: '.cursor/rules/missing.mdc' },
              { type: CustomizationType.GlobalPrompt, content: 'real', sourcePath: '.cursor/rules/real.mdc' },
            ],
          }],
          warnings: [],
          unsupported: [],
        }),
      });
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        deleteSource: true,
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.errors.some(e => e.includes('Failed to delete'))).toBe(true);
      await expect(fs.access(realFile)).rejects.toThrow();
    });
  });
});
