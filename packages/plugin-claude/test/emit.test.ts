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
  type ManualPrompt,
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
    it('should emit a single GlobalPrompt as .claude/rules/*.md', async () => {
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

      // Verify file was created in .claude/rules/
      const rulePath = path.join(tempDir, '.claude', 'rules', 'test.md');
      const content = await fs.readFile(rulePath, 'utf-8');
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

      const rulePath = path.join(tempDir, '.claude', 'rules', 'test.md');
      const content = await fs.readFile(rulePath, 'utf-8');
      expect(content).toContain('.cursor/rules/test.mdc');
    });

    it('should NOT include frontmatter in GlobalPrompt files', async () => {
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

      // BREAKING: No merge warning since each gets its own file
      expect(result.warnings).toHaveLength(0);
    });

    it('should NOT create CLAUDE.md file', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
          type: CustomizationType.GlobalPrompt,
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
          sourcePath: '.cursor/rules/test.mdc',
          content: 'First test',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/shared/test.mdc'),
          type: CustomizationType.GlobalPrompt,
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

describe('Claude FileRule Emission (Phase 8 A2)', () => {
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

describe('Mixed Model Emission (Phase 8 A2)', () => {
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

    // Should have written all three types (3 files total)
    expect(result.written).toHaveLength(3);

    // Check GlobalPrompt → .claude/rules/global.md (no frontmatter)
    const globalRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'global.md'), 'utf-8');
    expect(globalRule).toContain('Global content');
    expect(globalRule).not.toMatch(/^---\n.*paths:/s);

    // Check FileRule → .claude/rules/react.md (with paths frontmatter)
    const reactRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'react.md'), 'utf-8');
    expect(reactRule).toContain('React content');
    expect(reactRule).toContain('paths:');
    expect(reactRule).toContain('**/*.tsx');

    // Check AgentSkill → .claude/skills/auth/SKILL.md
    const authSkill = await fs.readFile(path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md'), 'utf-8');
    expect(authSkill).toContain('Auth content');

    // Verify NO settings.local.json created
    await expect(fs.access(path.join(tempDir, '.claude', 'settings.local.json'))).rejects.toThrow();

    // Verify NO .a16n directory created
    await expect(fs.access(path.join(tempDir, '.a16n'))).rejects.toThrow();
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

      // Verify GlobalPrompt → .claude/rules/global.md
      const globalRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'global.md'), 'utf-8');
      expect(globalRule).toContain('Use TypeScript.');

      // Verify AgentIgnore → .claude/settings.json
      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
    });
  });
});

describe('Claude ManualPrompt Emission (Phase 4)', () => {
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

  describe('collision prevention with AgentSkills', () => {
    it('should prevent collisions when AgentSkill and ManualPrompt have same name', async () => {
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

describe('Claude Plugin - sourceItems tracking (Phase 8 A2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should populate sourceItems for each GlobalPrompt → .claude/rules/*.md (1:1)', async () => {
    // Test that WrittenFile for each .claude/rules/*.md includes
    // sourceItems array with single GlobalPrompt
    const gp1: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'rule1.mdc',
      content: 'Rule 1',
      metadata: {},
    };
    const gp2: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'rule2.mdc'),
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'rule2.mdc',
      content: 'Rule 2',
      metadata: {},
    };
    const gp3: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'rule3.mdc'),
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'rule3.mdc',
      content: 'Rule 3',
      metadata: {},
    };

    const result = await claudePlugin.emit([gp1, gp2, gp3], tempDir);

    // BREAKING: Each GlobalPrompt gets its own file
    expect(result.written).toHaveLength(3);
    
    // Each written file should have 1:1 sourceItems mapping
    result.written.forEach(written => {
      expect(written.type).toBe(CustomizationType.GlobalPrompt);
      expect(written.itemCount).toBe(1);
      expect(written.sourceItems).toBeDefined();
      expect(written.sourceItems).toHaveLength(1);
    });

    // Verify each sourceItem is one of the original items
    const sourceItems = result.written.flatMap(w => w.sourceItems || []);
    expect(sourceItems).toContain(gp1);
    expect(sourceItems).toContain(gp2);
    expect(sourceItems).toContain(gp3);
  });

  it('should populate sourceItems for FileRule → .claude/rules/*.md (1:1)', async () => {
    // Test that WrittenFile for each .claude/rules/*.md includes
    // sourceItems array with single FileRule
    const rule: FileRule = {
      id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: '.cursor/rules/react.mdc',
      content: 'React rules',
      globs: ['**/*.tsx'],
      metadata: {},
    };

    const result = await claudePlugin.emit([rule], tempDir);

    // BREAKING: Should have 1 written file (no settings.local.json)
    expect(result.written).toHaveLength(1);
    
    const ruleFile = result.written[0];
    expect(ruleFile).toBeDefined();
    expect(ruleFile?.type).toBe(CustomizationType.FileRule);
    expect(ruleFile?.itemCount).toBe(1);
    expect(ruleFile?.sourceItems).toBeDefined();
    expect(ruleFile?.sourceItems).toHaveLength(1);
    expect(ruleFile?.sourceItems?.[0]).toBe(rule);
  });

  it('should populate sourceItems for each FileRule → .claude/rules/*.md (multiple)', async () => {
    // Test that each FileRule gets its own file with 1:1 sourceItems mapping
    const rule1: FileRule = {
      id: createId(CustomizationType.FileRule, 'rule1.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: 'rule1.mdc',
      content: 'Rule 1',
      globs: ['**/*.ts'],
      metadata: {},
    };
    const rule2: FileRule = {
      id: createId(CustomizationType.FileRule, 'rule2.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: 'rule2.mdc',
      content: 'Rule 2',
      globs: ['**/*.tsx'],
      metadata: {},
    };

    const result = await claudePlugin.emit([rule1, rule2], tempDir);

    // BREAKING: Should have 2 written files (no settings.local.json)
    expect(result.written).toHaveLength(2);
    
    // Each file should have 1:1 sourceItems mapping
    result.written.forEach(written => {
      expect(written.type).toBe(CustomizationType.FileRule);
      expect(written.itemCount).toBe(1);
      expect(written.sourceItems).toBeDefined();
      expect(written.sourceItems).toHaveLength(1);
    });

    // Verify each sourceItem is one of the original items
    const sourceItems = result.written.flatMap(w => w.sourceItems || []);
    expect(sourceItems).toContain(rule1);
    expect(sourceItems).toContain(rule2);
  });

  it('should populate sourceItems for AgentSkill → .claude/skills/*/SKILL.md (1:1)', async () => {
    // Test that WrittenFile for each skill SKILL.md includes
    // sourceItems array with single AgentSkill
    const skill: AgentSkill = {
      id: createId(CustomizationType.AgentSkill, '.cursor/rules/database.mdc'),
      type: CustomizationType.AgentSkill,
      sourcePath: '.cursor/rules/database.mdc',
      content: 'Database operations',
      description: 'Database helper',
      metadata: {},
    };

    const result = await claudePlugin.emit([skill], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.AgentSkill);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(skill);
  });

  it('should populate sourceItems for AgentIgnores → settings.json (merged)', async () => {
    // Test that WrittenFile for settings.json includes sourceItems
    // array containing all AgentIgnores that were processed
    const ignore1: AgentIgnore = {
      id: createId(CustomizationType.AgentIgnore, 'ignore1.mdc'),
      type: CustomizationType.AgentIgnore,
      sourcePath: 'ignore1.mdc',
      content: '',
      patterns: ['*.log'],
      metadata: {},
    };
    const ignore2: AgentIgnore = {
      id: createId(CustomizationType.AgentIgnore, 'ignore2.mdc'),
      type: CustomizationType.AgentIgnore,
      sourcePath: 'ignore2.mdc',
      content: '',
      patterns: ['tmp/'],
      metadata: {},
    };

    const result = await claudePlugin.emit([ignore1, ignore2], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.AgentIgnore);
    expect(written?.itemCount).toBe(2);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(2);
    expect(written?.sourceItems).toContain(ignore1);
    expect(written?.sourceItems).toContain(ignore2);
  });

  it('should populate sourceItems for ManualPrompt → .claude/skills/*/SKILL.md (1:1)', async () => {
    // Test that WrittenFile for each prompt SKILL.md includes
    // sourceItems array with single ManualPrompt
    const prompt: ManualPrompt = {
      id: createId(CustomizationType.ManualPrompt, '.cursor/commands/build.md'),
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/commands/build.md',
      content: 'Build command content',
      promptName: 'build',
      metadata: {},
    };

    const result = await claudePlugin.emit([prompt], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.ManualPrompt);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(prompt);
  });
});
