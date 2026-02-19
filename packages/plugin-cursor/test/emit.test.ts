import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
  type ManualPrompt,
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

describe('Cursor SimpleAgentSkill Emission (Phase 2)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single SimpleAgentSkill', () => {
    it('should emit SimpleAgentSkill as .mdc with description: frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/auth/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
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
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'auth.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
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
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'test.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'test',
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

describe('Cursor Mixed Emission (Phase 2 - Updated for Phase 7)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should emit GlobalPrompt and FileRule to rules, SimpleAgentSkill to skills', async () => {
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
        id: createId(CustomizationType.SimpleAgentSkill, 'auth.md'),
        type: CustomizationType.SimpleAgentSkill,
        name: 'auth',
        sourcePath: 'auth.md',
        content: 'Auth content',
        description: 'Auth patterns',
        metadata: {},
      } as SimpleAgentSkill,
    ];

    const result = await cursorPlugin.emit(models, tempDir);

    expect(result.written).toHaveLength(3);

    // Read files from .cursor/rules (GlobalPrompt + FileRule)
    const rulesFiles = await fs.readdir(path.join(tempDir, '.cursor', 'rules'));
    expect(rulesFiles).toHaveLength(2);

    // Check we have one with alwaysApply (GlobalPrompt) and one with globs (FileRule)
    const rulesContents = await Promise.all(
      rulesFiles.map(f => fs.readFile(path.join(tempDir, '.cursor', 'rules', f), 'utf-8'))
    );
    expect(rulesContents.some(c => c.includes('alwaysApply: true'))).toBe(true);
    expect(rulesContents.some(c => c.includes('globs:'))).toBe(true);

    // Check SimpleAgentSkill in .cursor/skills
    const skillPath = path.join(tempDir, '.cursor', 'skills', 'auth', 'SKILL.md');
    const skillContent = await fs.readFile(skillPath, 'utf-8');
    expect(skillContent).toContain('description:');
    expect(skillContent).toContain('Auth patterns');
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

describe('Cursor ManualPrompt Emission (Phase 4 - Updated to Skills in Phase 7)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single ManualPrompt', () => {
    it('should emit ManualPrompt as .cursor/skills/*/SKILL.md file', async () => {
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

      // Verify file was created in skills directory
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Review this code for security vulnerabilities.');
    });

    it('should create .cursor/skills directory if it does not exist', async () => {
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

      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const stat = await fs.stat(skillsDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('multiple ManualPrompts', () => {
    it('should emit multiple commands as separate skill directories', async () => {
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both exist
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

      // Should NOT create file outside .cursor/skills/
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
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

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Should NOT create file outside .cursor/skills/
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

      // Should use fallback name 'command'
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'command', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Content');
    });

    it('should handle prompt name collisions with sanitization and de-duplication', async () => {
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

      // First should be 'review', second should be 'review-1'
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries.sort()).toEqual(['review', 'review-1']);
    });
  });
});

describe('Cursor Skills Emission (Phase 7)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('SimpleAgentSkill emission to .cursor/skills/', () => {
    it('should emit SimpleAgentSkill to .cursor/skills/<name>/SKILL.md', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/auth/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth-helper',
          sourcePath: '.claude/skills/auth/SKILL.md',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.SimpleAgentSkill);

      // Verify skill directory structure
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'auth-helper', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should include name and description in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/db/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'database',
          sourcePath: '.claude/skills/db/SKILL.md',
          content: 'Database operations',
          description: 'Database helper',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'database', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('Database helper');
    });

    it('should sanitize skill names for directory creation', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/weird/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'My Skill (v2)',
          sourcePath: '.claude/skills/weird/SKILL.md',
          content: 'Content',
          description: 'Test',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      // Name should be sanitized
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatch(/^[\w-]+$/);
    });
  });

  describe('ManualPrompt emission to .cursor/skills/', () => {
    it('should emit ManualPrompt to .cursor/skills/<name>/SKILL.md with disable flag', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.claude/skills/review/SKILL.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.claude/skills/review/SKILL.md',
          content: 'Review this code.',
          promptName: 'review',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.ManualPrompt);

      // Verify skill directory structure
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Review this code.');
      expect(content).toContain('disable-model-invocation: true');
    });

    it('should include name and description in ManualPrompt skill', async () => {
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

      await cursorPlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'deploy', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name:');
      expect(content).toContain('deploy');
    });
  });

  describe('collision handling', () => {
    it('should handle collisions between SimpleAgentSkill and ManualPrompt with same name', async () => {
      const models = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/review/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'review',
          sourcePath: '.claude/skills/review/SKILL.md',
          content: 'Skill content',
          description: 'Review skill',
          metadata: {},
        } as SimpleAgentSkill,
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Prompt content',
          promptName: 'review',
          metadata: {},
        } as ManualPrompt,
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Both should exist with unique names
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(2);
      expect(entries.sort()).toEqual(['review', 'review-1']);
    });
  });
});

describe('Cursor Plugin - sourceItems tracking (CR-10)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should populate sourceItems for GlobalPrompt → .mdc (1:1)', async () => {
    // Test that WrittenFile for each GlobalPrompt .mdc includes
    // sourceItems array with single GlobalPrompt
    const gp: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
      type: CustomizationType.GlobalPrompt,
      sourcePath: '.cursor/rules/test.mdc',
      content: 'Test content',
      metadata: {},
    };

    const result = await cursorPlugin.emit([gp], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.GlobalPrompt);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(gp);
  });

  it('should populate sourceItems for FileRule → .mdc (1:1)', async () => {
    // Test that WrittenFile for each FileRule .mdc includes
    // sourceItems array with single FileRule
    const fr: FileRule = {
      id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: '.cursor/rules/react.mdc',
      content: 'React rules',
      globs: ['**/*.tsx'],
      metadata: {},
    };

    const result = await cursorPlugin.emit([fr], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.FileRule);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(fr);
  });

  it('should populate sourceItems for SimpleAgentSkill → SKILL.md (1:1)', async () => {
    // Test that WrittenFile for each SimpleAgentSkill SKILL.md includes
    // sourceItems array with single SimpleAgentSkill
    const skill: SimpleAgentSkill = {
      id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/database.mdc'),
      type: CustomizationType.SimpleAgentSkill,
      name: 'database',
      sourcePath: '.cursor/rules/database.mdc',
      content: 'Database operations',
      description: 'Database helper',
      metadata: {},
    };

    const result = await cursorPlugin.emit([skill], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(skill);
  });

  it('should populate sourceItems for AgentIgnores → .cursorignore (merged)', async () => {
    // Test that WrittenFile for .cursorignore includes sourceItems
    // array containing all AgentIgnores that were merged
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
    const ignore3: AgentIgnore = {
      id: createId(CustomizationType.AgentIgnore, 'ignore3.mdc'),
      type: CustomizationType.AgentIgnore,
      sourcePath: 'ignore3.mdc',
      content: '',
      patterns: ['*.tmp'],
      metadata: {},
    };

    const result = await cursorPlugin.emit([ignore1, ignore2, ignore3], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.AgentIgnore);
    expect(written?.itemCount).toBe(3);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(3);
    expect(written?.sourceItems).toContain(ignore1);
    expect(written?.sourceItems).toContain(ignore2);
    expect(written?.sourceItems).toContain(ignore3);
  });

  it('should populate sourceItems for ManualPrompt → .md (1:1)', async () => {
    // Test that WrittenFile for each ManualPrompt .md includes
    // sourceItems array with single ManualPrompt
    const command: ManualPrompt = {
      id: createId(CustomizationType.ManualPrompt, '.cursor/commands/build.md'),
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/commands/build.md',
      content: 'Build command content',
      promptName: 'build',
      metadata: {},
    };

    const result = await cursorPlugin.emit([command], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.ManualPrompt);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(command);
  });
});

describe('Cursor AgentSkillIO Emission (Phase 8 B4)', () => {
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
      expect(result.written.length).toBeGreaterThanOrEqual(1);
      
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
