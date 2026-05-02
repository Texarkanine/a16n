import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type FileRule,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'filename-case');

describe('filename case preservation', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('FileRule preserves source filename case', () => {
    it('should preserve CamelCase stem when emitting FileRule', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.claude/rules/activeContext.md'),
          type: CustomizationType.FileRule,
          sourcePath: '.claude/rules/activeContext.md',
          content: 'Active context.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toBe(path.join(tempDir, '.cursor', 'rules', 'activeContext.mdc'));
    });

    it('should preserve case in multi-part stems (dots → hyphens)', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'foo.Bar.Baz.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'foo.Bar.Baz.md',
          content: 'Dotted content.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toBe(path.join(tempDir, '.cursor', 'rules', 'foo-Bar-Baz.mdc'));
    });
  });

  describe('GlobalPrompt preserves name case', () => {
    it('should preserve CamelCase name when emitting GlobalPrompt', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'productContext.md'),
          type: CustomizationType.GlobalPrompt,
          name: 'productContext',
          sourcePath: 'productContext.md',
          content: 'Product context.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toBe(path.join(tempDir, '.cursor', 'rules', 'productContext.mdc'));
    });
  });

  describe('case-insensitive collision safety', () => {
    it('should treat case-only differences as collisions for FileRules', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'activeContext.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'activeContext.md',
          content: 'CamelCase content.',
          globs: ['**/*'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, 'activecontext.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'activecontext.md',
          content: 'lowercase content.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      const paths = result.written.map(w => w.path);
      const uniqueLower = new Set(paths.map(p => p.toLowerCase()));
      expect(uniqueLower.size).toBe(2);

      expect(paths.some(p => p.endsWith(path.sep + 'activeContext.mdc'))).toBe(true);
      expect(paths.some(p => p.endsWith(path.sep + 'activecontext-2.mdc'))).toBe(true);
    });

    it('should NOT treat truly different names as collisions', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'activeContext.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'activeContext.md',
          content: 'Context.',
          globs: ['**/*'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, 'foo.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'foo.md',
          content: 'Foo.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      const paths = result.written.map(w => w.path);
      expect(paths.some(p => p.endsWith(path.sep + 'activeContext.mdc'))).toBe(true);
      expect(paths.some(p => p.endsWith(path.sep + 'foo.mdc'))).toBe(true);
    });
  });
});
