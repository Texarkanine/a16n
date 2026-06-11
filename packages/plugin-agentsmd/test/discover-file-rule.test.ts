import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import agentsmdPlugin from '../src/index.js';
import { CustomizationType, type FileRule } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';
import { suiteTempDir } from './test-support/emit-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);
const tempDir = suiteTempDir(import.meta.url, 'discover-excluded');

describe('AGENTS.md Plugin Discovery (nested → FileRule)', () => {
  describe('nested AGENTS.md files', () => {
    it('should discover nested AGENTS.md as a FileRule with a directory-shaped glob', async () => {
      const root = path.join(fixturesDir, 'agentsmd-nested/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      const webRule = result.items.find(i => i.sourcePath === 'web/AGENTS.md') as FileRule;
      expect(webRule).toBeDefined();
      expect(webRule.type).toBe(CustomizationType.FileRule);
      expect(webRule.globs).toEqual(['web/**']);
      expect(webRule.relativeDir).toBe('web');
      expect(webRule.content).toContain('Use React function components only.');
    });

    it('should handle deep nesting with POSIX separators', async () => {
      const root = path.join(fixturesDir, 'agentsmd-nested/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      const deepRule = result.items.find(
        i => i.sourcePath === 'packages/foo/src/AGENTS.md'
      ) as FileRule;
      expect(deepRule).toBeDefined();
      expect(deepRule.type).toBe(CustomizationType.FileRule);
      expect(deepRule.globs).toEqual(['packages/foo/src/**']);
      expect(deepRule.relativeDir).toBe('packages/foo/src');
      expect(deepRule.metadata).toHaveProperty('nested', true);
      expect(deepRule.metadata).toHaveProperty('depth', 3);
    });

    it('should discover root and all nested AGENTS.md files together', async () => {
      const root = path.join(fixturesDir, 'agentsmd-nested/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      expect(result.items).toHaveLength(3);
      const types = result.items.map(i => i.type).sort();
      expect(types).toEqual([
        CustomizationType.FileRule,
        CustomizationType.FileRule,
        CustomizationType.GlobalPrompt,
      ]);
      expect(result.warnings).toHaveLength(0);
    });

    it('should not discover other markdown files', async () => {
      const root = path.join(fixturesDir, 'agentsmd-nested/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).not.toContain('docs/README.md');
    });
  });

  describe('excluded directories', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, 'AGENTS.md'), 'Root instructions.\n');
      await fs.mkdir(path.join(tempDir, 'node_modules', 'some-dep'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'node_modules', 'some-dep', 'AGENTS.md'),
        'Dependency instructions; must not be discovered.\n'
      );
      await fs.mkdir(path.join(tempDir, '.cursor'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor', 'AGENTS.md'),
        'Hidden-directory instructions; must not be discovered.\n'
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should skip node_modules and dot-directories', async () => {
      const result = await agentsmdPlugin.discover(tempDir);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.sourcePath).toBe('AGENTS.md');
      expect(result.warnings).toHaveLength(0);
    });
  });
});
