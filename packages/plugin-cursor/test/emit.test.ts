import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import { CustomizationType, type GlobalPrompt, createId } from '@a16n/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use a temp directory for emission tests
const tempDir = path.join(__dirname, '.temp-emit-test');

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
    it('should emit a single GlobalPrompt as .mdc file', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'CLAUDE.md',
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
          content: 'First rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'second.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'second.md',
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
          content: 'Nested content',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Sanitizer removes extension and converts to lowercase
      expect(filename).toBe('claude.mdc');
    });

    it('should handle special characters in filenames', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'My Rules (v2).md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'My Rules (v2).md',
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
