import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { A16nEngine } from '../src/index.js';
import { LocalWorkspace } from '../src/workspace.js';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import { CustomizationType, WarningCode } from '@a16njs/models';
import type { A16nPlugin } from '@a16njs/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '.temp-engine-test');

describe('A16nEngine', () => {
  describe('plugin management', () => {
    it('should register plugins', () => {
      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const plugins = engine.listPlugins();

      expect(plugins).toHaveLength(2);
      expect(plugins.map((p) => p.id)).toContain('cursor');
      expect(plugins.map((p) => p.id)).toContain('claude');
    });

    it('should get plugin by id', () => {
      const engine = new A16nEngine([cursorPlugin, claudePlugin]);

      const cursor = engine.getPlugin('cursor');
      expect(cursor?.id).toBe('cursor');
      expect(cursor?.name).toBe('Cursor IDE');

      const claude = engine.getPlugin('claude');
      expect(claude?.id).toBe('claude');
      expect(claude?.name).toBe('Claude Code');
    });

    it('should return undefined for unknown plugin', () => {
      const engine = new A16nEngine([cursorPlugin]);

      const unknown = engine.getPlugin('unknown');
      expect(unknown).toBeUndefined();
    });

    it('should list plugin info with supports array', () => {
      const engine = new A16nEngine([cursorPlugin]);
      const plugins = engine.listPlugins();

      expect(plugins[0]?.supports).toContain(CustomizationType.GlobalPrompt);
    });
  });

  describe('source tracking', () => {
    it('should report source as bundled for constructor-registered plugins', () => {
      const engine = new A16nEngine([cursorPlugin]);
      const plugins = engine.listPlugins();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]?.source).toBe('bundled');
    });

    it('should report source as installed for plugins registered with source=installed', () => {
      const fakePlugin: A16nPlugin = {
        id: 'fake-installed',
        name: 'Fake Installed Plugin',
        supports: [CustomizationType.GlobalPrompt],
        discover: async () => ({ items: [], warnings: [] }),
        emit: async () => ({ written: [], warnings: [], unsupported: [] }),
      };

      const engine = new A16nEngine();
      engine.registerPlugin(fakePlugin, 'installed');
      const plugins = engine.listPlugins();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]?.source).toBe('installed');
    });

    it('should return the plugin via getPlugin after source tracking refactor', () => {
      const engine = new A16nEngine([cursorPlugin, claudePlugin]);

      const cursor = engine.getPlugin('cursor');
      expect(cursor?.id).toBe('cursor');
      expect(cursor?.name).toBe('Cursor IDE');
    });
  });

  describe('discoverAndRegisterPlugins', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should register discovered plugins with source=installed', async () => {
      // Create a temp dir with a fake plugin
      const searchPath = path.join(tempDir, 'discover-node_modules');
      const pkgDir = path.join(searchPath, 'a16n-plugin-disco');
      await fs.mkdir(pkgDir, { recursive: true });
      await fs.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: 'a16n-plugin-disco', type: 'module', main: 'index.js' }),
      );
      await fs.writeFile(
        path.join(pkgDir, 'index.js'),
        `export default {
          id: 'disco', name: 'Disco Plugin', supports: ['global-prompt'],
          discover: async () => ({ items: [], warnings: [] }),
          emit: async () => ({ written: [], warnings: [], unsupported: [] }),
        };`,
      );

      const engine = new A16nEngine([cursorPlugin]);
      const result = await engine.discoverAndRegisterPlugins({ searchPaths: [searchPath] });

      expect(result.registered).toContain('disco');
      expect(result.errors).toHaveLength(0);

      // Verify it's listed as installed
      const plugins = engine.listPlugins();
      const disco = plugins.find((p) => p.id === 'disco');
      expect(disco?.source).toBe('installed');
    });

    it('should skip installed plugin when bundled plugin has same ID', async () => {
      const searchPath = path.join(tempDir, 'conflict-node_modules');
      const pkgDir = path.join(searchPath, 'a16n-plugin-cursor');
      await fs.mkdir(pkgDir, { recursive: true });
      await fs.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: 'a16n-plugin-cursor', type: 'module', main: 'index.js' }),
      );
      await fs.writeFile(
        path.join(pkgDir, 'index.js'),
        `export default {
          id: 'cursor', name: 'Imposter Cursor', supports: ['global-prompt'],
          discover: async () => ({ items: [], warnings: [] }),
          emit: async () => ({ written: [], warnings: [], unsupported: [] }),
        };`,
      );

      const engine = new A16nEngine([cursorPlugin]);
      const result = await engine.discoverAndRegisterPlugins({ searchPaths: [searchPath] });

      expect(result.skipped).toContain('cursor');
      expect(result.registered).not.toContain('cursor');

      // Bundled plugin should still be there, unchanged
      const plugin = engine.getPlugin('cursor');
      expect(plugin?.name).toBe('Cursor IDE'); // original bundled name, not imposter
    });

    it('should return errors for invalid plugins without crashing', async () => {
      const searchPath = path.join(tempDir, 'error-node_modules');
      const pkgDir = path.join(searchPath, 'a16n-plugin-bad');
      await fs.mkdir(pkgDir, { recursive: true });
      await fs.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: 'a16n-plugin-bad', type: 'module', main: 'index.js' }),
      );
      await fs.writeFile(path.join(pkgDir, 'index.js'), 'invalid javascript }{}{');

      const engine = new A16nEngine([cursorPlugin]);
      const result = await engine.discoverAndRegisterPlugins({ searchPaths: [searchPath] });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.packageName).toBe('a16n-plugin-bad');
    });
  });

  describe('discover', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should discover items using specified plugin', async () => {
      // Create a CLAUDE.md file
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'Test content');

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.discover('claude', tempDir);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
    });

    it('should throw error for unknown plugin', async () => {
      const engine = new A16nEngine([cursorPlugin]);

      await expect(engine.discover('unknown', tempDir)).rejects.toThrow(
        'Unknown plugin: unknown'
      );
    });
  });

  describe('convert', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should convert from cursor to claude', async () => {
      // Create cursor rules
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nTest rule content'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toContain('.claude/rules/');

      // Verify file was created in .claude/rules/
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      const files = await fs.readdir(claudeRulesDir);
      expect(files.length).toBeGreaterThan(0);
      
      const claudeContent = await fs.readFile(
        path.join(claudeRulesDir, files[0]!),
        'utf-8'
      );
      expect(claudeContent).toContain('Test rule content');
    });

    it('should convert from claude to cursor', async () => {
      // Create .claude/rules/test.md
      await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude/rules/test.md'),
        '## From: test\n\nClaude guidelines content'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written).toHaveLength(1);

      // Verify .cursor/rules directory was created
      const cursorRulesDir = path.join(tempDir, '.cursor', 'rules');
      const files = await fs.readdir(cursorRulesDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should handle dry-run mode', async () => {
      // Create cursor rules
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nDry run test'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        dryRun: true,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written).toHaveLength(1); // Now returns what WOULD be written (without actually writing)

      // Verify .claude/rules/ was NOT actually created (dry-run doesn't write files)
      await expect(
        fs.access(path.join(tempDir, '.claude', 'rules'))
      ).rejects.toThrow();
    });

    it('should throw error for unknown source', async () => {
      const engine = new A16nEngine([cursorPlugin, claudePlugin]);

      await expect(
        engine.convert({
          source: 'unknown',
          target: 'claude',
          root: tempDir,
        })
      ).rejects.toThrow('Unknown source: unknown');
    });

    it('should throw error for unknown target', async () => {
      const engine = new A16nEngine([cursorPlugin, claudePlugin]);

      await expect(
        engine.convert({
          source: 'cursor',
          target: 'unknown',
          root: tempDir,
        })
      ).rejects.toThrow('Unknown target: unknown');
    });

    it('should use sourceRoot for discover when provided (E1)', async () => {
      // sourceRoot overrides root for discover
      const sourceDir = path.join(tempDir, 'source');
      const targetDir = path.join(tempDir, 'target');
      await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        path.join(sourceDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nSplit root E1'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir, // This should NOT be used for discover
        sourceRoot: sourceDir,
        targetRoot: targetDir,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.discovered[0]?.content).toContain('Split root E1');
      // Output should be in targetDir, not tempDir
      expect(result.written[0]?.path).toContain(targetDir);
    });

    it('should use targetRoot for emit when provided (E2)', async () => {
      // targetRoot overrides root for emit
      const targetDir = path.join(tempDir, 'output');
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nSplit root E2'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        targetRoot: targetDir,
      });

      expect(result.discovered).toHaveLength(1);
      // Output should be in targetDir
      expect(result.written[0]?.path).toContain(targetDir);
      // Verify file actually exists in target
      const claudeRulesDir = path.join(targetDir, '.claude', 'rules');
      const files = await fs.readdir(claudeRulesDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should use both split roots correctly (E3)', async () => {
      // Both sourceRoot and targetRoot override root
      const sourceDir = path.join(tempDir, 'source');
      const targetDir = path.join(tempDir, 'target');
      await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        path.join(sourceDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nSplit root E3'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: '/should/not/be/used',
        sourceRoot: sourceDir,
        targetRoot: targetDir,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written[0]?.path).toContain(targetDir);
      // Verify that tempDir root does NOT have the output
      await expect(
        fs.access(path.join(tempDir, '.claude', 'rules'))
      ).rejects.toThrow();
    });

    it('should maintain backward compat with only root (E4)', async () => {
      // When no split roots, root is used for both discover and emit
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nBackward compat E4'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written[0]?.path).toContain(tempDir);
    });

    it('should collect warnings from both discovery and emission', async () => {
      // Create multiple cursor rules (each emits to separate file, no merge warning)
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/a.mdc'),
        '---\nalwaysApply: true\n---\n\nRule A'
      );
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/b.mdc'),
        '---\nalwaysApply: true\n---\n\nRule B'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(2);
      // BREAKING: Each GlobalPrompt gets its own file now
      expect(result.written).toHaveLength(2);
      // BREAKING: No merge warning (no longer merging)
      expect(result.warnings.some((w) => w.code === WarningCode.Merged)).toBe(
        false
      );
    });

    it('should rewrite path refs when rewritePathRefs is true (EP1)', async () => {
      // Create two cursor rules where a.mdc references b.mdc
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/a.mdc'),
        '---\nalwaysApply: true\n---\n\nSee .cursor/rules/b.mdc for details'
      );
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/b.mdc'),
        '---\nalwaysApply: true\n---\n\nRule B content'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        rewritePathRefs: true,
      });

      expect(result.discovered).toHaveLength(2);
      expect(result.written).toHaveLength(2);

      // Read the output file for rule a — should reference .claude/rules/b.md
      const aFile = result.written.find(w => w.path.endsWith('a.md'));
      expect(aFile).toBeDefined();
      const aContent = await fs.readFile(aFile!.path, 'utf-8');
      expect(aContent).toContain('.claude/rules/b.md');
      expect(aContent).not.toContain('.cursor/rules/b.mdc');
    });

    it('should include orphan warnings when rewritePathRefs is true (EP2)', async () => {
      // Create a cursor rule that references a nonexistent cursor rule
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/a.mdc'),
        '---\nalwaysApply: true\n---\n\nSee .cursor/rules/nonexistent.mdc for help'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        rewritePathRefs: true,
      });

      // Should have an OrphanPathRef warning
      const orphanWarnings = result.warnings.filter(w => w.code === WarningCode.OrphanPathRef);
      expect(orphanWarnings.length).toBeGreaterThanOrEqual(1);
      expect(orphanWarnings[0]!.message).toContain('.cursor/rules/nonexistent.mdc');
    });

    it('should NOT rewrite when rewritePathRefs is false/default (EP3)', async () => {
      // Same setup as EP1 but without rewritePathRefs
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/a.mdc'),
        '---\nalwaysApply: true\n---\n\nSee .cursor/rules/b.mdc for details'
      );
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/b.mdc'),
        '---\nalwaysApply: true\n---\n\nRule B content'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        // rewritePathRefs: false by default
      });

      // Content should still have original cursor paths
      const aFile = result.written.find(w => w.path.endsWith('a.md'));
      expect(aFile).toBeDefined();
      const aContent = await fs.readFile(aFile!.path, 'utf-8');
      expect(aContent).toContain('.cursor/rules/b.mdc');
      expect(aContent).not.toContain('.claude/rules/b.md');
    });

    it('should report rewrites in dry-run without writing (EP4)', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/a.mdc'),
        '---\nalwaysApply: true\n---\n\nSee .cursor/rules/b.mdc for details'
      );
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/b.mdc'),
        '---\nalwaysApply: true\n---\n\nRule B content'
      );

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        dryRun: true,
        rewritePathRefs: true,
      });

      // Should still compute what would be written with rewritten content
      expect(result.written).toHaveLength(2);
      // But no files should actually exist
      await expect(fs.access(path.join(tempDir, '.claude', 'rules'))).rejects.toThrow();
    });
  });

  describe('workspace integration', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should discover using a Workspace instead of string root (WS1)', async () => {
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'Test content');
      const workspace = new LocalWorkspace('test-source', tempDir);

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.discover('claude', workspace);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
    });

    it('should convert using Workspace for source and target (WS2)', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nWorkspace test rule'
      );

      const sourceWs = new LocalWorkspace('source', tempDir);
      const targetWs = new LocalWorkspace('target', tempDir);

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        sourceWorkspace: sourceWs,
        targetWorkspace: targetWs,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toContain('.claude/rules/');
    });

    it('should accept Workspace in convert with split roots (WS3)', async () => {
      // Create separate source and target directories
      const sourceDir = path.join(tempDir, 'source-project');
      const targetDir = path.join(tempDir, 'target-project');
      await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        path.join(sourceDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nSplit workspace test'
      );

      const sourceWs = new LocalWorkspace('source', sourceDir);
      const targetWs = new LocalWorkspace('target', targetDir);

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        sourceWorkspace: sourceWs,
        targetWorkspace: targetWs,
      });

      expect(result.discovered).toHaveLength(1);
      expect(result.written).toHaveLength(1);

      // Verify file was written to target workspace root
      const claudeRulesDir = path.join(targetDir, '.claude', 'rules');
      const files = await fs.readdir(claudeRulesDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should prefer sourceWorkspace over sourceRoot when both given (WS4)', async () => {
      // Create workspace dir with cursor rules
      const wsDir = path.join(tempDir, 'ws-project');
      await fs.mkdir(path.join(wsDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(wsDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nFrom workspace'
      );

      const sourceWs = new LocalWorkspace('source', wsDir);

      const engine = new A16nEngine([cursorPlugin, claudePlugin]);
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        sourceRoot: '/nonexistent/should/not/be/used',
        sourceWorkspace: sourceWs,
      });

      // Should discover from workspace, not sourceRoot
      expect(result.discovered).toHaveLength(1);
    });

    it('should call plugin.discover with Workspace when available (WS5)', async () => {
      const workspace = new LocalWorkspace('test-source', tempDir);

      // Use a mock plugin to verify Workspace is passed through
      const mockPlugin: A16nPlugin = {
        id: 'mock',
        name: 'Mock',
        supports: [CustomizationType.GlobalPrompt],
        discover: async (rootOrWorkspace) => {
          // Verify it received a Workspace, not a string
          expect(typeof rootOrWorkspace).not.toBe('string');
          expect((rootOrWorkspace as any).id).toBe('test-source');
          return { items: [], warnings: [] };
        },
        emit: async () => ({ written: [], warnings: [], unsupported: [] }),
      };

      const engine = new A16nEngine([mockPlugin]);
      await engine.discover('mock', workspace);
    });
  });
});
