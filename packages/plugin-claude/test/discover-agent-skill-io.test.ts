import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { CustomizationType, type AgentSkillIO } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('AgentSkillIO Discovery', () => {
  /**
   * Tests for discovering complex skills that have extra files (no hooks).
   * Skills with hooks are SKIPPED (not supported by AgentSkills.io).
   * Skills with extra files but no hooks should be classified as AgentSkillIO.
   */
  describe('skills with hooks → SKIPPED (not supported)', () => {
    it('should skip skills with hooks and emit warning', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      // secure-deploy has hooks, so it should be skipped
      const secureDeploySkill = result.items.find(i => i.sourcePath.includes('secure-deploy'));
      expect(secureDeploySkill).toBeUndefined();

      // Should have a warning about hooks not being supported
      const hooksWarning = result.warnings.find(
        w => w.message.toLowerCase().includes('hooks') && w.message.includes('secure-deploy'),
      );
      expect(hooksWarning).toBeDefined();
      expect(hooksWarning?.message).toContain('Hooks are not supported');
    });
  });

  describe('complex skills with extra files (no hooks) → AgentSkillIO', () => {
    it('should discover AgentSkillIO from skill with extra files but no hooks', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const agentSkillIO = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      );
      expect(agentSkillIO).toBeDefined();
      expect(agentSkillIO?.type).toBe(CustomizationType.AgentSkillIO);
    });

    it('should include all extra files in AgentSkillIO.files map', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      expect(Object.keys(skill.files)).toContain('schema.sql');
      expect(Object.keys(skill.files)).toContain('migration-guide.md');
      expect(skill.files['schema.sql']).toContain('CREATE TABLE');
      expect(skill.files['migration-guide.md']).toContain('Migration Guide');
    });

    it('should extract skill name from frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.name).toBe('database-migrations');
    });

    it('should extract description from frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.description).toBe('Database migration workflows and schema management');
    });

    it('should include SKILL.md content in AgentSkillIO.content', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.content).toContain('Database Migrations Skill');
      expect(skill.content).toContain('database migration workflows');
    });

    it('should list resource filenames in AgentSkillIO.resources', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.resources).toBeDefined();
      expect(skill.resources).toContain('schema.sql');
      expect(skill.resources).toContain('migration-guide.md');
      expect(skill.resources).toContain('scripts/migrate.sh');
    });

    it('should recursively read files in subdirectories (scripts/, references/, etc.)', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('database-migrations'),
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      // Subdirectory file should be keyed with relative path
      expect(Object.keys(skill.files)).toContain('scripts/migrate.sh');
      expect(skill.files['scripts/migrate.sh']).toContain('Running database migration');
    });
  });

  describe('simple skills remain as SimpleAgentSkill', () => {
    it('should classify skill without hooks and no extra files as SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const simpleSkill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('simple-testing'),
      );
      expect(simpleSkill).toBeDefined();
      expect(simpleSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    });
  });

  describe('mixed simple and complex skills', () => {
    it('should correctly classify simple skills and AgentSkillIO (skip hooks)', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      // Should have one AgentSkillIO (database-migrations) and one SimpleAgentSkill (simple-testing)
      // secure-deploy should be SKIPPED (has hooks)
      const agentSkillIO = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      const simpleSkills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);

      expect(agentSkillIO).toHaveLength(1);
      expect(simpleSkills).toHaveLength(1);
      expect(agentSkillIO[0]?.sourcePath).toContain('database-migrations');
      expect(simpleSkills[0]?.sourcePath).toContain('simple-testing');
    });
  });

  describe('backward compatibility', () => {
    it('should skip skills with hooks and emit warning', async () => {
      // Skills with hooks are NOT supported by AgentSkills.io
      // They should be skipped with a warning
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // The skill with hooks should be skipped, not discovered
      const agentSkillIO = result.items.find(i => i.type === CustomizationType.AgentSkillIO);
      expect(agentSkillIO).toBeUndefined();

      // Should have a warning about hooks not being supported
      const hooksWarning = result.warnings.find(w => w.message.toLowerCase().includes('hooks'));
      expect(hooksWarning).toBeDefined();
      expect(hooksWarning?.message).toContain('Hooks are not supported');
    });
  });
});
