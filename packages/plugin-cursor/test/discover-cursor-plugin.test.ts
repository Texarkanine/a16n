import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

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

    it('should set name from source filename (without extension) on GlobalPrompt', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(1);
      const gp = result.items[0];
      expect(gp?.type).toBe(CustomizationType.GlobalPrompt);
      if (gp?.type === CustomizationType.GlobalPrompt) {
        // sourcePath is '.cursor/rules/general.mdc' → name should be 'general'
        expect(gp.name).toBe('general');
      }
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

  describe('nested subdirectories', () => {
    it('should discover rules in subdirectories like shared/ and local/', async () => {
      const root = path.join(fixturesDir, 'cursor-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should find 3 rules: root.mdc, shared/core.mdc, local/project.mdc
      expect(result.items).toHaveLength(3);

      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got all three files with correct paths
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('.cursor/rules/root.mdc');
      expect(sourcePaths).toContain('.cursor/rules/shared/core.mdc');
      expect(sourcePaths).toContain('.cursor/rules/local/project.mdc');
    });

    it('should set relativeDir from subdirectory path on nested rules', async () => {
      // Rules in subdirectories should have relativeDir set to the directory
      // portion of their path under .cursor/rules/ (e.g., 'shared', 'local')
      const root = path.join(fixturesDir, 'cursor-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const rootRule = result.items.find(i => i.sourcePath === '.cursor/rules/root.mdc');
      const sharedRule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/core.mdc');
      const localRule = result.items.find(i => i.sourcePath === '.cursor/rules/local/project.mdc');

      expect(rootRule?.relativeDir).toBeUndefined();
      expect(sharedRule?.relativeDir).toBe('shared');
      expect(localRule?.relativeDir).toBe('local');
    });

    it('should set relativeDir for deeply nested rules preserving full subdirectory path', async () => {
      // Deep nesting like shared/niko/Core/ should be preserved in full
      const root = path.join(fixturesDir, 'cursor-nested-deep/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should find 3 rules across deep nesting
      expect(result.items).toHaveLength(3);

      const mainRule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/niko/main.mdc');
      const coreRule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/niko/Core/file-verification.mdc');
      const level1Rule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/niko/Level1/workflow-level1.mdc');

      expect(mainRule?.relativeDir).toBe('shared/niko');
      expect(coreRule?.relativeDir).toBe('shared/niko/Core');
      expect(level1Rule?.relativeDir).toBe('shared/niko/Level1');
    });

    it('should set relativeDir on all rule types (GlobalPrompt, FileRule, SimpleAgentSkill)', async () => {
      // The deep fixture has: GlobalPrompt (main.mdc), FileRule (file-verification.mdc),
      // SimpleAgentSkill (workflow-level1.mdc) — all nested, all should get relativeDir
      const root = path.join(fixturesDir, 'cursor-nested-deep/from-cursor');
      const result = await cursorPlugin.discover(root);

      const mainRule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/niko/main.mdc');
      const coreRule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/niko/Core/file-verification.mdc');
      const level1Rule = result.items.find(i => i.sourcePath === '.cursor/rules/shared/niko/Level1/workflow-level1.mdc');

      // Verify types
      expect(mainRule?.type).toBe(CustomizationType.GlobalPrompt);
      expect(coreRule?.type).toBe(CustomizationType.FileRule);
      expect(level1Rule?.type).toBe(CustomizationType.SimpleAgentSkill);

      // All should have relativeDir
      expect(mainRule?.relativeDir).toBeDefined();
      expect(coreRule?.relativeDir).toBeDefined();
      expect(level1Rule?.relativeDir).toBeDefined();
    });
  });
});
