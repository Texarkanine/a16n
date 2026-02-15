import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import type { A16nEngine, ConversionResult } from '@a16njs/engine';
import { CustomizationType } from '@a16njs/models';
import { handleConvert, type ConvertCommandOptions } from '../../src/commands/convert.js';
import type { CommandIO } from '../../src/commands/io.js';

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

    it('should validate --if-gitignore-conflict values', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: ConvertCommandOptions = {
        from: 'cursor',
        to: 'claude',
        ifGitignoreConflict: 'invalid',
      };

      await handleConvert(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('Invalid --if-gitignore-conflict'))).toBe(true);
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
});
