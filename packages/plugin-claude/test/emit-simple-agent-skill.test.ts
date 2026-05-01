import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'simple-agent-skill');

describe('Claude SimpleAgentSkill Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single SimpleAgentSkill', () => {
    it('should create skill directory and SKILL.md file', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should include description in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('---');
      // Description is quoted for YAML safety
      expect(content).toContain('description: "Authentication patterns"');
    });
  });

  describe('multiple SimpleAgentSkills', () => {
    it('should create separate skill directories for each', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Auth content',
          description: 'Auth patterns',
          metadata: {},
        },
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/database.mdc'),
          name: 'database',
          type: CustomizationType.SimpleAgentSkill,
          sourcePath: '.cursor/rules/database.mdc',
          content: 'Database content',
          description: 'Database patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const authPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const dbPath = path.join(tempDir, '.claude', 'skills', 'database', 'SKILL.md');
      
      const authContent = await fs.readFile(authPath, 'utf-8');
      const dbContent = await fs.readFile(dbPath, 'utf-8');
      
      expect(authContent).toContain('Auth content');
      expect(dbContent).toContain('Database content');
    });
  });

  describe('skill name in frontmatter', () => {
    it('should include name from metadata in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: { name: 'Auth Helper' },
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name: "Auth Helper"');
      expect(content).toContain('description: "Authentication patterns"');
    });

    it('should include skill.name in frontmatter when metadata.name is absent', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name: "auth"');
      expect(content).toContain('description: "Authentication patterns"');
    });
  });

  describe('skill directory naming from name field', () => {
    it('should use skill.name for the output directory when present', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/skills/banana/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          sourcePath: '.cursor/skills/banana/SKILL.md',
          name: 'banana',
          content: 'Print a banana emoji.',
          description: 'Helps you visualize yellow fruits',
          metadata: { name: 'Banana Printer' },
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'banana', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Print a banana emoji.');
      expect(content).toContain('description: "Helps you visualize yellow fruits"');
    });

    it('should use skill.name for output directory', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT.',
          description: 'Auth patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT.');
    });
  });
});

