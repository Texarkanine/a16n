import { describe, it, expect } from 'vitest';
import * as path from 'path';
import agentsmdPlugin from '../src/index.js';
import { CustomizationType, CURRENT_IR_VERSION, type GlobalPrompt } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('AGENTS.md Plugin Discovery (GlobalPrompt)', () => {
  describe('plugin definition', () => {
    it('should expose id, name, and supported types', () => {
      expect(agentsmdPlugin.id).toBe('agentsmd');
      expect(agentsmdPlugin.name).toBe('AGENTS.md');
      expect(agentsmdPlugin.supports).toEqual([
        CustomizationType.GlobalPrompt,
        CustomizationType.FileRule,
      ]);
    });

    it('should not declare pathPatterns (AGENTS.md files live anywhere in the tree)', () => {
      expect(agentsmdPlugin.pathPatterns).toBeUndefined();
    });
  });

  describe('root AGENTS.md', () => {
    it('should discover a single GlobalPrompt from root AGENTS.md', async () => {
      const root = path.join(fixturesDir, 'agentsmd-basic/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      expect(result.items).toHaveLength(1);
      const item = result.items[0] as GlobalPrompt;
      expect(item.type).toBe(CustomizationType.GlobalPrompt);
      expect(item.sourcePath).toBe('AGENTS.md');
      expect(item.name).toBe('AGENTS');
      expect(item.version).toBe(CURRENT_IR_VERSION);
      expect(item.content).toContain('Always use async/await over promises.');
      expect(item.relativeDir).toBeUndefined();
      expect(result.warnings).toHaveLength(0);
    });

    it('should mark the root file as not nested', async () => {
      const root = path.join(fixturesDir, 'agentsmd-basic/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      expect(result.items[0]?.metadata).toHaveProperty('nested', false);
      expect(result.items[0]?.metadata).toHaveProperty('depth', 0);
    });
  });

  describe('empty project', () => {
    it('should return no items and no warnings when no AGENTS.md exists', async () => {
      const root = path.join(fixturesDir, 'agentsmd-empty/from-agentsmd');
      const result = await agentsmdPlugin.discover(root);

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
