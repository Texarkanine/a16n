import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type FileRule,
  type AgentSkillIO,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'agent-skill-io');

describe('Cursor AgentSkillIO Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('simple AgentSkillIO (no hooks, no files)', () => {
    it('should emit simple AgentSkillIO as .cursor/rules/*.mdc', async () => {
      // Simple skill with only name + description should emit as Cursor rule
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.claude/skills/deploy/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.claude/skills/deploy/SKILL.md',
          content: 'Deployment guidelines',
          name: 'deploy',
          description: 'Help with deployments',
          files: {},
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      // Should emit as Cursor rule
      const rulePath = path.join(tempDir, '.cursor', 'rules', 'deploy.mdc');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('description:');
      expect(content).toContain('Help with deployments');
      expect(content).toContain('Deployment guidelines');
    });

    it('should emit simple AgentSkillIO with disable as .cursor/skills/*/SKILL.md', async () => {
      // Simple skill with disable-model-invocation should emit as ManualPrompt
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.claude/skills/review/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.claude/skills/review/SKILL.md',
          content: 'Review code for security',
          name: 'review',
          description: 'Code review helper',
          disableModelInvocation: true,
          files: {},
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      // Should emit as ManualPrompt skill
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('disable-model-invocation: true');
      expect(content).toContain('Review code for security');
    });
  });

  describe('complex AgentSkillIO (with hooks or files)', () => {
    it('should emit complex AgentSkillIO to .cursor/skills/ with all files', async () => {
      // Complex skill should emit full directory with SKILL.md + resource files
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.claude/skills/deploy/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.claude/skills/deploy/SKILL.md',
          content: 'Deployment process',
          name: 'deploy',
          description: 'Deployment helper',
          files: {
            'checklist.md': '- [ ] Run tests\n- [ ] Build\n- [ ] Deploy',
            'config.json': '{"env":"production"}',
          },
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      // Should write 3 files: SKILL.md + 2 resource files
      expect(result.written.length).toBe(3);
      
      // Verify SKILL.md exists
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'deploy', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Deployment process');

      // Verify resource files exist
      const checklistPath = path.join(tempDir, '.cursor', 'skills', 'deploy', 'checklist.md');
      const checklistContent = await fs.readFile(checklistPath, 'utf-8');
      expect(checklistContent).toContain('Run tests');

      const configPath = path.join(tempDir, '.cursor', 'skills', 'deploy', 'config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      expect(configContent).toContain('production');
    });

    it('should set sourcePaths on each emitted resource WrittenFile (not on SKILL.md itself)', async () => {
      // resource WrittenFiles populate `sourcePaths` so buildMapping produces source→target
      // entries for ride-along files. Without this, --rewrite-path-refs cannot rewrite
      // references to those resources.
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/check/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/check/SKILL.md',
          content: 'Check skill body',
          name: 'check',
          description: 'Check skill',
          files: {
            'scripts/gotthis.sh': '#!/bin/bash\necho ok\n',
            'references/notes.md': '# notes\n',
          },
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      // Find SKILL.md and the two resource files in written output
      const skillMd = result.written.find((w) => w.path.endsWith('SKILL.md'));
      const scriptWritten = result.written.find((w) =>
        w.path.endsWith(path.join('scripts', 'gotthis.sh'))
      );
      const refWritten = result.written.find((w) =>
        w.path.endsWith(path.join('references', 'notes.md'))
      );

      expect(skillMd).toBeDefined();
      expect(scriptWritten).toBeDefined();
      expect(refWritten).toBeDefined();

      // SKILL.md WrittenFile uses sourceItems (no explicit sourcePaths)
      expect(skillMd!.sourceItems).toBeDefined();
      expect(skillMd!.sourcePaths).toBeUndefined();

      // Resource WrittenFiles must set sourcePaths to the POSIX source path
      expect(scriptWritten!.sourcePaths).toEqual([
        '.cursor/skills/check/scripts/gotthis.sh',
      ]);
      expect(refWritten!.sourcePaths).toEqual([
        '.cursor/skills/check/references/notes.md',
      ]);

      // sourceItems is still populated on resource WrittenFiles (unchanged)
      expect(scriptWritten!.sourceItems).toBeDefined();
      expect(scriptWritten!.sourceItems![0]!.type).toBe(CustomizationType.AgentSkillIO);
    });

    it('should not set sourcePaths on resource WrittenFiles when the skill has no sourcePath (IR-built skill)', async () => {
      // Edge case: skill constructed in tests without a sourcePath → we cannot
      // derive a source-relative resource path, so sourcePaths is omitted.
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, 'ir-only'),
          type: CustomizationType.AgentSkillIO,
          // No sourcePath
          content: 'body',
          name: 'ir',
          description: 'ir only',
          files: {
            'scripts/x.sh': 'x',
          },
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);
      const scriptWritten = result.written.find((w) =>
        w.path.endsWith(path.join('scripts', 'x.sh'))
      );
      expect(scriptWritten).toBeDefined();
      expect(scriptWritten!.sourcePaths).toBeUndefined();
    });

    it('should include all resource files from files map', async () => {
      // Verify all files in AgentSkillIO.files are written
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.claude/skills/multi/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.claude/skills/multi/SKILL.md',
          content: 'Multi-file skill',
          name: 'multi',
          description: 'Multi-file test',
          files: {
            'file1.txt': 'Content 1',
            'file2.txt': 'Content 2',
            'file3.txt': 'Content 3',
          },
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      // Verify all 3 files + SKILL.md exist
      const skillDir = path.join(tempDir, '.cursor', 'skills', 'multi');
      const files = await fs.readdir(skillDir);
      expect(files).toContain('SKILL.md');
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('file3.txt');

      // Verify content
      const file1 = await fs.readFile(path.join(skillDir, 'file1.txt'), 'utf-8');
      expect(file1).toBe('Content 1');
    });
  });

  describe('relativeDir nesting support', () => {
    it('should emit GlobalPrompt with relativeDir to subdirectory under .cursor/rules/', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.claude/rules/shared/niko/main.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.claude/rules/shared/niko/main.md',
          relativeDir: 'shared/niko',
          name: 'main',
          content: 'Main Niko rule.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // File should be in subdirectory
      const expectedPath = path.join(tempDir, '.cursor', 'rules', 'shared', 'niko', 'main.mdc');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('Main Niko rule.');
    });

    it('should emit FileRule with relativeDir to subdirectory under .cursor/rules/', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.claude/rules/shared/niko/Core/file-verification.md'),
          type: CustomizationType.FileRule,
          sourcePath: '.claude/rules/shared/niko/Core/file-verification.md',
          relativeDir: 'shared/niko/Core',
          content: 'File verification content.',
          globs: ['file-verification.mdc'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // File should be in deep subdirectory
      const expectedPath = path.join(tempDir, '.cursor', 'rules', 'shared', 'niko', 'Core', 'file-verification.mdc');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('File verification content.');
    });

    it('should emit items without relativeDir to flat .cursor/rules/ (backward compat)', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.claude/rules/general.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.claude/rules/general.md',
          name: 'general',
          content: 'General rule.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // File should be at flat level
      const expectedPath = path.join(tempDir, '.cursor', 'rules', 'general.mdc');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('General rule.');
    });

    it('should report correct WrittenFile.path with relativeDir nesting', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.claude/rules/shared/niko/main.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.claude/rules/shared/niko/main.md',
          relativeDir: 'shared/niko',
          name: 'main',
          content: 'Main Niko rule.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      // WrittenFile.path should reflect the nested path
      const expectedPath = path.join(tempDir, '.cursor', 'rules', 'shared', 'niko', 'main.mdc');
      expect(result.written[0]?.path).toBe(expectedPath);
    });
  });
});
