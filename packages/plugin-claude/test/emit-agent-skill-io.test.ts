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

const tempDir = suiteTempDir(import.meta.url, 'agent-skill-io');

describe('Claude AgentSkillIO Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('simple AgentSkillIO (no hooks, no files)', () => {
    it('should emit simple AgentSkillIO as .claude/skills/*/SKILL.md', async () => {
      // Simple skill should emit as Claude skill directory
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/rules/deploy.mdc'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/rules/deploy.mdc',
          content: 'Deployment guidelines',
          name: 'deploy',
          description: 'Help with deployments',
          files: {},
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      // Should emit to .claude/skills/deploy/SKILL.md
      const skillPath = path.join(tempDir, '.claude', 'skills', 'deploy', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name:');
      expect(content).toContain('deploy');
      expect(content).toContain('description:');
      expect(content).toContain('Help with deployments');
      expect(content).toContain('Deployment guidelines');
    });

    it('should emit simple AgentSkillIO with disable as .claude/skills/*/SKILL.md', async () => {
      // Simple skill with disable-model-invocation should emit as skill with flag
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/review/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/review/SKILL.md',
          content: 'Review code for security',
          name: 'review',
          description: 'Code review helper',
          disableModelInvocation: true,
          files: {},
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      // Should include disable flag in frontmatter
      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('disable-model-invocation: true');
      expect(content).toContain('Review code for security');
    });
  });

  describe('complex AgentSkillIO (with hooks or files)', () => {
    it('should emit complex AgentSkillIO to .claude/skills/ with all files', async () => {
      // Complex skill should emit full directory with SKILL.md + resource files
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/deploy/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/deploy/SKILL.md',
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

      const result = await claudePlugin.emit(models, tempDir);

      // Should write 3 files: SKILL.md + 2 resource files
      expect(result.written.length).toBeGreaterThanOrEqual(1);
      
      // Verify SKILL.md exists
      const skillPath = path.join(tempDir, '.claude', 'skills', 'deploy', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Deployment process');

      // Verify resource files exist
      const checklistPath = path.join(tempDir, '.claude', 'skills', 'deploy', 'checklist.md');
      const checklistContent = await fs.readFile(checklistPath, 'utf-8');
      expect(checklistContent).toContain('Run tests');

      const configPath = path.join(tempDir, '.claude', 'skills', 'deploy', 'config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      expect(configContent).toContain('production');
    });

    it('should include all resource files from files map', async () => {
      // Verify all files in AgentSkillIO.files are written
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/multi/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/multi/SKILL.md',
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

      const result = await claudePlugin.emit(models, tempDir);

      // Verify all 3 files + SKILL.md exist
      const skillDir = path.join(tempDir, '.claude', 'skills', 'multi');
      const files = await fs.readdir(skillDir);
      expect(files).toContain('SKILL.md');
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('file3.txt');

      // Verify content
      const file1 = await fs.readFile(path.join(skillDir, 'file1.txt'), 'utf-8');
      expect(file1).toBe('Content 1');
    });

    it('should populate sourcePaths on resource WrittenFiles (not on SKILL.md)', async () => {
      // Resource WrittenFiles carry explicit sourcePaths so path-rewriter.buildMapping keys them
      // correctly. SKILL.md keeps legacy sourceItems-only plumbing.
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/check/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/check/SKILL.md',
          content: 'Check skill',
          name: 'check',
          description: 'Check skill',
          files: {
            'scripts/gotthis.sh': '#!/bin/sh\necho hi',
            'references/NOTES.md': 'Some notes',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const skillMd = result.written.find((w) => w.path.endsWith('SKILL.md'));
      const scriptFile = result.written.find((w) => w.path.endsWith('gotthis.sh'));
      const refFile = result.written.find((w) => w.path.endsWith('NOTES.md'));

      expect(skillMd).toBeDefined();
      expect(scriptFile).toBeDefined();
      expect(refFile).toBeDefined();

      // SKILL.md keeps legacy sourceItems-only plumbing
      expect(skillMd!.sourcePaths).toBeUndefined();

      // Resource files carry explicit sourcePaths (POSIX separators)
      expect(scriptFile!.sourcePaths).toEqual(['.cursor/skills/check/scripts/gotthis.sh']);
      expect(refFile!.sourcePaths).toEqual(['.cursor/skills/check/references/NOTES.md']);
    });

    it('should omit sourcePaths when skill has no sourcePath (IR-built test case)', async () => {
      // Edge case: skill built in-memory without a sourcePath. The resource
      // WrittenFile must simply omit sourcePaths — no crash, no bogus entry.
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, 'ir-built/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          content: 'IR-built skill',
          name: 'irbuilt',
          description: 'IR-built skill',
          files: {
            'scripts/a.sh': '#!/bin/sh\n',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);
      const scriptFile = result.written.find((w) => w.path.endsWith('a.sh'));
      expect(scriptFile).toBeDefined();
      expect(scriptFile!.sourcePaths).toBeUndefined();
    });
  });

  describe('resource file path traversal prevention', () => {
    it('should reject resource files with absolute paths', async () => {
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/evil/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/evil/SKILL.md',
          content: 'Evil skill',
          name: 'evil',
          description: 'Tries to escape',
          files: {
            '/etc/passwd': 'hacked',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
      expect(skipWarnings.length).toBeGreaterThanOrEqual(1);
      expect(skipWarnings.some(w => w.message.includes('/etc/passwd'))).toBe(true);

      // SKILL.md should still be written
      const skillPath = path.join(tempDir, '.claude', 'skills', 'evil', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Evil skill');

      // The malicious file should NOT exist anywhere under the skill dir
      const skillDir = path.join(tempDir, '.claude', 'skills', 'evil');
      const files = await fs.readdir(skillDir);
      expect(files).toEqual(['SKILL.md']);
    });

    it('should reject resource files with .. in path', async () => {
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/evil/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/evil/SKILL.md',
          content: 'Evil skill',
          name: 'evil',
          description: 'Tries to escape',
          files: {
            '../../../etc/passwd': 'hacked',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
      expect(skipWarnings.length).toBeGreaterThanOrEqual(1);
      expect(skipWarnings.some(w => w.message.includes('..'))).toBe(true);

      // SKILL.md should still be written
      const skillPath = path.join(tempDir, '.claude', 'skills', 'evil', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Evil skill');

      // No files outside the skill directory
      const skillDir = path.join(tempDir, '.claude', 'skills', 'evil');
      const files = await fs.readdir(skillDir);
      expect(files).toEqual(['SKILL.md']);
    });

    it('should reject resource files that resolve outside skill directory', async () => {
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/evil/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/evil/SKILL.md',
          content: 'Evil skill',
          name: 'evil',
          description: 'Tries to escape via symlink-like path',
          files: {
            'subdir/../../sibling/payload.sh': 'hacked',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
      expect(skipWarnings.length).toBeGreaterThanOrEqual(1);

      // SKILL.md should still be written
      const skillPath = path.join(tempDir, '.claude', 'skills', 'evil', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Evil skill');

      // The path 'subdir/../../sibling/payload.sh' would escape to .claude/skills/sibling/
      // if not blocked — verify it was never created
      await expect(
        fs.access(path.join(tempDir, '.claude', 'skills', 'sibling', 'payload.sh'))
      ).rejects.toThrow();
    });

    it('should reject resource files with empty, dot, or dot-slash paths that resolve to the skill dir', async () => {
      const dangerousFilenames = ['', '.', './'];
      for (const filename of dangerousFilenames) {
        const models: AgentSkillIO[] = [
          {
            id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/evil/SKILL.md'),
            type: CustomizationType.AgentSkillIO,
            sourcePath: '.cursor/skills/evil/SKILL.md',
            content: 'Evil skill',
            name: 'evil',
            description: 'Tries to write to skill dir itself',
            files: {
              [filename]: 'would cause EISDIR',
            },
            metadata: {},
          },
        ];

        const result = await claudePlugin.emit(models, tempDir);

        const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
        expect(
          skipWarnings.some(w => w.message.includes('unsafe') || w.message.includes('outside')),
          `expected filename ${JSON.stringify(filename)} to be skipped`
        ).toBe(true);

        // SKILL.md should still be written
        const skillPath = path.join(tempDir, '.claude', 'skills', 'evil', 'SKILL.md');
        const content = await fs.readFile(skillPath, 'utf-8');
        expect(content).toContain('Evil skill');

        // No extra files should exist in the skill directory
        const skillDir = path.join(tempDir, '.claude', 'skills', 'evil');
        const files = await fs.readdir(skillDir);
        expect(files, `unexpected files after ${JSON.stringify(filename)} iteration`).toEqual(['SKILL.md']);

        // Clean up between iterations so each starts with a fresh skill directory
        await fs.rm(path.join(tempDir, '.claude'), { recursive: true, force: true });
      }
    });

    it('should accept valid resource filenames including nested paths', async () => {
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/deploy/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/deploy/SKILL.md',
          content: 'Deployment process',
          name: 'deploy',
          description: 'Deployment helper',
          files: {
            'checklist.md': '- [ ] Run tests',
            'resources/helper.sh': '#!/bin/bash\necho "deploying"',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      // No skip warnings for valid files
      const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
      expect(skipWarnings).toHaveLength(0);

      // All files should exist
      const skillDir = path.join(tempDir, '.claude', 'skills', 'deploy');
      const skillContent = await fs.readFile(path.join(skillDir, 'SKILL.md'), 'utf-8');
      expect(skillContent).toContain('Deployment process');

      const checklist = await fs.readFile(path.join(skillDir, 'checklist.md'), 'utf-8');
      expect(checklist).toContain('Run tests');

      const helper = await fs.readFile(path.join(skillDir, 'resources', 'helper.sh'), 'utf-8');
      expect(helper).toContain('deploying');
    });

    it('should reject resource files named SKILL.md (case-insensitive) to prevent overwriting the canonical skill file', async () => {
      const canonicalContent = 'The real skill description';
      const overwriteAttempts: Record<string, string> = {
        'SKILL.md': 'overwritten-uppercase',
        'skill.md': 'overwritten-lowercase',
        'Skill.MD': 'overwritten-mixed',
      };

      for (const [filename, badContent] of Object.entries(overwriteAttempts)) {
        const models: AgentSkillIO[] = [
          {
            id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/target/SKILL.md'),
            type: CustomizationType.AgentSkillIO,
            sourcePath: '.cursor/skills/target/SKILL.md',
            content: canonicalContent,
            name: 'target',
            description: 'Real skill',
            files: {
              [filename]: badContent,
            },
            metadata: {},
          },
        ];

        const result = await claudePlugin.emit(models, tempDir);

        // A skip warning must be emitted
        const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
        expect(
          skipWarnings.length,
          `expected skip warning for resource named ${JSON.stringify(filename)}`
        ).toBeGreaterThanOrEqual(1);

        // The canonical SKILL.md must contain the original content, not the resource content
        const skillPath = path.join(tempDir, '.claude', 'skills', 'target', 'SKILL.md');
        const written = await fs.readFile(skillPath, 'utf-8');
        expect(written, `canonical SKILL.md was overwritten by resource ${JSON.stringify(filename)}`).toContain(canonicalContent);
        expect(written).not.toContain(badContent);

        // Clean up between iterations
        await fs.rm(path.join(tempDir, '.claude'), { recursive: true, force: true });
      }
    });

    it('should accept filenames that contain ".." as part of a basename (not a path segment)', async () => {
      // "notes..md" contains the substring ".." but it is NOT a traversal segment —
      // it is a valid filename. A raw substring check would falsely reject it.
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/notes/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          sourcePath: '.cursor/skills/notes/SKILL.md',
          content: 'Notes skill',
          name: 'notes',
          description: 'Takes notes',
          files: {
            'notes..md': 'double-dot basename',
            'v1..2.bak': 'versioned backup',
          },
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      // No skip warnings — these are valid filenames
      const skipWarnings = result.warnings.filter(w => w.code === WarningCode.Skipped);
      expect(skipWarnings).toHaveLength(0);

      const skillDir = path.join(tempDir, '.claude', 'skills', 'notes');
      const notes = await fs.readFile(path.join(skillDir, 'notes..md'), 'utf-8');
      expect(notes).toContain('double-dot basename');

      const bak = await fs.readFile(path.join(skillDir, 'v1..2.bak'), 'utf-8');
      expect(bak).toContain('versioned backup');
    });
  });

  describe('relativeDir nesting support', () => {
    it('should emit GlobalPrompt with relativeDir to subdirectory under .claude/rules/', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/shared/niko/main.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'main',
          sourcePath: '.cursor/rules/shared/niko/main.mdc',
          relativeDir: 'shared/niko',
          content: 'Main Niko rule.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // File should be in subdirectory
      const expectedPath = path.join(tempDir, '.claude', 'rules', 'shared', 'niko', 'main.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('Main Niko rule.');
    });

    it('should emit FileRule with relativeDir to subdirectory under .claude/rules/', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/shared/niko/Core/file-verification.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/shared/niko/Core/file-verification.mdc',
          relativeDir: 'shared/niko/Core',
          content: 'File verification content.',
          globs: ['file-verification.mdc'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // File should be in deep subdirectory
      const expectedPath = path.join(tempDir, '.claude', 'rules', 'shared', 'niko', 'Core', 'file-verification.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('File verification content.');
    });

    it('should emit items without relativeDir to flat .claude/rules/ (backward compat)', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/general.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'general',
          sourcePath: '.cursor/rules/general.mdc',
          content: 'General rule.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // File should be at flat level
      const expectedPath = path.join(tempDir, '.claude', 'rules', 'general.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('General rule.');
    });

    it('should report correct WrittenFile.path with relativeDir nesting', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/shared/niko/main.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'main',
          sourcePath: '.cursor/rules/shared/niko/main.mdc',
          relativeDir: 'shared/niko',
          content: 'Main Niko rule.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      // WrittenFile.path should reflect the nested path (critical for path rewriter)
      const expectedPath = path.join(tempDir, '.claude', 'rules', 'shared', 'niko', 'main.md');
      expect(result.written[0]?.path).toBe(expectedPath);
    });
  });
});

