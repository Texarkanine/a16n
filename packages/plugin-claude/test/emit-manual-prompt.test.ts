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

const tempDir = suiteTempDir(import.meta.url, 'manual-prompt');

describe('Claude ManualPrompt Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single ManualPrompt', () => {
    it('should emit ManualPrompt as .claude/skills/*/SKILL.md', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review this code for security vulnerabilities.',
          promptName: 'review',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.ManualPrompt);

      // Verify skill file was created
      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Review this code for security vulnerabilities.');
    });

    it('should include name in skill frontmatter', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review content',
          promptName: 'review',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name: "review"');
    });

    it('should include description for slash invocation', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review content',
          promptName: 'review',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('description:');
      expect(content).toContain('/review');
    });

    it('should include disable-model-invocation: true in frontmatter', async () => {
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

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'deploy', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('disable-model-invocation: true');
    });
  });

  describe('multiple ManualPrompts', () => {
    it('should create separate skill directories for each prompt', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review content',
          promptName: 'review',
          metadata: {},
        },
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/explain.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/explain.md',
          content: 'Explain content',
          promptName: 'explain',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both skill directories exist
      const reviewContent = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md'),
        'utf-8'
      );
      const explainContent = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'explain', 'SKILL.md'),
        'utf-8'
      );

      expect(reviewContent).toContain('Review content');
      expect(explainContent).toContain('Explain content');
    });

    it('should handle prompt name collisions', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'First review',
          promptName: 'review',
          metadata: {},
        },
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/shared/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/shared/review.md',
          content: 'Second review',
          promptName: 'review',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // First should be 'review', second should be 'review-1'
      const reviewPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const review1Path = path.join(tempDir, '.claude', 'skills', 'review-1', 'SKILL.md');

      const reviewContent = await fs.readFile(reviewPath, 'utf-8');
      const review1Content = await fs.readFile(review1Path, 'utf-8');

      expect(reviewContent).toContain('First review');
      expect(review1Content).toContain('Second review');
    });
  });

  describe('mixed with other types', () => {
    it('should emit ManualPrompt alongside GlobalPrompt', async () => {
      const models = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'global.md'),
          type: CustomizationType.GlobalPrompt,
          name: 'global',
          sourcePath: 'global.md',
          content: 'Use TypeScript.',
          metadata: {},
        } as GlobalPrompt,
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review code.',
          promptName: 'review',
          metadata: {},
        } as ManualPrompt,
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify GlobalPrompt → .claude/rules/global.md
      const globalRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'global.md'), 'utf-8');
      expect(globalRule).toContain('Use TypeScript.');

      // Verify ManualPrompt → .claude/skills/review/SKILL.md
      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Review code.');
    });
  });

  describe('collision prevention with SimpleAgentSkills', () => {
    it('should prevent collisions when SimpleAgentSkill and ManualPrompt have same name', async () => {
      const models = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/review.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'review',
          sourcePath: '.cursor/rules/review.mdc',
          content: 'Skill content for review',
          description: 'Review skill',
          metadata: {},
        } as SimpleAgentSkill,
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Prompt content for review',
          promptName: 'review',
          metadata: {},
        } as ManualPrompt,
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Both should exist with unique names
      const skillsDir = path.join(tempDir, '.claude', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(2);
      expect(entries.sort()).toEqual(['review', 'review-1']);

      // Verify contents are different
      const reviewContent = await fs.readFile(
        path.join(skillsDir, 'review', 'SKILL.md'),
        'utf-8'
      );
      const review1Content = await fs.readFile(
        path.join(skillsDir, 'review-1', 'SKILL.md'),
        'utf-8'
      );

      // First should be skill (processed first), second should be prompt
      expect(reviewContent).toContain('Skill content for review');
      expect(review1Content).toContain('Prompt content for review');
    });
  });

  describe('prompt name sanitization (security)', () => {
    it('should sanitize prompt names with path traversal attempts', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/evil.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/evil.md',
          content: 'Malicious content',
          promptName: '../../../etc/passwd',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Should NOT create file outside .claude/skills/
      const skillsDir = path.join(tempDir, '.claude', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(1);
      // Name should be sanitized to safe characters only
      expect(entries[0]).not.toContain('..');
      expect(entries[0]).not.toContain('/');
    });

    it('should sanitize prompt names with backslash path separators', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/evil.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/evil.md',
          content: 'Malicious content',
          promptName: '..\\..\\..\\etc\\passwd',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Should NOT create file outside .claude/skills/
      const skillsDir = path.join(tempDir, '.claude', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).not.toContain('\\');
    });

    it('should use fallback name for empty sanitized prompt name', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/special.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/special.md',
          content: 'Content',
          promptName: '!!!',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Should use fallback name 'command'
      const skillPath = path.join(tempDir, '.claude', 'skills', 'command', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Content');
    });
  });
});

