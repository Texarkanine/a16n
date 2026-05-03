import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType, type AgentSkillIO } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('AgentSkillIO Discovery', () => {
  /**
   * Tests for discovering complex skills that have extra files in their directory.
   * Skills with additional resources (checklist.md, config.json, etc.) should be
   * classified as AgentSkillIO instead of SimpleAgentSkill.
   */
  describe('complex skills with extra files → AgentSkillIO', () => {
    it('should discover AgentSkillIO from skill with extra files', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const agentSkillIO = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      );
      expect(agentSkillIO).toBeDefined();
      expect(agentSkillIO?.type).toBe(CustomizationType.AgentSkillIO);
    });

    it('should include all extra files in AgentSkillIO.files map', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      expect(Object.keys(skill.files)).toContain('checklist.md');
      expect(Object.keys(skill.files)).toContain('config.json');
      expect(skill.files['checklist.md']).toContain('Pre-Deployment Checklist');
      expect(skill.files['config.json']).toContain('"environment": "production"');
    });

    it('should extract skill name from frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      // name is the directory name (invocation name), not the frontmatter display name
      expect(skill.name).toBe('deploy');
      // frontmatter name is preserved in metadata for display purposes
      expect(skill.metadata?.name).toBe('deploy-service');
    });

    it('should extract description from frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.description).toBe('Helps deploy services to production with checklists and scripts');
    });

    it('should include SKILL.md content in AgentSkillIO.content', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.content).toContain('Deploy Service Skill');
      expect(skill.content).toContain('Refer to the included resources for guidance');
    });

    it('should list resource filenames in AgentSkillIO.resources', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.resources).toBeDefined();
      expect(skill.resources).toContain('checklist.md');
      expect(skill.resources).toContain('config.json');
      expect(skill.resources).toContain('scripts/deploy.sh');
    });

    it('should recursively read files in subdirectories (scripts/, references/, etc.)', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      // Subdirectory file should be keyed with relative path
      expect(Object.keys(skill.files)).toContain('scripts/deploy.sh');
      expect(skill.files['scripts/deploy.sh']).toContain('Deploying to production');
    });
  });

  describe('simple skills remain as SimpleAgentSkill', () => {
    it('should classify skill with only SKILL.md as SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const simpleSkill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('simple'),
      );
      expect(simpleSkill).toBeDefined();
      expect(simpleSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    });
  });

  describe('mixed simple and complex skills', () => {
    it('should correctly classify both simple and complex skills', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should have one AgentSkillIO (deploy) and one SimpleAgentSkill (simple)
      const agentSkillIO = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      const simpleSkills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);

      expect(agentSkillIO).toHaveLength(1);
      expect(simpleSkills).toHaveLength(1);
      expect(agentSkillIO[0]?.sourcePath).toContain('deploy');
      expect(simpleSkills[0]?.sourcePath).toContain('simple');
    });
  });
});
