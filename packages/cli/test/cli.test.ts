import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '.temp-cli-test');
const cliPath = path.join(__dirname, '..', 'dist', 'index.js');

// Helper to run CLI
function runCli(args: string, cwd: string = tempDir): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync('node', [cliPath, ...args.split(' ')], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? 1,
  };
}

describe('CLI', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('--help', () => {
    it('should show help', () => {
      const { stdout, exitCode } = runCli('--help');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('a16n');
      expect(stdout).toContain('convert');
      expect(stdout).toContain('discover');
      expect(stdout).toContain('plugins');
    });
  });

  describe('plugins command', () => {
    it('should list available plugins', () => {
      const { stdout, exitCode } = runCli('plugins');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('cursor');
      expect(stdout).toContain('claude');
    });
  });

  describe('discover command', () => {
    it('should discover cursor rules', async () => {
      // Create cursor rules
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nTest content'
      );

      const { stdout, exitCode } = runCli('discover --from cursor');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('global-prompt');
    });

    it('should output JSON with --json flag', async () => {
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'Test');

      const { stdout, exitCode } = runCli('discover --from claude --json');

      expect(exitCode).toBe(0);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('warnings');
    });

    it('should error on unknown plugin', () => {
      const { stderr, exitCode } = runCli('discover --from unknown');

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown');
    });
  });

  describe('convert command', () => {
    it('should convert cursor to claude', async () => {
      // Create cursor rules
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nConvert test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('CLAUDE.md');

      // Verify file was created
      const claudeContent = await fs.readFile(
        path.join(tempDir, 'CLAUDE.md'),
        'utf-8'
      );
      expect(claudeContent).toContain('Convert test');
    });

    it('should support dry-run mode', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nDry run content'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Discovered');

      // Verify file was NOT created
      await expect(
        fs.access(path.join(tempDir, 'CLAUDE.md'))
      ).rejects.toThrow();
    });

    it('should output JSON with --json flag', async () => {
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'JSON test');

      const { stdout, exitCode } = runCli('convert --from claude --to cursor --json');

      expect(exitCode).toBe(0);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('discovered');
      expect(result).toHaveProperty('written');
      expect(result).toHaveProperty('warnings');
    });

    it('should error on unknown source', () => {
      const { stderr, exitCode } = runCli('convert --from unknown --to claude');

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown source');
    });

    it('should error on unknown target', () => {
      const { stderr, exitCode } = runCli('convert --from cursor --to unknown');

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown target');
    });

    it('should support --verbose flag', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nVerbose test'
      );

      const { stdout, stderr, exitCode } = runCli('convert --from cursor --to claude --verbose');

      expect(exitCode).toBe(0);
      // Verbose output goes to stderr
      expect(stderr).toContain('[verbose]');
      expect(stderr).toContain('Discovering');
    });

    it('should support --verbose with --json (verbose to stderr, JSON to stdout)', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\n\nJSON verbose test'
      );

      const { stdout, stderr, exitCode } = runCli('convert --from cursor --to claude --verbose --json');

      expect(exitCode).toBe(0);
      // Verbose output goes to stderr
      expect(stderr).toContain('[verbose]');
      // JSON goes to stdout, should be valid
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('discovered');
    });
  });

  describe('discover command with verbose', () => {
    it('should support --verbose flag', async () => {
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'Verbose discover test');

      const { stderr, exitCode } = runCli('discover --from claude --verbose');

      expect(exitCode).toBe(0);
      expect(stderr).toContain('[verbose]');
      expect(stderr).toContain('Discovering');
    });
  });

  describe('error handling', () => {
    it('should error with helpful message for non-existent directory', () => {
      const { stderr, exitCode } = runCli('convert --from cursor --to claude /nonexistent/path');

      expect(exitCode).toBe(1);
      expect(stderr).toContain('does not exist');
      expect(stderr).toContain('Make sure');
    });

    it('should error with helpful message for non-existent path in discover', () => {
      const { stderr, exitCode } = runCli('discover --from cursor /nonexistent/path');

      expect(exitCode).toBe(1);
      expect(stderr).toContain('does not exist');
    });
  });

  describe('--gitignore-output-with flag', () => {
    it('should accept the flag with default value "none"', async () => {
      // Create source Cursor rules
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nTest rule.'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude');
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Discovered: 1');
    });

    it('should show planned git changes in dry-run mode with --gitignore-output-with ignore', async () => {
      // Create source Cursor rules
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nTest rule.'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run --gitignore-output-with ignore');
      
      expect(exitCode).toBe(0);
      // In dry-run mode, should show what git changes WOULD be made
      expect(stdout).toContain('Would update');
      expect(stdout).toContain('.gitignore');
    });

    it('should NOT actually write to .gitignore in dry-run mode', async () => {
      // Create source Cursor rules
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nTest rule.'
      );

      runCli('convert --from cursor --to claude --dry-run --gitignore-output-with ignore');
      
      // .gitignore should NOT exist (dry-run)
      await expect(fs.access(path.join(tempDir, '.gitignore'))).rejects.toThrow();
    });

    it('should show per-file details in dry-run match mode', async () => {
      // Initialize git repo
      spawnSync('git', ['init'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
      
      // Create .gitignore that ignores the cursor rules directory
      await fs.writeFile(path.join(tempDir, '.gitignore'), '.cursor/rules/local/\n');
      
      // Create source Cursor rules in ignored directory
      const cursorDir = path.join(tempDir, '.cursor', 'rules', 'local');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'secret.mdc'),
        '---\nalwaysApply: true\n---\nSecret rule that should be gitignored.'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run --gitignore-output-with match');
      
      expect(exitCode).toBe(0);
      // Should show per-file details in match mode
      // Format: "  <filename> → <destination>"
      expect(stdout).toContain('Would update .gitignore');
      expect(stdout).toMatch(/CLAUDE\.md.*→.*\.gitignore/);
    });

    it('should route outputs to .git/info/exclude when source is ignored via exclude', async () => {
      // Initialize git repo
      spawnSync('git', ['init'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
      
      // Create .git/info/exclude that ignores the cursor rules directory
      await fs.mkdir(path.join(tempDir, '.git', 'info'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.git', 'info', 'exclude'), '.cursor/rules/local/\n');
      
      // Create source Cursor rules in ignored directory
      const cursorDir = path.join(tempDir, '.cursor', 'rules', 'local');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'secret.mdc'),
        '---\nalwaysApply: true\n---\nSecret rule that should go to exclude.'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run --gitignore-output-with match');
      
      expect(exitCode).toBe(0);
      // Should show the correct destination (.git/info/exclude) for files ignored via exclude
      // Format: "Would update .git/info/exclude (X entries)"
      expect(stdout).toContain('Would update');
      expect(stdout).toContain('.git/info/exclude');
    });

    it('should actually write to .git/info/exclude in match mode (non-dry-run)', async () => {
      // Initialize git repo
      spawnSync('git', ['init'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
      
      // Create .git/info/exclude that ignores the cursor rules directory
      await fs.mkdir(path.join(tempDir, '.git', 'info'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.git', 'info', 'exclude'), '.cursor/rules/local/\n');
      
      // Create source Cursor rules in ignored directory
      const cursorDir = path.join(tempDir, '.cursor', 'rules', 'local');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'secret.mdc'),
        '---\nalwaysApply: true\n---\nSecret rule that should go to exclude.'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --gitignore-output-with match');
      
      expect(exitCode).toBe(0);
      
      // Check that .git/info/exclude was updated with the output file
      const excludeContent = await fs.readFile(path.join(tempDir, '.git', 'info', 'exclude'), 'utf-8');
      expect(excludeContent).toContain('CLAUDE.md');
      expect(excludeContent).toContain('# BEGIN a16n managed');
    });
  });
});
