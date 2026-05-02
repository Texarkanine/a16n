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

const tempDir = suiteTempDir(import.meta.url, 'manual-prompt');

describe('Cursor ManualPrompt Emission (Commands)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single ManualPrompt', () => {
    it('should emit ManualPrompt as .cursor/commands/<name>.md file', async () => {
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.ManualPrompt);

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'review.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).toBe('Review this code for security vulnerabilities.');
    });

    it('should create .cursor/commands directory if it does not exist', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/test.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/test.md',
          content: 'Test content',
          promptName: 'test',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const commandsDir = path.join(tempDir, '.cursor', 'commands');
      const stat = await fs.stat(commandsDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should write ManualPrompt content directly without frontmatter', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.claude/skills/deploy/SKILL.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.claude/skills/deploy/SKILL.md',
          content: 'Deploy instructions here.',
          promptName: 'deploy',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'deploy.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).not.toContain('---');
      expect(content).not.toContain('disable-model-invocation');
      expect(content).toBe('Deploy instructions here.');
    });
  });

  describe('multiple ManualPrompts', () => {
    it('should emit multiple commands as separate .md files', async () => {
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      const reviewContent = await fs.readFile(
        path.join(tempDir, '.cursor', 'commands', 'review.md'),
        'utf-8'
      );
      const explainContent = await fs.readFile(
        path.join(tempDir, '.cursor', 'commands', 'explain.md'),
        'utf-8'
      );

      expect(reviewContent).toBe('Review content');
      expect(explainContent).toBe('Explain content');
    });
  });

  describe('relativeDir nesting', () => {
    it('should emit ManualPrompt with relativeDir to subdirectory under .cursor/commands/', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/frontend/component.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/frontend/component.md',
          relativeDir: 'frontend',
          content: 'Generate a React component.',
          promptName: 'component',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'frontend', 'component.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).toBe('Generate a React component.');
    });

    it('should detect collision between equivalent relativeDir forms (trailing slash)', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/frontend/component.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/frontend/component.md',
          relativeDir: 'frontend',
          content: 'First component prompt',
          promptName: 'component',
          metadata: {},
        },
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/frontend-v2/component.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/frontend-v2/component.md',
          relativeDir: 'frontend/',
          content: 'Second component prompt',
          promptName: 'component',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      // Both items written — second renamed to avoid overwrite
      expect(result.written).toHaveLength(2);

      const firstPath = path.join(tempDir, '.cursor', 'commands', 'frontend', 'component.md');
      const firstContent = await fs.readFile(firstPath, 'utf-8');
      expect(firstContent).toBe('First component prompt');

      const secondPath = path.join(tempDir, '.cursor', 'commands', 'frontend', 'component-1.md');
      const secondContent = await fs.readFile(secondPath, 'utf-8');
      expect(secondContent).toBe('Second component prompt');

      // Collision warning emitted
      const collisionWarnings = result.warnings.filter(w => w.message.includes('collision'));
      expect(collisionWarnings).toHaveLength(1);
    });

    it('should skip ManualPrompt with path-traversal relativeDir', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/evil.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/evil.md',
          relativeDir: '../../etc',
          content: 'Malicious',
          promptName: 'evil',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe('skipped');
    });
  });

  describe('mixed with other types', () => {
    it('should emit ManualPrompt alongside GlobalPrompt', async () => {
      const models = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'global.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'global.md',
          name: 'global',
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      const rulesExist = await fs.stat(path.join(tempDir, '.cursor', 'rules')).catch(() => null);
      const commandExists = await fs.stat(path.join(tempDir, '.cursor', 'commands', 'review.md')).catch(() => null);

      expect(rulesExist).not.toBeNull();
      expect(commandExists).not.toBeNull();
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const commandsDir = path.join(tempDir, '.cursor', 'commands');
      const entries = await fs.readdir(commandsDir);
      expect(entries).toHaveLength(1);
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const commandsDir = path.join(tempDir, '.cursor', 'commands');
      const entries = await fs.readdir(commandsDir);
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const commandPath = path.join(tempDir, '.cursor', 'commands', 'command.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).toBe('Content');
    });

    it('should handle prompt name collisions with de-duplication', async () => {
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      const commandsDir = path.join(tempDir, '.cursor', 'commands');
      const entries = await fs.readdir(commandsDir);
      expect(entries.sort()).toEqual(['review-1.md', 'review.md']);
    });
  });
});
