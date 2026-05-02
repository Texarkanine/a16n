import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type FileRule,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'file-rule');

describe('Cursor FileRule Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single FileRule', () => {
    it('should emit FileRule as .mdc with globs: frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.claude/skills/react/SKILL.md'),
          type: CustomizationType.FileRule,
          sourcePath: '.claude/skills/react/SKILL.md',
          content: 'Use React best practices.',
          globs: ['**/*.tsx', '**/*.jsx'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.unsupported).toHaveLength(0);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      expect(content).toContain('globs:');
      expect(content).toContain('**/*.tsx');
      expect(content).toContain('**/*.jsx');
    });

    it('should include rule content after frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'react.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'react.md',
          content: 'Use React best practices.',
          globs: ['**/*.tsx'],
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const files = await fs.readdir(path.join(tempDir, '.cursor', 'rules'));
      expect(files).toHaveLength(1);
      
      const content = await fs.readFile(
        path.join(tempDir, '.cursor', 'rules', files[0]!),
        'utf-8'
      );
      expect(content).toContain('Use React best practices.');
    });

    it('should format multiple globs as comma-separated string', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'react.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'react.md',
          content: 'Content',
          globs: ['**/*.tsx', '**/*.jsx', 'src/components/**'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      // Globs should be on a single line, comma-separated
      expect(content).toMatch(/globs:.*\*\*\/\*\.tsx.*\*\*\/\*\.jsx.*src\/components\/\*\*/);
    });
  });
});
