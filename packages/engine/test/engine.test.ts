import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { A16nEngine } from '../src/index.js';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import { CustomizationType, WarningCode } from '@a16njs/models';

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
      expect(result.written[0]?.path).toContain('CLAUDE.md');

      // Verify file was created
      const claudeContent = await fs.readFile(
        path.join(tempDir, 'CLAUDE.md'),
        'utf-8'
      );
      expect(claudeContent).toContain('Test rule content');
    });

    it('should convert from claude to cursor', async () => {
      // Create CLAUDE.md
      await fs.writeFile(
        path.join(tempDir, 'CLAUDE.md'),
        'Claude guidelines content'
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
      expect(result.written).toHaveLength(0); // Nothing written in dry-run

      // Verify CLAUDE.md was NOT created
      await expect(
        fs.access(path.join(tempDir, 'CLAUDE.md'))
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

    it('should collect warnings from both discovery and emission', async () => {
      // Create multiple cursor rules to trigger merge warning
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
      expect(result.written).toHaveLength(1);
      expect(result.warnings.some((w) => w.code === WarningCode.Merged)).toBe(
        true
      );
    });
  });
});
