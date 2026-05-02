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

const tempDir = suiteTempDir(import.meta.url, 'filename-case');

describe('filename case preservation', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('FileRule preserves source filename case', () => {
    it('should preserve CamelCase stem when emitting FileRule', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/shared/niko/memory-bank/active/activeContext.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/shared/niko/memory-bank/active/activeContext.mdc',
          relativeDir: 'shared/niko/memory-bank/active',
          content: 'Active context.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const writtenPath = result.written[0]?.path ?? '';
      expect(writtenPath.endsWith(path.join('active', 'activeContext.md'))).toBe(true);
      expect(writtenPath.endsWith(path.join('active', 'activecontext.md'))).toBe(false);
    });

    it('should normalize dots to hyphens while preserving case', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'foo.Bar.Baz.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: 'foo.Bar.Baz.mdc',
          content: 'Dotted content.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toBe(path.join(tempDir, '.claude', 'rules', 'foo-Bar-Baz.md'));
    });

    it('should fall back to "rule" for empty/only-special-chars stem', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '___.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '___.mdc',
          content: 'Fallback content.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const rulePath = path.join(tempDir, '.claude', 'rules', 'rule.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('Fallback content.');
    });
  });

  describe('GlobalPrompt preserves name case', () => {
    it('should preserve CamelCase name when emitting GlobalPrompt', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'productContext.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'productContext',
          sourcePath: 'productContext.mdc',
          content: 'Product context.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.path).toBe(path.join(tempDir, '.claude', 'rules', 'productContext.md'));
    });
  });

  describe('AgentSkillIO skill directory stays lowercase (spec compliance)', () => {
    it('should lowercase uppercase skill name for directory', async () => {
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/Pdf-Processing/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/Pdf-Processing/SKILL.md',
          content: 'PDF processing content',
          name: 'Pdf-Processing',
          description: 'Process PDFs',
          files: {},
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      // Skill dir must be lowercase per AgentSkills.io spec §name
      const skillPath = path.join(tempDir, '.claude', 'skills', 'pdf-processing', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('PDF processing content');
    });

    it('should leave already-lowercase skill name unchanged', async () => {
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/niko-archive/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/niko-archive/SKILL.md',
          content: 'Archive content',
          name: 'niko-archive',
          description: 'Archive skill',
          files: {},
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'niko-archive', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Archive content');
    });
  });

  describe('SimpleAgentSkill skill directory stays lowercase', () => {
    it('should lowercase CamelCase name for skill directory', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'MyNiceSkill.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'MyNiceSkill',
          sourcePath: 'MyNiceSkill.mdc',
          content: 'Skill content',
          description: 'Nice skill',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'myniceskill', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Skill content');
    });

    it('should lowercase sourcePath-derived name when skill.name is missing (fallback branch)', async () => {
      // Bypass the name-required SimpleAgentSkill type to exercise the fallback branch
      const models = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'MySkill.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          sourcePath: 'MySkill.mdc',
          content: 'Fallback skill',
          description: 'Skill from sourcePath',
          metadata: {},
        } as unknown as SimpleAgentSkill,
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'myskill', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Fallback skill');
    });
  });

  describe('ManualPrompt skill directory stays lowercase', () => {
    it('should lowercase CamelCase promptName for skill directory', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/MyCommand.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/MyCommand.md',
          content: 'Command content',
          promptName: 'MyCommand',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'mycommand', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Command content');
    });
  });

  describe('case-insensitive collision safety', () => {
    it('should treat case-only differences as collisions for FileRules', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'activeContext.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: 'activeContext.mdc',
          content: 'CamelCase content.',
          globs: ['**/*'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, 'activecontext.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: 'activecontext.mdc',
          content: 'lowercase content.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      const paths = result.written.map(w => w.path);
      // Two distinct filenames should land — not a silent overwrite
      const uniqueLower = new Set(paths.map(p => p.toLowerCase()));
      expect(uniqueLower.size).toBe(2);

      // First preserves original case; second gets a -1 suffix (preserving its original case)
      expect(paths.some(p => p.endsWith(path.sep + 'activeContext.md'))).toBe(true);
      expect(paths.some(p => p.endsWith(path.sep + 'activecontext-1.md'))).toBe(true);
    });

    it('should NOT treat truly different names as collisions', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'activeContext.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: 'activeContext.mdc',
          content: 'Context.',
          globs: ['**/*'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, 'foo.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: 'foo.mdc',
          content: 'Foo.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      const paths = result.written.map(w => w.path);
      expect(paths.some(p => p.endsWith(path.sep + 'activeContext.md'))).toBe(true);
      expect(paths.some(p => p.endsWith(path.sep + 'foo.md'))).toBe(true);
    });
  });

  describe('leading-dot filenames sanitize as before', () => {
    it('should strip leading dot and preserve rest', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.dotfile.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.dotfile.mdc',
          content: 'Dotfile content.',
          globs: ['**/*'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const rulePath = path.join(tempDir, '.claude', 'rules', 'dotfile.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('Dotfile content.');
    });
  });
});
