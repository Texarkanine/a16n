import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import { CustomizationType } from '@a16n/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('Cursor Plugin Discovery', () => {
  describe('basic .mdc file', () => {
    it('should discover a single GlobalPrompt from alwaysApply: true rule', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.items[0]?.sourcePath).toBe('.cursor/rules/general.mdc');
      expect(result.items[0]?.content).toContain('Use TypeScript for all new files');
      expect(result.items[0]?.content).toContain('Prefer functional components');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('multiple .mdc files', () => {
    it('should discover all GlobalPrompt items from multiple files', async () => {
      const root = path.join(fixturesDir, 'cursor-multiple/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(3);
      
      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got all three files
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('.cursor/rules/style.mdc');
      expect(sourcePaths).toContain('.cursor/rules/testing.mdc');
      expect(sourcePaths).toContain('.cursor/rules/patterns.mdc');
    });
  });

  describe('empty project', () => {
    it('should return empty items for project with no rules', async () => {
      const root = path.join(fixturesDir, 'cursor-empty/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('MDC Parsing', () => {
  it('should parse frontmatter correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    expect(item?.metadata).toHaveProperty('alwaysApply', true);
  });

  it('should extract body content without frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    // Content should not include the frontmatter delimiters
    expect(item?.content).not.toContain('---');
    expect(item?.content).not.toContain('alwaysApply');
  });
});
