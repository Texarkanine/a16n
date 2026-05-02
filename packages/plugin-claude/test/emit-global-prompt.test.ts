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

const tempDir = suiteTempDir(import.meta.url, 'global-prompt');

describe('Claude Plugin Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single GlobalPrompt', () => {
    it('should emit a single GlobalPrompt as .claude/rules/*.md', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'test',
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Always use TypeScript.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      // Verify file was created in .claude/rules/
      const rulePath = path.join(tempDir, '.claude', 'rules', 'test.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('Always use TypeScript.');
    });

    it('should preserve multi-part stems (dots become hyphens, not stripped)', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'react.hooks.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'react.hooks',
          sourcePath: 'react.hooks.mdc',
          content: 'React hooks rules.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const rulePath = path.join(tempDir, '.claude', 'rules', 'react-hooks.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('React hooks rules.');
    });

    it('should NOT include From line in emitted rule content', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'test',
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Test content',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const rulePath = path.join(tempDir, '.claude', 'rules', 'test.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).not.toContain('## From:');
      expect(content).not.toContain('.cursor/rules/test.mdc');
      expect(content).toContain('Test content');
    });

    it('should use gp.name for output filename (not re-derived from sourcePath)', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursorrules'),
          type: CustomizationType.GlobalPrompt,
          name: 'cursorrules',
          sourcePath: '.cursorrules',
          content: 'Cursor rules content.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Should use gp.name ('cursorrules'), not re-derived from sourcePath ('.cursorrules' → 'rule')
      const rulePath = path.join(tempDir, '.claude', 'rules', 'cursorrules.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('Cursor rules content.');
    });

    it('should NOT include frontmatter in GlobalPrompt files', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'test',
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Test content',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const rulePath = path.join(tempDir, '.claude', 'rules', 'test.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      // Should not have YAML frontmatter (no --- delimiters)
      expect(content).not.toMatch(/^---\n/);
    });
  });

  describe('multiple GlobalPrompts', () => {
    it('should emit multiple GlobalPrompts as separate .claude/rules/*.md files', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'rule1',
          sourcePath: 'rule1.mdc',
          content: 'First rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule2.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'rule2',
          sourcePath: 'rule2.mdc',
          content: 'Second rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule3.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'rule3',
          sourcePath: 'rule3.mdc',
          content: 'Third rule',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      // BREAKING: Each GlobalPrompt gets its own file
      expect(result.written).toHaveLength(3);

      // Verify all three files exist with correct content
      const rule1Path = path.join(tempDir, '.claude', 'rules', 'rule1.md');
      const rule2Path = path.join(tempDir, '.claude', 'rules', 'rule2.md');
      const rule3Path = path.join(tempDir, '.claude', 'rules', 'rule3.md');
      
      const content1 = await fs.readFile(rule1Path, 'utf-8');
      const content2 = await fs.readFile(rule2Path, 'utf-8');
      const content3 = await fs.readFile(rule3Path, 'utf-8');
      
      expect(content1).toContain('First rule');
      expect(content2).toContain('Second rule');
      expect(content3).toContain('Third rule');
    });

    it('should NOT emit Merged warning (no longer merging)', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'a.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'a',
          sourcePath: 'a.mdc',
          content: 'A',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'b.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'b',
          sourcePath: 'b.mdc',
          content: 'B',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      // BREAKING: No merge warning since each gets its own file
      expect(result.warnings).toHaveLength(0);
    });

    it('should NOT create CLAUDE.md file', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'rule1',
          sourcePath: 'rule1.mdc',
          content: 'First rule',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      // BREAKING: CLAUDE.md should not exist
      const claudePath = path.join(tempDir, 'CLAUDE.md');
      await expect(fs.access(claudePath)).rejects.toThrow();
    });

    it('should handle filename collisions for GlobalPrompts', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'test',
          sourcePath: '.cursor/rules/test.mdc',
          content: 'First test',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/shared/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          name: 'test',
          sourcePath: '.cursor/rules/shared/test.mdc',
          content: 'Second test',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Should create test.md and test-1.md
      const testPath = path.join(tempDir, '.claude', 'rules', 'test.md');
      const test1Path = path.join(tempDir, '.claude', 'rules', 'test-1.md');
      
      const testContent = await fs.readFile(testPath, 'utf-8');
      const test1Content = await fs.readFile(test1Path, 'utf-8');
      
      expect(testContent).toContain('First test');
      expect(test1Content).toContain('Second test');
    });
  });

  describe('empty input', () => {
    it('should handle empty models array', async () => {
      const result = await claudePlugin.emit([], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);
    });
  });
});

