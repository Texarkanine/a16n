import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type SimpleAgentSkill,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'skills');

describe('Cursor Skills Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('SimpleAgentSkill emission to .cursor/skills/', () => {
    it('should emit SimpleAgentSkill to .cursor/skills/<name>/SKILL.md', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/auth/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth-helper',
          sourcePath: '.claude/skills/auth/SKILL.md',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.SimpleAgentSkill);

      // Verify skill directory structure
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'auth-helper', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should include name and description in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/db/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'database',
          sourcePath: '.claude/skills/db/SKILL.md',
          content: 'Database operations',
          description: 'Database helper',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'database', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('Database helper');
    });

    it('should sanitize skill names for directory creation', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/weird/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'My Skill (v2)',
          sourcePath: '.claude/skills/weird/SKILL.md',
          content: 'Content',
          description: 'Test',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      // Name should be sanitized
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toBe('my-skill-v2');
    });
  });

  describe('collision handling', () => {
    it('should not collide between SimpleAgentSkill and ManualPrompt with same name', async () => {
      const models = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/review/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'review',
          sourcePath: '.claude/skills/review/SKILL.md',
          content: 'Skill content',
          description: 'Review skill',
          metadata: {},
        } as SimpleAgentSkill,
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Prompt content',
          promptName: 'review',
          metadata: {},
        } as ManualPrompt,
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Both now emit to .cursor/skills/ namespace; collision de-dupes the ManualPrompt
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Skill content');

      const manualPath = path.join(tempDir, '.cursor', 'skills', 'review-1', 'SKILL.md');
      const manualContent = await fs.readFile(manualPath, 'utf-8');
      expect(manualContent).toContain('Prompt content');

      // Collision warning emitted (unified skill namespace post-migration)
      const collisionWarnings = result.warnings.filter(w => w.message.includes('collision'));
      expect(collisionWarnings).toHaveLength(1);
    });
  });
});
