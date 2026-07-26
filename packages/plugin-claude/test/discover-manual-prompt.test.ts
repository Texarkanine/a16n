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

  describe('AgentSkills.io spec fields', () => {
    /**
     * The highest-stakes discover case: a `disable-model-invocation` skill
     * classifies as ManualPrompt, so if ManualPrompt did not carry the spec
     * fields, a manual skill's `allowed-tools` would be lost with no warning
     * anywhere in the pipeline.
     */
    it('should populate all four spec fields on a ManualPrompt', async () => {
      const root = path.join(fixturesDir, 'claude-skills-spec-fields/from-claude');
      const result = await claudePlugin.discover(root);

      const prompt = result.items.find(
        i => i.type === CustomizationType.ManualPrompt
      ) as ManualPrompt;

      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('manual-spec');
      expect(prompt.license).toBe('Proprietary. LICENSE.txt has complete terms');
      expect(prompt.compatibility).toBe('Requires a POSIX shell');
      expect(prompt.specMetadata).toEqual({ author: 'Texarkanine' });
      expect(prompt.allowedTools).toBe('Bash(rm:*)');
    });

    it('should preserve authored description on a ManualPrompt', async () => {
      const root = path.join(fixturesDir, 'claude-skills-spec-fields/from-claude');
      const result = await claudePlugin.discover(root);

      const prompt = result.items.find(
        i => i.type === CustomizationType.ManualPrompt
      ) as ManualPrompt;

      expect(prompt).toBeDefined();
      expect(prompt.description).toBe(
        'A manual-invocation skill carrying every optional spec field'
      );
    });
  });
});
