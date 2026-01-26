import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
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

describe('Cursor Plugin Emission', () => {
  beforeEach(async () => {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single GlobalPrompt', () => {
    it('should emit a single GlobalPrompt as .mdc file', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'CLAUDE.md',
          content: 'Always use TypeScript.',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      // Verify file was created
      const writtenPath = result.written[0]?.path;
      expect(writtenPath).toBeDefined();
      
      const content = await fs.readFile(writtenPath!, 'utf-8');
      expect(content).toContain('alwaysApply: true');
      expect(content).toContain('Always use TypeScript.');
    });

    it('should create .cursor/rules directory if it does not exist', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'source.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'source.md',
          content: 'Test content',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const rulesDir = path.join(tempDir, '.cursor', 'rules');
      const stat = await fs.stat(rulesDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('multiple GlobalPrompts', () => {
    it('should emit multiple GlobalPrompts as separate .mdc files', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'first.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'first.md',
          content: 'First rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'second.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'second.md',
          content: 'Second rule',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);

      // Verify both files exist
      for (const written of result.written) {
        const content = await fs.readFile(written.path, 'utf-8');
        expect(content).toContain('alwaysApply: true');
      }
    });
  });

  describe('filename sanitization', () => {
    it('should generate safe filenames from source paths', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'path/to/CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'path/to/CLAUDE.md',
          content: 'Nested content',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Sanitizer removes extension and converts to lowercase
      expect(filename).toBe('claude.mdc');
    });

    it('should handle special characters in filenames', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'My Rules (v2).md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'My Rules (v2).md',
          content: 'Content',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Should be sanitized to safe characters
      expect(filename).toMatch(/^[\w-]+\.mdc$/);
    });

    it('should use fallback name when sanitization produces empty string', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '!!!.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '!!!.md',
          content: 'Content from special-only filename',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      const filename = path.basename(result.written[0]!.path);
      // Should fall back to 'rule' when sanitization produces empty
      expect(filename).toBe('rule.mdc');
    });

    it('should handle filename collisions by appending counter', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'dir1/CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'dir1/CLAUDE.md',
          content: 'First',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'dir2/CLAUDE.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'dir2/CLAUDE.md',
          content: 'Second',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'dir3/claude.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'dir3/claude.md',
          content: 'Third',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(3);
      
      const filenames = result.written.map(w => path.basename(w.path)).sort();
      expect(filenames).toEqual(['claude-2.mdc', 'claude-3.mdc', 'claude.mdc']);

      // Verify each file has distinct content
      const contents = await Promise.all(
        result.written.map(w => fs.readFile(w.path, 'utf-8'))
      );
      expect(contents.some(c => c.includes('First'))).toBe(true);
      expect(contents.some(c => c.includes('Second'))).toBe(true);
      expect(contents.some(c => c.includes('Third'))).toBe(true);
    });

    it('should emit warning when filename collision occurs', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'a/test.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'a/test.md',
          content: 'First',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'b/test.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'b/test.md',
          content: 'Second',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('collision');
    });
  });

  describe('empty input', () => {
    it('should handle empty models array', async () => {
      const result = await cursorPlugin.emit([], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);
    });
  });
});

describe('Cursor FileRule Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single FileRule', () => {
    it('should emit FileRule as .mdc with globs: frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, '.claude/skills/react/SKILL.md'),
          type: CustomizationType.FileRule,
          sourcePath: '.claude/skills/react/SKILL.md',
          content: 'Use React best practices.',
          globs: ['**/*.tsx', '**/*.jsx'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.unsupported).toHaveLength(0);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      expect(content).toContain('globs:');
      expect(content).toContain('**/*.tsx');
      expect(content).toContain('**/*.jsx');
    });

    it('should include rule content after frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'react.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'react.md',
          content: 'Use React best practices.',
          globs: ['**/*.tsx'],
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const files = await fs.readdir(path.join(tempDir, '.cursor', 'rules'));
      expect(files).toHaveLength(1);
      
      const content = await fs.readFile(
        path.join(tempDir, '.cursor', 'rules', files[0]!),
        'utf-8'
      );
      expect(content).toContain('Use React best practices.');
    });

    it('should format multiple globs as comma-separated string', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'react.md'),
          type: CustomizationType.FileRule,
          sourcePath: 'react.md',
          content: 'Content',
          globs: ['**/*.tsx', '**/*.jsx', 'src/components/**'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      // Globs should be on a single line, comma-separated
      expect(content).toMatch(/globs:.*\*\*\/\*\.tsx.*\*\*\/\*\.jsx.*src\/components\/\*\*/);
    });
  });
});

describe('Cursor AgentSkill Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentSkill', () => {
    it('should emit AgentSkill as .mdc with description: frontmatter', async () => {
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, '.claude/skills/auth/SKILL.md'),
          type: CustomizationType.AgentSkill,
          sourcePath: '.claude/skills/auth/SKILL.md',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.unsupported).toHaveLength(0);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      expect(content).toContain('description:');
      expect(content).toContain('Authentication patterns');
    });

    it('should include skill content after frontmatter', async () => {
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, 'auth.md'),
          type: CustomizationType.AgentSkill,
          sourcePath: 'auth.md',
          content: 'Use JWT for authentication.',
          description: 'Auth patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should quote description with special characters', async () => {
      const models: AgentSkill[] = [
        {
          id: createId(CustomizationType.AgentSkill, 'test.md'),
          type: CustomizationType.AgentSkill,
          sourcePath: 'test.md',
          content: 'Content',
          description: 'Auth: patterns & guidelines',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      // Description should be quoted to handle special characters
      expect(content).toContain('description:');
      expect(content).toContain('Auth: patterns & guidelines');
    });
  });
});

describe('Cursor Mixed Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should emit GlobalPrompt, FileRule, and AgentSkill together', async () => {
    const models = [
      {
        id: createId(CustomizationType.GlobalPrompt, 'global.md'),
        type: CustomizationType.GlobalPrompt,
        sourcePath: 'global.md',
        content: 'Global content',
        metadata: {},
      } as GlobalPrompt,
      {
        id: createId(CustomizationType.FileRule, 'react.md'),
        type: CustomizationType.FileRule,
        sourcePath: 'react.md',
        content: 'React content',
        globs: ['**/*.tsx'],
        metadata: {},
      } as FileRule,
      {
        id: createId(CustomizationType.AgentSkill, 'auth.md'),
        type: CustomizationType.AgentSkill,
        sourcePath: 'auth.md',
        content: 'Auth content',
        description: 'Auth patterns',
        metadata: {},
      } as AgentSkill,
    ];

    const result = await cursorPlugin.emit(models, tempDir);

    expect(result.written).toHaveLength(3);

    // Read all emitted files
    const files = await fs.readdir(path.join(tempDir, '.cursor', 'rules'));
    expect(files).toHaveLength(3);

    // Check we have one with alwaysApply (GlobalPrompt)
    const contents = await Promise.all(
      files.map(f => fs.readFile(path.join(tempDir, '.cursor', 'rules', f), 'utf-8'))
    );
    expect(contents.some(c => c.includes('alwaysApply: true'))).toBe(true);
    expect(contents.some(c => c.includes('globs:'))).toBe(true);
    expect(contents.some(c => c.includes('description:'))).toBe(true);
  });
});

describe('Cursor AgentIgnore Emission (Phase 3)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentIgnore', () => {
    it('should emit AgentIgnore as .cursorignore file', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, '.claude/settings.json'),
          type: CustomizationType.AgentIgnore,
          sourcePath: '.claude/settings.json',
          content: '',
          patterns: ['dist/', '.env', '*.log'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.AgentIgnore);

      // Verify .cursorignore was created
      const ignorePath = path.join(tempDir, '.cursorignore');
      const content = await fs.readFile(ignorePath, 'utf-8');
      expect(content).toContain('dist/');
      expect(content).toContain('.env');
      expect(content).toContain('*.log');
    });

    it('should write patterns one per line with trailing newline', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['a/', 'b/', 'c/'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(path.join(tempDir, '.cursorignore'), 'utf-8');
      expect(content).toBe('a/\nb/\nc/\n');
    });
  });

  describe('multiple AgentIgnores', () => {
    it('should merge multiple AgentIgnores into single .cursorignore', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source1'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source1',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentIgnore, 'source2'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source2',
          content: '',
          patterns: ['build/', '*.log'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const content = await fs.readFile(path.join(tempDir, '.cursorignore'), 'utf-8');
      expect(content).toContain('dist/');
      expect(content).toContain('.env');
      expect(content).toContain('build/');
      expect(content).toContain('*.log');
    });

    it('should deduplicate patterns from multiple sources', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source1'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source1',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentIgnore, 'source2'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source2',
          content: '',
          patterns: ['dist/', '*.log'], // dist/ is duplicate
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(path.join(tempDir, '.cursorignore'), 'utf-8');
      const lines = content.trim().split('\n');
      
      // dist/ should only appear once
      expect(lines.filter(l => l === 'dist/').length).toBe(1);
    });

    it('should emit warning when merging multiple AgentIgnores', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source1'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source1',
          content: '',
          patterns: ['dist/'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentIgnore, 'source2'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source2',
          content: '',
          patterns: ['build/'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]?.message).toContain('Merged');
      expect(result.warnings[0]?.sources).toContain('source1');
      expect(result.warnings[0]?.sources).toContain('source2');
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both files exist
      const rulesExist = await fs.stat(path.join(tempDir, '.cursor', 'rules')).catch(() => null);
      const ignoreExists = await fs.stat(path.join(tempDir, '.cursorignore')).catch(() => null);
      
      expect(rulesExist).not.toBeNull();
      expect(ignoreExists).not.toBeNull();
    });
  });
});

describe('Cursor AgentCommand Emission (Phase 4)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentCommand', () => {
    it('should emit AgentCommand as .cursor/commands/*.md file', async () => {
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.AgentCommand);

      // Verify file was created
      const commandPath = path.join(tempDir, '.cursor', 'commands', 'review.md');
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).toBe('Review this code for security vulnerabilities.');
    });

    it('should create .cursor/commands directory if it does not exist', async () => {
      const models: AgentCommand[] = [
        {
          id: createId(CustomizationType.AgentCommand, '.cursor/commands/test.md'),
          type: CustomizationType.AgentCommand,
          sourcePath: '.cursor/commands/test.md',
          content: 'Test content',
          commandName: 'test',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const commandsDir = path.join(tempDir, '.cursor', 'commands');
      const stat = await fs.stat(commandsDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('multiple AgentCommands', () => {
    it('should emit multiple commands as separate files', async () => {
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both exist
      const rulesExist = await fs.stat(path.join(tempDir, '.cursor', 'rules')).catch(() => null);
      const commandExists = await fs.stat(path.join(tempDir, '.cursor', 'commands', 'review.md')).catch(() => null);

      expect(rulesExist).not.toBeNull();
      expect(commandExists).not.toBeNull();
    });
  });
});
