import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { CustomizationType, type ManualPrompt } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('Claude ManualPrompt Discovery', () => {
  describe('skills with disable-model-invocation: true', () => {
    it('should discover ManualPrompt from skill with disable-model-invocation: true', async () => {
      const root = path.join(fixturesDir, 'claude-skills-manual/from-claude');
      const result = await claudePlugin.discover(root);

      const manualPrompts = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(manualPrompts).toHaveLength(1);
      expect(manualPrompts[0]?.sourcePath).toBe('.claude/skills/manual-task/SKILL.md');
    });

    it('should derive promptName from skill directory name', async () => {
      const root = path.join(fixturesDir, 'claude-skills-manual/from-claude');
      const result = await claudePlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt) as ManualPrompt;
      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('manual-task');
    });

    it('should include skill content in ManualPrompt', async () => {
      const root = path.join(fixturesDir, 'claude-skills-manual/from-claude');
      const result = await claudePlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt);
      expect(prompt?.content).toContain('Manual Task Instructions');
    });
  });

  describe('regular skills still work as SimpleAgentSkill', () => {
    it('should still discover regular skills without flag as SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
    });
  });
});
