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
  type AgentIgnore,
  type AgentCommand,
  createId,
} from '@a16njs/models';

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
      expect(command).toContain('@a16njs/glob-hook');
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

  describe('skill name in frontmatter', () => {
    it('should include name from metadata in skill frontmatter', async () => {
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.AgentSkill,
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

    it('should omit name if not present in metadata', async () => {
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
      expect(content).not.toContain('name:');
      expect(content).toContain('description: "Authentication patterns"');
    });
  });
});

describe('Claude Settings Merge Behavior (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should merge with existing settings.local.json', async () => {
    // Create pre-existing settings
    const claudeDir = path.join(tempDir, '.claude');
    await fs.mkdir(claudeDir, { recursive: true });
    const existingSettings = {
      userPreference: 'keep-me',
      hooks: {
        PreToolUse: [{ matcher: 'existing', hooks: [{ type: 'command', command: 'existing-cmd' }] }],
        PostToolUse: [{ matcher: 'post', hooks: [] }],
      },
    };
    await fs.writeFile(
      path.join(claudeDir, 'settings.local.json'),
      JSON.stringify(existingSettings, null, 2),
      'utf-8'
    );

    // Emit FileRule
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

    // Verify merge
    const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
    const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
    
    // Existing settings preserved
    expect(settings.userPreference).toBe('keep-me');
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    
    // PreToolUse hooks merged (existing + new)
    expect(settings.hooks.PreToolUse).toHaveLength(2);
    expect(settings.hooks.PreToolUse[0].matcher).toBe('existing');
    expect(settings.hooks.PreToolUse[1].matcher).toBe('Read|Write|Edit');
  });

  it('should create fresh settings if file does not exist', async () => {
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

    const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
    const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
    
    expect(settings.hooks.PreToolUse).toHaveLength(1);
  });

  it('should warn and overwrite if existing settings is invalid JSON', async () => {
    const claudeDir = path.join(tempDir, '.claude');
    await fs.mkdir(claudeDir, { recursive: true });
    await fs.writeFile(
      path.join(claudeDir, 'settings.local.json'),
      'not valid json {{{',
      'utf-8'
    );

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

    // Should have a warning about the invalid JSON
    const skipWarning = result.warnings.find(w => w.code === WarningCode.Skipped);
    expect(skipWarning).toBeDefined();
    expect(skipWarning?.message).toContain('Could not parse existing settings.local.json');

    // But should still write valid settings
    const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
    const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
    expect(settings.hooks.PreToolUse).toHaveLength(1);
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

describe('Claude AgentIgnore Emission (Phase 3)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentIgnore', () => {
    it('should emit AgentIgnore as permissions.deny in settings.json', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, '.cursorignore'),
          type: CustomizationType.AgentIgnore,
          sourcePath: '.cursorignore',
          content: '',
          patterns: ['dist/', '.env', '*.log'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.AgentIgnore);

      // Verify settings.json was created
      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.deny).toBeInstanceOf(Array);
    });

    it('should convert directory patterns correctly (dist/ → Read(./dist/**))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['dist/', 'build/', 'secrets/'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
      expect(settings.permissions.deny).toContain('Read(./build/**)');
      expect(settings.permissions.deny).toContain('Read(./secrets/**)');
    });

    it('should convert glob patterns correctly (*.log → Read(./**/*.log))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['*.log', '*.tmp', '*.bak'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./**/*.log)');
      expect(settings.permissions.deny).toContain('Read(./**/*.tmp)');
      expect(settings.permissions.deny).toContain('Read(./**/*.bak)');
    });

    it('should convert simple file patterns correctly (.env → Read(./.env))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['.env', '.env.local', 'config.json'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./.env)');
      expect(settings.permissions.deny).toContain('Read(./.env.local)');
      expect(settings.permissions.deny).toContain('Read(./config.json)');
    });

    it('should convert double-star patterns correctly (**/*.tmp → Read(./**/*.tmp))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['**/*.tmp', '**/node_modules/**'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./**/*.tmp)');
      expect(settings.permissions.deny).toContain('Read(./**/node_modules/**)');
    });

    it('should emit approximation warning', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, '.cursorignore'),
          type: CustomizationType.AgentIgnore,
          sourcePath: '.cursorignore',
          content: '',
          patterns: ['dist/'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const approxWarning = result.warnings.find(w => w.code === WarningCode.Approximated);
      expect(approxWarning).toBeDefined();
      expect(approxWarning?.message).toContain('permissions.deny');
    });
  });

  describe('merging with existing settings.json', () => {
    it('should merge deny rules with existing settings.json', async () => {
      // Create pre-existing settings.json
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      const existingSettings = {
        permissions: {
          allow: ['Read(./src/**)'],
          deny: ['Read(./existing-deny)'],
        },
        otherSetting: 'preserved',
      };
      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(existingSettings, null, 2),
        'utf-8'
      );

      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));

      // Existing settings preserved
      expect(settings.otherSetting).toBe('preserved');
      expect(settings.permissions.allow).toContain('Read(./src/**)');

      // Existing deny rules preserved + new ones added
      expect(settings.permissions.deny).toContain('Read(./existing-deny)');
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
      expect(settings.permissions.deny).toContain('Read(./.env)');
    });

    it('should deduplicate deny rules', async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      const existingSettings = {
        permissions: {
          deny: ['Read(./dist/**)'], // Already exists
        },
      };
      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(existingSettings, null, 2),
        'utf-8'
      );

      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));

      // dist/ should only appear once
      const distCount = settings.permissions.deny.filter((r: string) => r === 'Read(./dist/**)').length;
      expect(distCount).toBe(1);
    });
  });

  describe('mixed with other types', () => {
    it('should emit AgentIgnore alongside GlobalPrompt', async () => {
      const models = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'global.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'global.md',
          content: 'Use TypeScript.',
          metadata: {},
        } as GlobalPrompt,
        {
          id: createId(CustomizationType.AgentIgnore, 'ignore'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'ignore',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        } as AgentIgnore,
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both files exist
      const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
      expect(claudeMd).toContain('Use TypeScript.');

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
    });
  });
});

describe('Claude AgentCommand Emission (Phase 4)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentCommand', () => {
    it('should emit AgentCommand as .claude/skills/*/SKILL.md', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review this code for security vulnerabilities.',
          commandName: 'review',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.AgentCommand);

      // Verify skill file was created
      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Review this code for security vulnerabilities.');
    });

    it('should include name in skill frontmatter', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review content',
          commandName: 'review',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name: "review"');
    });

    it('should include description for slash invocation', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review content',
          commandName: 'review',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('description:');
      expect(content).toContain('/review');
    });
  });

  describe('multiple AgentCommands', () => {
    it('should create separate skill directories for each command', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review content',
          commandName: 'review',
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/explain.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/explain.md',
          content: 'Explain content',
          commandName: 'explain',
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

    it('should handle command name collisions', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'First review',
          commandName: 'review',
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/shared/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/shared/review.md',
          content: 'Second review',
          commandName: 'review',
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
    it('should emit AgentCommand alongside GlobalPrompt', async () => {
      const models = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'global.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'global.md',
          content: 'Use TypeScript.',
          metadata: {},
        } as GlobalPrompt,
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'Review code.',
          commandName: 'review',
          metadata: {},
        } as AgentCommand,
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both exist
      const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
      expect(claudeMd).toContain('Use TypeScript.');

      const skillPath = path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Review code.');
    });
  });

  describe('collision prevention with AgentSkills', () => {
    it('should prevent collisions when AgentSkill and AgentCommand have same name', async () => {
      const models = [
        {
          id: createId(CustomizationType.AgentSkill, '.cursor/rules/review.mdc'),
          type: CustomizationType.AgentSkill,
          sourcePath: '.cursor/rules/review.mdc',
          content: 'Skill content for review',
          description: 'Review skill',
          metadata: {},
        } as AgentSkill,
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/review.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/review.md',
          content: 'Command content for review',
          commandName: 'review',
          metadata: {},
        } as AgentCommand,
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

      // First should be skill (processed first), second should be command
      expect(reviewContent).toContain('Skill content for review');
      expect(review1Content).toContain('Command content for review');
    });
  });

  describe('command name sanitization (security)', () => {
    it('should sanitize command names with path traversal attempts', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/evil.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/evil.md',
          content: 'Malicious content',
          commandName: '../../../etc/passwd',
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

    it('should sanitize command names with backslash path separators', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/evil.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/evil.md',
          content: 'Malicious content',
          commandName: '..\\..\\..\\etc\\passwd',
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

    it('should use fallback name for empty sanitized command name', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/special.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/special.md',
          content: 'Content',
          commandName: '!!!',
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
