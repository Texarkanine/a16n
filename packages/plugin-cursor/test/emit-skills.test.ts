import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
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
      expect(entries[0]).toMatch(/^[\w-]+$/);
    });
  });

  describe('ManualPrompt emission to .cursor/commands/', () => {
    it('should emit ManualPrompt to .cursor/commands/<name>.md', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.claude/skills/review/SKILL.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.claude/skills/review/SKILL.md',
          content: 'Review this code.',
          promptName: 'review',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.ManualPrompt);

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'review.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).toBe('Review this code.');
    });

    it('should write ManualPrompt content directly without frontmatter', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/deploy.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/deploy.md',
          content: 'Deploy instructions',
          promptName: 'deploy',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'deploy.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).not.toContain('---');
      expect(content).not.toContain('name:');
      expect(content).not.toContain('disable-model-invocation');
      expect(content).toBe('Deploy instructions');
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

      // Skill goes to .cursor/skills/, command goes to .cursor/commands/ — no collision
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Skill content');

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'review.md');
      const commandContent = await fs.readFile(commandPath, 'utf-8');
      expect(commandContent).toBe('Prompt content');

      // No collision warning (they're in different namespaces)
      const collisionWarnings = result.warnings.filter(w => w.message.includes('collision'));
      expect(collisionWarnings).toHaveLength(0);
    });
  });
});
