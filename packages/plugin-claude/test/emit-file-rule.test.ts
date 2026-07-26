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

const tempDir = suiteTempDir(import.meta.url, 'file-rule');

describe('Claude FileRule Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single FileRule', () => {
    it('should emit FileRule as .claude/rules/*.md with paths frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'Use React best practices.',
          globs: ['**/*.tsx', '**/*.jsx'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // BREAKING: Now emits to .claude/rules/ instead of .a16n/rules/
      const rulePath = path.join(tempDir, '.claude', 'rules', 'react.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      
      // Should have YAML frontmatter with paths
      expect(content).toContain('---');
      expect(content).toContain('paths:');
      expect(content).toContain('**/*.tsx');
      expect(content).toContain('**/*.jsx');
      expect(content).toContain('Use React best practices.');
    });

    it('should NOT include From line in emitted FileRule content', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'Use React best practices.',
          globs: ['**/*.tsx'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const rulePath = path.join(tempDir, '.claude', 'rules', 'react.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).not.toContain('## From:');
      expect(content).not.toContain('.cursor/rules/react.mdc');
      expect(content).toContain('Use React best practices.');
    });

    it('should format paths as YAML array in frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'React rules',
          globs: ['**/*.tsx', '**/*.jsx'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const rulePath = path.join(tempDir, '.claude', 'rules', 'react.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      
      // Verify YAML array format
      expect(content).toMatch(/paths:\s*\n\s*-\s+"?\*\*\/\*\.tsx"?/);
      expect(content).toMatch(/paths:\s*\n\s*-.*\n\s*-\s+"?\*\*\/\*\.jsx"?/);
    });

    it('should rewrite AGENTS stem to AGENTSMD for nested rules', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'web/AGENTS.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'web/AGENTS.md',
          relativeDir: 'web',
          content: 'Scoped AGENTS rule.',
          globs: ['web/**'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      await expect(
        fs.access(path.join(tempDir, '.claude', 'rules', 'web', 'AGENTS.md'))
      ).rejects.toThrow();
      const content = await fs.readFile(
        path.join(tempDir, '.claude', 'rules', 'web', 'AGENTSMD.md'),
        'utf-8'
      );
      expect(content).toContain('Scoped AGENTS rule.');
      expect(content).toContain('paths:');
    });

    it('should NOT create settings.local.json hooks', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'React rules',
          globs: ['**/*.tsx'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      // BREAKING: settings.local.json should not exist
      const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
      await expect(fs.access(settingsPath)).rejects.toThrow();
    });

    it('should NOT create .a16n/rules/ directory', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'React rules',
          globs: ['**/*.tsx'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      // BREAKING: .a16n directory should not exist
      const a16nPath = path.join(tempDir, '.a16n');
      await expect(fs.access(a16nPath)).rejects.toThrow();
    });

    it('should NOT emit approximation warning for FileRule', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'React rules',
          globs: ['**/*.tsx'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      // BREAKING: No approximation warning (native support now)
      const approxWarning = result.warnings.find(w => w.code === WarningCode.Approximated);
      expect(approxWarning).toBeUndefined();
    });
  });

  describe('multiple FileRules', () => {
    it('should emit multiple FileRules as separate .claude/rules/*.md files', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/react.mdc',
          content: 'React rules',
          globs: ['**/*.tsx'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/typescript.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/typescript.mdc',
          content: 'TypeScript rules',
          globs: ['**/*.ts'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Check both rule files exist in .claude/rules/
      const reactPath = path.join(tempDir, '.claude', 'rules', 'react.md');
      const tsPath = path.join(tempDir, '.claude', 'rules', 'typescript.md');
      
      const reactContent = await fs.readFile(reactPath, 'utf-8');
      const tsContent = await fs.readFile(tsPath, 'utf-8');
      
      expect(reactContent).toContain('React rules');
      expect(reactContent).toContain('paths:');
      expect(tsContent).toContain('TypeScript rules');
      expect(tsContent).toContain('paths:');
    });

    it('should handle filename collisions for FileRules', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/api.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/api.mdc',
          content: 'First API rules',
          globs: ['**/api/*.ts'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, '.cursor/rules/backend/api.mdc'),
          type: CustomizationType.FileRule,
          sourcePath: '.cursor/rules/backend/api.mdc',
          content: 'Second API rules',
          globs: ['**/backend/api/*.ts'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Should create api.md and api-1.md
      const apiPath = path.join(tempDir, '.claude', 'rules', 'api.md');
      const api1Path = path.join(tempDir, '.claude', 'rules', 'api-1.md');
      
      const apiContent = await fs.readFile(apiPath, 'utf-8');
      const api1Content = await fs.readFile(api1Path, 'utf-8');
      
      expect(apiContent).toContain('First API rules');
      expect(api1Content).toContain('Second API rules');
    });
  });
});


describe('Claude FileRule Empty Globs Validation', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should skip FileRule with empty globs array', async () => {
    const models: FileRule[] = [
      {
        id: createId(CustomizationType.FileRule, '.cursor/rules/empty.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: '.cursor/rules/empty.mdc',
        content: 'This should be skipped.',
        globs: [],
        metadata: {},
      },
    ];

    const result = await claudePlugin.emit(models, tempDir);

    // Should not write any files (no valid FileRules)
    expect(result.written).toHaveLength(0);
    
    // .claude/rules directory should not exist
    await expect(fs.access(path.join(tempDir, '.claude', 'rules'))).rejects.toThrow();
  });

  it('should skip FileRule with globs containing only empty strings', async () => {
    const models: FileRule[] = [
      {
        id: createId(CustomizationType.FileRule, '.cursor/rules/empty.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: '.cursor/rules/empty.mdc',
        content: 'This should be skipped.',
        globs: ['', '  ', ''],
        metadata: {},
      },
    ];

    const result = await claudePlugin.emit(models, tempDir);

    // Should not write any files
    expect(result.written).toHaveLength(0);
  });

  it('should emit warning when skipping FileRule with empty globs', async () => {
    const models: FileRule[] = [
      {
        id: createId(CustomizationType.FileRule, '.cursor/rules/empty.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: '.cursor/rules/empty.mdc',
        content: 'This should be skipped.',
        globs: [],
        metadata: {},
      },
    ];

    const result = await claudePlugin.emit(models, tempDir);

    const skipWarning = result.warnings.find(w => w.code === WarningCode.Skipped);
    expect(skipWarning).toBeDefined();
    expect(skipWarning?.message).toContain('empty globs');
  });

  it('should process FileRule with valid globs normally', async () => {
    const models: FileRule[] = [
      {
        id: createId(CustomizationType.FileRule, '.cursor/rules/valid.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: '.cursor/rules/valid.mdc',
        content: 'Valid content.',
        globs: ['**/*.ts'],
        metadata: {},
      },
    ];

    const result = await claudePlugin.emit(models, tempDir);

    // Should write single rule file to .claude/rules/
    expect(result.written).toHaveLength(1);
    
    // Verify file was created in .claude/rules/
    const rulePath = path.join(tempDir, '.claude', 'rules', 'valid.md');
    const content = await fs.readFile(rulePath, 'utf-8');
    expect(content).toContain('Valid content.');
    expect(content).toContain('paths:');
  });

  it('should filter empty globs but keep valid ones in mixed array', async () => {
    const models: FileRule[] = [
      {
        id: createId(CustomizationType.FileRule, '.cursor/rules/mixed.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: '.cursor/rules/mixed.mdc',
        content: 'Mixed globs content.',
        globs: ['', '**/*.ts', '  ', '**/*.tsx'],
        metadata: {},
      },
    ];

    const result = await claudePlugin.emit(models, tempDir);

    // Should write single rule file
    expect(result.written).toHaveLength(1);
    
    // Check file contains only valid globs in paths frontmatter
    const rulePath = path.join(tempDir, '.claude', 'rules', 'mixed.md');
    const content = await fs.readFile(rulePath, 'utf-8');
    
    expect(content).toContain('**/*.ts');
    expect(content).toContain('**/*.tsx');
    expect(content).toContain('Mixed globs content.');
  });
});

// Settings merge behavior tests removed in Phase 8 A3 (no longer using settings.local.json)

