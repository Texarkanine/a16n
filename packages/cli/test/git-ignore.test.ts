import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  isGitIgnored,
  isGitTracked,
  isGitRepo,
  addToGitIgnore,
  addToGitExclude,
  updatePreCommitHook,
  getIgnoreSource,
  type GitIgnoreResult,
  type IgnoreSource,
} from '../src/git-ignore.js';

describe('Git Utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'a16n-git-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('isGitRepo', () => {
    it('should return true for a git repository', async () => {
      // Initialize a git repo
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      const result = await isGitRepo(testDir);
      expect(result).toBe(true);
    });

    it('should return false for a non-git directory', async () => {
      const result = await isGitRepo(testDir);
      expect(result).toBe(false);
    });
  });

  describe('isGitIgnored', () => {
    it('should return true for an ignored file', async () => {
      // Initialize git repo properly
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create .gitignore with entry
      await fs.writeFile(path.join(testDir, '.gitignore'), 'ignored.txt\n');
      
      const result = await isGitIgnored(testDir, 'ignored.txt');
      expect(result).toBe(true);
    });

    it('should return false for a tracked file', async () => {
      // Initialize git repo properly
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      const result = await isGitIgnored(testDir, 'tracked.txt');
      expect(result).toBe(false);
    });

    it('should return false for a file in non-git directory', async () => {
      const result = await isGitIgnored(testDir, 'any.txt');
      expect(result).toBe(false);
    });

    it('should return true for files matching glob pattern in .gitignore', async () => {
      // Initialize git repo
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create .gitignore with glob pattern for a directory
      await fs.writeFile(path.join(testDir, '.gitignore'), 'local/\n');
      
      // Create the directory and a file inside
      await fs.mkdir(path.join(testDir, 'local'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'local', 'dev.txt'), 'content');
      
      // The file inside the ignored directory should be ignored
      const result = await isGitIgnored(testDir, 'local/dev.txt');
      expect(result).toBe(true);
    });

    it('should return true for files matching wildcard glob pattern', async () => {
      // Initialize git repo
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create .gitignore with wildcard glob pattern
      await fs.writeFile(path.join(testDir, '.gitignore'), '*.local.txt\n');
      
      // Create a file matching the pattern
      await fs.writeFile(path.join(testDir, 'dev.local.txt'), 'content');
      
      // The file matching the glob should be ignored
      const result = await isGitIgnored(testDir, 'dev.local.txt');
      expect(result).toBe(true);
    });
  });

  describe('isGitTracked', () => {
    it('should return true for a tracked file', async () => {
      // Initialize git repo properly
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create a file and actually track it with git add
      await fs.writeFile(path.join(testDir, 'tracked.txt'), 'content');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['add', 'tracked.txt'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      const result = await isGitTracked(testDir, 'tracked.txt');
      expect(result).toBe(true);
    });

    it('should return false for an untracked file', async () => {
      // Initialize git repo properly
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      const result = await isGitTracked(testDir, 'untracked.txt');
      expect(result).toBe(false);
    });

    it('should return false for a file in non-git directory', async () => {
      const result = await isGitTracked(testDir, 'any.txt');
      expect(result).toBe(false);
    });
  });

  describe('addToGitIgnore', () => {
    it('should create .gitignore with semaphore pattern', async () => {
      const result = await addToGitIgnore(testDir, ['CLAUDE.md', '.a16n/']);
      
      expect(result.file).toBe('.gitignore');
      expect(result.added).toEqual(['CLAUDE.md', '.a16n/']);
      
      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('# BEGIN a16n managed');
      expect(content).toContain('CLAUDE.md');
      expect(content).toContain('.a16n/');
      expect(content).toContain('# END a16n managed');
    });

    it('should preserve existing .gitignore content', async () => {
      // Create existing .gitignore
      await fs.writeFile(
        path.join(testDir, '.gitignore'),
        'node_modules/\n*.log\n'
      );
      
      await addToGitIgnore(testDir, ['CLAUDE.md']);
      
      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('*.log');
      expect(content).toContain('# BEGIN a16n managed');
      expect(content).toContain('CLAUDE.md');
    });

    it('should accumulate entries across multiple runs', async () => {
      // First run
      await addToGitIgnore(testDir, ['CLAUDE.md']);
      
      // Second run with different entries
      await addToGitIgnore(testDir, ['.claude/']);
      
      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      
      // Should have only one semaphore section
      const beginCount = (content.match(/# BEGIN a16n managed/g) || []).length;
      expect(beginCount).toBe(1);
      
      // Should contain BOTH old and new entries (accumulation, not replacement)
      expect(content).toContain('CLAUDE.md');
      expect(content).toContain('.claude/');
    });

    it('should deduplicate entries when same entry is added multiple times', async () => {
      // First run
      await addToGitIgnore(testDir, ['CLAUDE.md', '.a16n/']);
      
      // Second run with some duplicate entries
      await addToGitIgnore(testDir, ['CLAUDE.md', '.claude/']);
      
      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      
      // Should have only one semaphore section
      const beginCount = (content.match(/# BEGIN a16n managed/g) || []).length;
      expect(beginCount).toBe(1);
      
      // Should contain all unique entries
      expect(content).toContain('CLAUDE.md');
      expect(content).toContain('.a16n/');
      expect(content).toContain('.claude/');
      
      // CLAUDE.md should appear only once (deduplicated)
      const claudeCount = (content.match(/CLAUDE\.md/g) || []).length;
      expect(claudeCount).toBe(1);
    });

    it('should sort entries alphabetically for deterministic output', async () => {
      // Add entries in random order
      await addToGitIgnore(testDir, ['zebra.txt']);
      await addToGitIgnore(testDir, ['apple.txt']);
      await addToGitIgnore(testDir, ['mango.txt']);
      
      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      
      // Extract entries from semaphore section
      const beginMarker = '# BEGIN a16n managed';
      const endMarker = '# END a16n managed';
      const beginIdx = content.indexOf(beginMarker);
      const endIdx = content.indexOf(endMarker);
      const section = content.substring(beginIdx + beginMarker.length, endIdx).trim();
      const entries = section.split('\n').filter(line => line.trim().length > 0);
      
      // Should be sorted alphabetically
      expect(entries).toEqual(['apple.txt', 'mango.txt', 'zebra.txt']);
    });

    it('should handle multiple entries', async () => {
      const result = await addToGitIgnore(testDir, [
        'CLAUDE.md',
        '.a16n/',
        '.claude/',
        'temp.txt'
      ]);
      
      expect(result.added).toHaveLength(4);
      
      const content = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(content).toContain('CLAUDE.md');
      expect(content).toContain('.a16n/');
      expect(content).toContain('.claude/');
      expect(content).toContain('temp.txt');
    });
  });

  describe('addToGitExclude', () => {
    it('should create .git/info/exclude with semaphore pattern', async () => {
      // Create .git directory
      await fs.mkdir(path.join(testDir, '.git', 'info'), { recursive: true });
      
      const result = await addToGitExclude(testDir, ['CLAUDE.md', '.a16n/']);
      
      expect(result.file).toBe('.git/info/exclude');
      expect(result.added).toEqual(['CLAUDE.md', '.a16n/']);
      
      const content = await fs.readFile(
        path.join(testDir, '.git', 'info', 'exclude'),
        'utf-8'
      );
      expect(content).toContain('# BEGIN a16n managed');
      expect(content).toContain('CLAUDE.md');
      expect(content).toContain('# END a16n managed');
    });

    it('should preserve existing exclude content', async () => {
      // Create .git/info directory with existing exclude
      await fs.mkdir(path.join(testDir, '.git', 'info'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.git', 'info', 'exclude'),
        '*.tmp\nlocal-config.json\n'
      );
      
      await addToGitExclude(testDir, ['CLAUDE.md']);
      
      const content = await fs.readFile(
        path.join(testDir, '.git', 'info', 'exclude'),
        'utf-8'
      );
      expect(content).toContain('*.tmp');
      expect(content).toContain('local-config.json');
      expect(content).toContain('CLAUDE.md');
    });

    it('should throw error for non-git directory', async () => {
      await expect(addToGitExclude(testDir, ['file.txt'])).rejects.toThrow(
        'Not a git repository'
      );
    });

    it('should accumulate entries across multiple runs', async () => {
      // Create .git/info directory
      await fs.mkdir(path.join(testDir, '.git', 'info'), { recursive: true });
      
      // First run
      await addToGitExclude(testDir, ['CLAUDE.md']);
      
      // Second run with different entries
      await addToGitExclude(testDir, ['.claude/']);
      
      const content = await fs.readFile(
        path.join(testDir, '.git', 'info', 'exclude'),
        'utf-8'
      );
      
      // Should have only one semaphore section
      const beginCount = (content.match(/# BEGIN a16n managed/g) || []).length;
      expect(beginCount).toBe(1);
      
      // Should contain BOTH old and new entries (accumulation, not replacement)
      expect(content).toContain('CLAUDE.md');
      expect(content).toContain('.claude/');
    });
  });

  describe('updatePreCommitHook', () => {
    it('should create pre-commit hook with correct shebang', async () => {
      // Create .git/hooks directory
      await fs.mkdir(path.join(testDir, '.git', 'hooks'), { recursive: true });
      
      const result = await updatePreCommitHook(testDir, ['CLAUDE.md', '.a16n/']);
      
      expect(result.file).toBe('.git/hooks/pre-commit');
      expect(result.added).toEqual(['CLAUDE.md', '.a16n/']);
      
      const content = await fs.readFile(
        path.join(testDir, '.git', 'hooks', 'pre-commit'),
        'utf-8'
      );
      expect(content).toMatch(/^#!/);
      expect(content).toContain('# BEGIN a16n managed');
      expect(content).toContain('git reset HEAD');
      expect(content).toContain('# END a16n managed');
    });

    it('should make hook executable', async () => {
      // Create .git/hooks directory
      await fs.mkdir(path.join(testDir, '.git', 'hooks'), { recursive: true });
      
      await updatePreCommitHook(testDir, ['CLAUDE.md']);
      
      const hookPath = path.join(testDir, '.git', 'hooks', 'pre-commit');
      const stats = await fs.stat(hookPath);
      
      // Check if executable bit is set (mode & 0o111)
      expect(stats.mode & 0o111).not.toBe(0);
    });

    it('should preserve existing hook content', async () => {
      // Create .git/hooks directory with existing hook
      await fs.mkdir(path.join(testDir, '.git', 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.git', 'hooks', 'pre-commit'),
        '#!/bin/bash\n\n# User custom logic\nnpm run lint\n'
      );
      await fs.chmod(path.join(testDir, '.git', 'hooks', 'pre-commit'), 0o755);
      
      await updatePreCommitHook(testDir, ['CLAUDE.md']);
      
      const content = await fs.readFile(
        path.join(testDir, '.git', 'hooks', 'pre-commit'),
        'utf-8'
      );
      expect(content).toContain('npm run lint');
      expect(content).toContain('# BEGIN a16n managed');
    });

    it('should replace semaphore section on subsequent runs', async () => {
      // Create .git/hooks directory
      await fs.mkdir(path.join(testDir, '.git', 'hooks'), { recursive: true });
      
      // First run
      await updatePreCommitHook(testDir, ['CLAUDE.md']);
      
      // Second run with different entries
      await updatePreCommitHook(testDir, ['CLAUDE.md', '.claude/', '.a16n/']);
      
      const content = await fs.readFile(
        path.join(testDir, '.git', 'hooks', 'pre-commit'),
        'utf-8'
      );
      
      // Should have only one semaphore section
      const beginCount = (content.match(/# BEGIN a16n managed/g) || []).length;
      expect(beginCount).toBe(1);
      
      // Should contain all new entries
      expect(content).toContain('.claude/');
      expect(content).toContain('.a16n/');
    });

    it('should throw error for non-git directory', async () => {
      await expect(updatePreCommitHook(testDir, ['file.txt'])).rejects.toThrow(
        'Not a git repository'
      );
    });
  });

  describe('getIgnoreSource', () => {
    it('should return .gitignore when file is ignored via .gitignore', async () => {
      // Initialize git repo
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create .gitignore with entry
      await fs.writeFile(path.join(testDir, '.gitignore'), 'ignored.txt\n');
      
      // Create the file to check
      await fs.writeFile(path.join(testDir, 'ignored.txt'), 'content');
      
      const result = await getIgnoreSource(testDir, 'ignored.txt');
      expect(result).toBe('.gitignore');
    });

    it('should return .git/info/exclude when file is ignored via .git/info/exclude', async () => {
      // Initialize git repo
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create .git/info/exclude with entry
      await fs.mkdir(path.join(testDir, '.git', 'info'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.git', 'info', 'exclude'), 'excluded.txt\n');
      
      // Create the file to check
      await fs.writeFile(path.join(testDir, 'excluded.txt'), 'content');
      
      const result = await getIgnoreSource(testDir, 'excluded.txt');
      expect(result).toBe('.git/info/exclude');
    });

    it('should return null when file is not ignored', async () => {
      // Initialize git repo
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      const result = await getIgnoreSource(testDir, 'not-ignored.txt');
      expect(result).toBeNull();
    });

    it('should return correct source for directory glob patterns', async () => {
      // Initialize git repo
      const { spawn } = await import('child_process');
      await new Promise<void>((resolve) => {
        const proc = spawn('git', ['init'], { cwd: testDir });
        proc.on('close', () => resolve());
      });
      
      // Create .git/info/exclude with directory pattern
      await fs.mkdir(path.join(testDir, '.git', 'info'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.git', 'info', 'exclude'), 'local/\n');
      
      // Create the directory and file
      await fs.mkdir(path.join(testDir, 'local'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'local', 'dev.txt'), 'content');
      
      const result = await getIgnoreSource(testDir, 'local/dev.txt');
      expect(result).toBe('.git/info/exclude');
    });

    it('should return null for non-git directory', async () => {
      const result = await getIgnoreSource(testDir, 'any.txt');
      expect(result).toBeNull();
    });
  });
});
