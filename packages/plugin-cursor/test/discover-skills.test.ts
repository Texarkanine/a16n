import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType, WarningCode, type ManualPrompt } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('Cursor Skills Discovery', () => {
  describe('skills with description → SimpleAgentSkill', () => {
    it('should discover SimpleAgentSkill from .cursor/skills/*/SKILL.md with description', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.sourcePath).toBe('.cursor/skills/deploy/SKILL.md');
    });

    it('should extract description from skill frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Helps with deploying services to production');
    });

    it('should use name from frontmatter in metadata', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skill?.metadata?.name).toBe('deploy-service');
    });
  });

  describe('skills with disable-model-invocation → ManualPrompt', () => {
    it('should discover ManualPrompt from skill with disable-model-invocation: true', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const manualPrompts = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(manualPrompts).toHaveLength(1);
      expect(manualPrompts[0]?.sourcePath).toBe('.cursor/skills/reset-db/SKILL.md');
    });

    it('should derive promptName from directory name, not frontmatter name', async () => {
      // Directory is 'reset-db'; frontmatter name is 'Database Reset' — they diverge
      // to prove promptName comes from the directory, not the frontmatter field.
      // Frontmatter name is preserved in metadata.name for display purposes.
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt) as ManualPrompt;
      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('reset-db');
      expect(prompt.metadata?.name).toBe('Database Reset');
    });
  });

  describe('skills without description or disable-model-invocation → skip', () => {
    it('should skip skill without description or disable-model-invocation and emit warning', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should not be discovered as any type
      const invalidSkill = result.items.find(i => i.sourcePath.includes('invalid-skill'));
      expect(invalidSkill).toBeUndefined();

      // Should have warning
      const warning = result.warnings.find(w => w.message.includes('invalid-skill'));
      expect(warning).toBeDefined();
      expect(warning?.code).toBe(WarningCode.Skipped);
    });
  });

  describe('missing .cursor/skills/ directory', () => {
    it('should handle missing skills directory gracefully', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should not crash, just no skills
      const skills = result.items.filter(
        i =>
          i.type === CustomizationType.SimpleAgentSkill ||
          (i.type === CustomizationType.ManualPrompt && i.sourcePath.includes('skills')),
      );
      expect(skills).toHaveLength(0);
    });
  });

  describe('skill name field (invocation name)', () => {
    it('should set name from directory name on SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.name).toBe('deploy');
    });
  });

  describe('recursive skill discovery (nested directories)', () => {
    it('should discover skills nested under category directories', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill[];
      expect(skills).toHaveLength(2);

      const names = skills.map(s => s.name).sort();
      expect(names).toEqual(['banana', 'tomato']);
    });

    it('should set correct sourcePath for nested skills', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill[];
      const tomato = skills.find(s => s.name === 'tomato');
      expect(tomato).toBeDefined();
      expect(tomato!.sourcePath).toBe('.cursor/skills/veggies/tomato/SKILL.md');
    });

    it('should set name from immediate parent directory, not category', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill[];
      const tomato = skills.find(s => s.name === 'tomato');
      expect(tomato).toBeDefined();
      expect(tomato!.name).toBe('tomato');
    });
  });
});
