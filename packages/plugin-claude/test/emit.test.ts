import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import claudePlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  type GlobalPrompt,
  type FileRule,
  type AgentSkill,
  createId,
} from '@a16n/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use a temp directory for emission tests
const tempDir = path.join(__dirname, '.temp-emit-test');

describe('Claude Plugin Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single GlobalPrompt', () => {
    it('should emit a single GlobalPrompt as CLAUDE.md', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Always use TypeScript.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      // Verify file was created
      const claudePath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('Always use TypeScript.');
    });

    it('should include source header in output', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Test content',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const claudePath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('.cursor/rules/test.mdc');
    });
  });

  describe('multiple GlobalPrompts', () => {
    it('should merge multiple GlobalPrompts into single CLAUDE.md', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'rule1.mdc',
          content: 'First rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule2.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'rule2.mdc',
          content: 'Second rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule3.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'rule3.mdc',
          content: 'Third rule',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.itemCount).toBe(3);

      const claudePath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('First rule');
      expect(content).toContain('Second rule');
      expect(content).toContain('Third rule');
    });

    it('should emit Merged warning when combining multiple sources', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'a.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'a.mdc',
          content: 'A',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'b.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'b.mdc',
          content: 'B',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe(WarningCode.Merged);
      expect(result.warnings[0]?.message).toContain('2');
      expect(result.warnings[0]?.sources).toContain('a.mdc');
      expect(result.warnings[0]?.sources).toContain('b.mdc');
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

describe('Claude FileRule Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single FileRule', () => {
    it('should create rule content file in .a16n/rules/', async () => {
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

      await claudePlugin.emit(models, tempDir);

      const rulePath = path.join(tempDir, '.a16n', 'rules', 'react.txt');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toBe('Use React best practices.');
    });

    it('should create settings.local.json with hook configuration', async () => {
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

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreToolUse).toBeInstanceOf(Array);
      expect(settings.hooks.PreToolUse).toHaveLength(1);
      expect(settings.hooks.PreToolUse[0].matcher).toBe('Read|Write|Edit');
    });

    it('should include glob patterns in hook command', async () => {
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

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      const command = settings.hooks.PreToolUse[0].hooks[0].command;
      expect(command).toContain('@a16n/glob-hook');
      expect(command).toContain('**/*.tsx');
      expect(command).toContain('**/*.jsx');
      expect(command).toContain('.a16n/rules/react.txt');
    });

    it('should emit approximation warning for FileRule', async () => {
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

      const result = await claudePlugin.emit(models, tempDir);

      const approxWarning = result.warnings.find(w => w.code === WarningCode.Approximated);
      expect(approxWarning).toBeDefined();
      expect(approxWarning?.message).toContain('glob-hook');
    });
  });

  describe('multiple FileRules', () => {
    it('should create multiple rule files and combine hooks', async () => {
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

      await claudePlugin.emit(models, tempDir);

      // Check both rule files exist
      const reactRule = await fs.readFile(path.join(tempDir, '.a16n', 'rules', 'react.txt'), 'utf-8');
      const tsRule = await fs.readFile(path.join(tempDir, '.a16n', 'rules', 'typescript.txt'), 'utf-8');
      expect(reactRule).toBe('React rules');
      expect(tsRule).toBe('TypeScript rules');

      // Check settings has both hooks
      const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      expect(settings.hooks.PreToolUse).toHaveLength(2);
    });
  });
});

describe('Claude AgentSkill Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentSkill', () => {
    it('should create skill directory and SKILL.md file', async () => {
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.AgentSkill,
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
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.AgentSkill,
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

  describe('multiple AgentSkills', () => {
    it('should create separate skill directories for each', async () => {
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.AgentSkill,
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Auth content',
          description: 'Auth patterns',
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentSkill, '.cursor/rules/database.mdc'),
          type: CustomizationType.AgentSkill,
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
});

describe('Mixed Model Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should emit GlobalPrompt, FileRule, and AgentSkill together', async () => {
    const models = [
      {
        id: createId(CustomizationType.GlobalPrompt, 'global.mdc'),
        type: CustomizationType.GlobalPrompt,
        sourcePath: 'global.mdc',
        content: 'Global content',
        metadata: {},
      } as GlobalPrompt,
      {
        id: createId(CustomizationType.FileRule, 'react.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: 'react.mdc',
        content: 'React content',
        globs: ['**/*.tsx'],
        metadata: {},
      } as FileRule,
      {
        id: createId(CustomizationType.AgentSkill, 'auth.mdc'),
        type: CustomizationType.AgentSkill,
        sourcePath: 'auth.mdc',
        content: 'Auth content',
        description: 'Auth patterns',
        metadata: {},
      } as AgentSkill,
    ];

    const result = await claudePlugin.emit(models, tempDir);

    // Should have written all three types
    expect(result.written.length).toBeGreaterThanOrEqual(3);

    // Check GlobalPrompt → CLAUDE.md
    const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Global content');

    // Check FileRule → .a16n/rules/ + .claude/settings.local.json
    const reactRule = await fs.readFile(path.join(tempDir, '.a16n', 'rules', 'react.txt'), 'utf-8');
    expect(reactRule).toBe('React content');
    const settings = JSON.parse(await fs.readFile(path.join(tempDir, '.claude', 'settings.local.json'), 'utf-8'));
    expect(settings.hooks).toBeDefined();

    // Check AgentSkill → .claude/skills/
    const authSkill = await fs.readFile(path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md'), 'utf-8');
    expect(authSkill).toContain('Auth content');
  });
});
