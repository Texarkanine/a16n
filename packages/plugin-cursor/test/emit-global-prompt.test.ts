import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'global-prompt');

describe('Cursor Plugin Emission', () => {
  beforeEach(async () => {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single GlobalPrompt', () => {
    it('should emit GlobalPrompt using gp.name for output filename', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursorrules'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.cursorrules',
          name: 'cursorrules',
          content: 'My cursor rules.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);

      const filename = path.basename(result.written[0]!.path);
      expect(filename).toBe('cursorrules.mdc');
    });

    it('should emit a single GlobalPrompt as .mdc file', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'CLAUDE.md',
          name: 'CLAUDE',
          content: 'Always use TypeScript.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      // Verify file was created
      const writtenPath = result.written[0]?.path;
      expect(writtenPath).toBeDefined();
      
      const content = await fs.readFile(writtenPath!, 'utf-8');
      expect(content).toContain('alwaysApply: true');
      expect(content).toContain('Always use TypeScript.');
    });

    it('should create .cursor/rules directory if it does not exist', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'source.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'source.md',
          name: 'source',
          content: 'Test content',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const rulesDir = path.join(tempDir, '.cursor', 'rules');
      const stat = await fs.stat(rulesDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('multiple GlobalPrompts', () => {
    it('should emit multiple GlobalPrompts as separate .mdc files', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'first.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'first.md',
          name: 'first',
          content: 'First rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'second.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'second.md',
          name: 'second',
          content: 'Second rule',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);

      // Verify both files exist
      for (const written of result.written) {
        const content = await fs.readFile(written.path, 'utf-8');
        expect(content).toContain('alwaysApply: true');
      }
    });
  });

  describe('filename sanitization', () => {
    it('should generate safe filenames from source paths', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'path/to/CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'path/to/CLAUDE.md',
          name: 'CLAUDE',
          content: 'Nested content',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Sanitizer removes extension and preserves case (see task
      // 20260421-preserve-filename-case). Case is only lowercased for skill
      // directory names per the AgentSkills.io spec, not rule filenames.
      expect(filename).toBe('CLAUDE.mdc');
    });

    it('should handle special characters in filenames', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'My Rules (v2).md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'My Rules (v2).md',
          name: 'My Rules (v2)',
          content: 'Content',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Should be sanitized to safe characters
      expect(filename).toMatch(/^[\w-]+\.mdc$/);
    });

    it('should use fallback name when sanitization produces empty string', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '!!!.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '!!!.md',
          name: '!!!',
          content: 'Content from special-only filename',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Should fall back to 'rule' when sanitization produces empty
      expect(filename).toBe('rule.mdc');
    });

    it('should preserve multi-part stems (dots become hyphens, not stripped)', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'react.hooks.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'react.hooks.mdc',
          name: 'react.hooks',
          content: 'React hooks rules.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      expect(filename).toBe('react-hooks.mdc');
    });

    it('should handle filename collisions by appending counter', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'dir1/CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'dir1/CLAUDE.md',
          name: 'CLAUDE',
          content: 'First',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'dir2/CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'dir2/CLAUDE.md',
          name: 'CLAUDE',
          content: 'Second',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'dir3/claude.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'dir3/claude.md',
          name: 'claude',
          content: 'Third',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(3);

      // Case is preserved per-file; collisions are detected case-insensitively
      // (see task 20260421-preserve-filename-case). So the three `CLAUDE` /
      // `CLAUDE` / `claude` inputs produce three distinct filenames that
      // differ only by counter suffix. String sort puts uppercase before
      // lowercase.
      const filenames = result.written.map(w => path.basename(w.path)).sort();
      expect(filenames).toEqual(['CLAUDE-2.mdc', 'CLAUDE.mdc', 'claude-3.mdc']);

      // Verify each file has distinct content
      const contents = await Promise.all(
        result.written.map(w => fs.readFile(w.path, 'utf-8'))
      );
      expect(contents.some(c => c.includes('First'))).toBe(true);
      expect(contents.some(c => c.includes('Second'))).toBe(true);
      expect(contents.some(c => c.includes('Third'))).toBe(true);
    });

    it('should emit warning when filename collision occurs', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'a/test.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'a/test.md',
          name: 'test',
          content: 'First',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'b/test.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'b/test.md',
          name: 'test',
          content: 'Second',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('collision');
    });
  });

  describe('empty input', () => {
    it('should handle empty models array', async () => {
      const result = await cursorPlugin.emit([], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);
    });
  });
});
