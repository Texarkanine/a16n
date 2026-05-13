import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'manual-prompt');

/**
 * Cursor ManualPrompt Emission (as Agent Skills)
 *
 * MIGRATION NOTE (Commands deprecation):
 * ManualPrompt items are now emitted as Agent Skills under `.cursor/skills/<name>/SKILL.md`
 * with `disable-model-invocation: true` frontmatter (matching Claude Code + Cursor's
 * new recommendation). Legacy `.cursor/commands/` discovery is retained for backward
 * compatibility, but Commands do not round-trip — emitted form is always a Skill.
 * This is an intentional discover/emit asymmetry per systemPatterns.md.
 *
 * Tests updated per TDD to expect the new Skill output format before implementation.
 * Non-roundtrip behavior is documented here, in emit.ts, discover.ts, and docs.
 */

describe('Cursor ManualPrompt Emission (Agent Skills)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single ManualPrompt', () => {
    it('should emit ManualPrompt as .cursor/skills/<name>/SKILL.md with disable frontmatter', async () => {
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

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const legacyCommandPath = path.join(tempDir, '.cursor', 'commands', 'review.md');
      const writtenPaths = result.written.map(w => w.path);
      expect(writtenPaths).toContain(skillPath);
      expect(writtenPaths).not.toContain(legacyCommandPath);

      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('disable-model-invocation: true');
      expect(content).toContain('Invoke with /review');
      expect(content).toContain('Review this code for security vulnerabilities.');
    });

    it('should create .cursor/skills/<name> directory if it does not exist', async () => {
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

      const skillDir = path.join(tempDir, '.cursor', 'skills', 'test');
      const stat = await fs.stat(skillDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should write ManualPrompt as Skill with disable-model-invocation frontmatter (not plain content)', async () => {
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

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'deploy', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('disable-model-invocation: true');
      expect(content).toContain('Deploy instructions here.');
    });
  });

  describe('multiple ManualPrompts', () => {
    it('should emit multiple ManualPrompts as separate Skill directories', async () => {
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
        path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md'),
        'utf-8'
      );
      const explainContent = await fs.readFile(
        path.join(tempDir, '.cursor', 'skills', 'explain', 'SKILL.md'),
        'utf-8'
      );

      expect(reviewContent).toContain('Review content');
      expect(explainContent).toContain('Explain content');
    });
  });

  describe('relativeDir nesting', () => {
    it('should emit ManualPrompt with relativeDir to subdirectory under .cursor/skills/', async () => {
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

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'frontend', 'component', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Generate a React component.');
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

      const firstPath = path.join(tempDir, '.cursor', 'skills', 'frontend', 'component', 'SKILL.md');
      const firstContent = await fs.readFile(firstPath, 'utf-8');
      expect(firstContent).toContain('First component prompt');

      const secondPath = path.join(tempDir, '.cursor', 'skills', 'frontend', 'component-1', 'SKILL.md');
      const secondContent = await fs.readFile(secondPath, 'utf-8');
      expect(secondContent).toContain('Second component prompt');

      // Collision warning emitted
      const collisionWarnings = result.warnings.filter(w => w.message.includes('collision'));
      expect(collisionWarnings).toHaveLength(1);
    });

    /**
     * Regression guard (PR #99 review feedback, P1):
     *
     * Two ManualPrompts with the same `promptName` but DIFFERENT `relativeDir`
     * values map to distinct on-disk paths and MUST NOT trigger a collision rename.
     * The unified `usedSkillNames` set introduced by the Commands→Skills migration
     * must key on the path under `.cursor/skills/`, not on the unqualified base name.
     */
    it('should NOT rename same promptName across different relativeDir values', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/frontend/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/frontend/review.md',
          relativeDir: 'frontend',
          content: 'Frontend review prompt',
          promptName: 'review',
          metadata: {},
        },
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/backend/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/backend/review.md',
          relativeDir: 'backend',
          content: 'Backend review prompt',
          promptName: 'review',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      const frontendPath = path.join(tempDir, '.cursor', 'skills', 'frontend', 'review', 'SKILL.md');
      const backendPath = path.join(tempDir, '.cursor', 'skills', 'backend', 'review', 'SKILL.md');

      const frontendContent = await fs.readFile(frontendPath, 'utf-8');
      const backendContent = await fs.readFile(backendPath, 'utf-8');

      expect(frontendContent).toContain('Frontend review prompt');
      expect(backendContent).toContain('Backend review prompt');

      // No `review-1` directories — paths were distinct, no rename should occur.
      const frontendDirEntries = await fs.readdir(path.join(tempDir, '.cursor', 'skills', 'frontend'));
      const backendDirEntries = await fs.readdir(path.join(tempDir, '.cursor', 'skills', 'backend'));
      expect(frontendDirEntries.sort()).toEqual(['review']);
      expect(backendDirEntries.sort()).toEqual(['review']);

      // No spurious collision warning.
      const collisionWarnings = result.warnings.filter(w => w.message.includes('collision'));
      expect(collisionWarnings).toHaveLength(0);
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
      const skillExists = await fs.stat(path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md')).catch(() => null);

      expect(rulesExist).not.toBeNull();
      expect(skillExists).not.toBeNull();
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

      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
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

      const skillsDir = path.join(tempDir, '.cursor', 'skills');
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'command', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Content');
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

      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries.sort()).toEqual(['review', 'review-1']);
    });
  });
});
