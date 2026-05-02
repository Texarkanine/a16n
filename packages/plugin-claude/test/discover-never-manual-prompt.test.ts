import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { CustomizationType } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('Claude Plugin Never Discovers ManualPrompt', () => {
  it('should never return ManualPrompt items from any discovery', async () => {
    // Test across multiple fixture directories
    const fixtureDirs = [
      'claude-basic/from-claude',
      'claude-nested/from-claude',
      'claude-skills/from-claude',
      'claude-ignore/from-claude',
    ];

    for (const dir of fixtureDirs) {
      const root = path.join(fixturesDir, dir);
      const result = await claudePlugin.discover(root);

      // No items should be of type ManualPrompt (Claude emits but never discovers)
      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(commands).toHaveLength(0);
    }
  });

  it('should only discover GlobalPrompt, SimpleAgentSkill, AgentSkillIO, FileRule, and AgentIgnore', async () => {
    const root = path.join(fixturesDir, 'claude-skills/from-claude');
    const result = await claudePlugin.discover(root);

    const validTypes = [
      CustomizationType.GlobalPrompt,
      CustomizationType.SimpleAgentSkill,
      CustomizationType.AgentSkillIO,
      CustomizationType.FileRule,
      CustomizationType.AgentIgnore,
    ];

    for (const item of result.items) {
      expect(validTypes).toContain(item.type);
    }
  });
});
