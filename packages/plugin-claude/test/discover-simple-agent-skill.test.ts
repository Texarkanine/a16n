import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { CustomizationType, WarningCode, type SimpleAgentSkill } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);
const specFieldsRoot = 'claude-skills-spec-fields/from-claude';

describe('Claude SimpleAgentSkill Discovery', () => {
  describe('simple skills without hooks', () => {
    it('should discover SimpleAgentSkill from .claude/skills/*/SKILL.md', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.sourcePath).toBe('.claude/skills/testing/SKILL.md');
    });

    it('should extract description from skill frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Testing best practices');
    });

    it('should include skill content in SimpleAgentSkill items', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skill?.content).toContain('Write unit tests first');
    });
  });

  describe('skills with hooks (skipped — hooks unsupported)', () => {
    it('should skip skills with hooks and emit warning', async () => {
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // Skills with hooks should be SKIPPED (hooks not supported by AgentSkills.io)
      const agentSkillIO = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      expect(agentSkillIO).toHaveLength(0);

      // Should have a warning about hooks not being supported
      const hooksWarning = result.warnings.find(w => w.message.toLowerCase().includes('hooks'));
      expect(hooksWarning).toBeDefined();
      expect(hooksWarning?.code).toBe(WarningCode.Skipped);
      expect(hooksWarning?.message).toContain('Hooks are not supported');
    });

    it('should emit warning for skills with hooks', async () => {
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // Warning should be emitted - hooks are not supported
      const hooksWarning = result.warnings.find(w => w.message.toLowerCase().includes('hooks'));
      expect(hooksWarning).toBeDefined();
      expect(hooksWarning?.code).toBe(WarningCode.Skipped);
    });
  });

  describe('AgentSkills.io spec fields', () => {
    async function simpleSpecSkill(): Promise<SimpleAgentSkill> {
      const root = path.join(fixturesDir, specFieldsRoot);
      const result = await claudePlugin.discover(root);
      return result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath?.includes('simple-spec')
      ) as SimpleAgentSkill;
    }

    it('should populate all four spec fields', async () => {
      const skill = await simpleSpecSkill();

      expect(skill).toBeDefined();
      expect(skill.license).toBe('Apache-2.0');
      expect(skill.compatibility).toBe('Requires Python 3.14+ and uv');
      expect(skill.specMetadata).toEqual({ author: 'Texarkanine', version: '1.2.0' });
      expect(skill.allowedTools).toBe('Bash(git:*) Bash(jq:*) Read');
    });

    it('should not change classification (invariant 5)', async () => {
      const skill = await simpleSpecSkill();

      expect(skill.type).toBe(CustomizationType.SimpleAgentSkill);
    });

    it('should leave the spec fields undefined when absent', async () => {
      const root = path.join(fixturesDir, specFieldsRoot);
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath?.includes('no-spec')
      ) as SimpleAgentSkill;

      expect(skill).toBeDefined();
      expect(skill.license).toBeUndefined();
      expect(skill.compatibility).toBeUndefined();
      expect(skill.specMetadata).toBeUndefined();
      expect(skill.allowedTools).toBeUndefined();
    });

    it('should raise zero warnings for spec-compliant fields', async () => {
      // Regression guard: these are spec fields, so detectNonSpecFeatures must
      // not treat them as Claude-only extensions.
      const root = path.join(fixturesDir, specFieldsRoot);
      const result = await claudePlugin.discover(root);

      expect(result.warnings).toEqual([]);
    });
  });
});
