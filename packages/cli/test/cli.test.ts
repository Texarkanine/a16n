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
      // Normalize paths for OS-agnostic assertions
      const normalizedStdout = stdout.replaceAll('\\', '/');
      expect(normalizedStdout).toContain('.claude/rules/test.md');

      // Verify file was created in .claude/rules/
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      const files = await fs.readdir(claudeRulesDir);
      expect(files.length).toBeGreaterThan(0);
      
      const claudeContent = await fs.readFile(
        path.join(claudeRulesDir, 'test.md'),
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
        fs.access(path.join(tempDir, '.claude', 'rules'))
      ).rejects.toThrow();
    });

    it('should output JSON with --json flag', async () => {
      await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.claude/rules/test.md'), 'JSON test');

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
      // Normalize paths for OS-agnostic assertions
      const normalizedStdout = stdout.replaceAll('\\', '/');
      expect(normalizedStdout).toContain('Would update .gitignore');
      expect(normalizedStdout).toMatch(/\.claude\/rules\/secret\.md.*→.*\.gitignore/);
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
      expect(excludeContent).toContain('.claude/rules/secret.md');
      expect(excludeContent).toContain('# BEGIN a16n managed');
    });
  });

  describe('sourceItems conflict detection (CR-10)', () => {
    it('should emit GitStatusConflict warning when existing tracked output has ignored sources (Case 1)', async () => {
      // Case 1: Output file already exists and is tracked
      // Some sources are ignored → emit warning but respect output's tracked status
      // TODO: Implement test
    });

    it('should proceed normally when new output has unanimous ignored sources (Case 2)', async () => {
      // Case 2: Output file is new, all sources ignored
      // Should add output to gitignore normally
      // TODO: Implement test
    });

    it('should proceed normally when new output has unanimous tracked sources (Case 2)', async () => {
      // Case 2: Output file is new, all sources tracked
      // Should NOT add output to gitignore
      // TODO: Implement test
    });

    it('should skip gitignore management and emit warning when new output has conflicting sources (Case 3)', async () => {
      // Case 3: Output file is new, sources have conflicting git status
      // Some ignored, some tracked → skip gitignore management, emit warning
      // TODO: Implement test
    });
  });

  describe('--gitignore-output-with match mode validation (CR11-11)', () => {
    it('should error when using match mode on non-git repository', async () => {
      // Create source Cursor rules (no git init)
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nTest rule.'
      );

      const { stderr, exitCode } = runCli('convert --from cursor --to claude --gitignore-output-with match');
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('not a git repository');
    });

    it('should succeed with match mode on valid git repository', async () => {
      // Initialize git repo
      spawnSync('git', ['init'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
      spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
      
      // Create source Cursor rules
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nTest rule.'
      );

      const { exitCode } = runCli('convert --from cursor --to claude --gitignore-output-with match');
      
      expect(exitCode).toBe(0);
    });
  });

  describe('--if-gitignore-conflict flag', () => {
    it('should accept "skip" value (default behavior)', async () => {
      // TODO: Implement test
      // Create conflict scenario (mixed sources)
      // Run with --if-gitignore-conflict skip
      // Verify warning is emitted and gitignore is skipped
    });

    it('should accept "ignore" value and add to .gitignore on conflict', async () => {
      // TODO: Implement test
      // Create conflict scenario (mixed sources)
      // Run with --if-gitignore-conflict ignore
      // Verify file is added to .gitignore
    });

    it('should accept "exclude" value and add to .git/info/exclude on conflict', async () => {
      // TODO: Implement test
      // Create conflict scenario (mixed sources)
      // Run with --if-gitignore-conflict exclude
      // Verify file is added to .git/info/exclude
    });

    it('should accept "hook" value and add to pre-commit hook on conflict', async () => {
      // TODO: Implement test
      // Create conflict scenario (mixed sources)
      // Run with --if-gitignore-conflict hook
      // Verify file is added to pre-commit hook
    });

    it('should accept "commit" value and remove from a16n-managed sections on conflict', async () => {
      // TODO: Implement test
      // Create conflict scenario (mixed sources)
      // Pre-populate .gitignore with a16n managed section
      // Run with --if-gitignore-conflict commit
      // Verify file is removed from a16n managed sections
    });

    it('should only apply to match mode (ignored in other modes)', async () => {
      // TODO: Implement test
      // Run with --gitignore-output-with ignore and --if-gitignore-conflict commit
      // Verify flag is ignored (no removal, normal add to .gitignore)
    });
  });

  describe('Phase 6: Dry-run output wording', () => {
    it('should show "Would write:" in dry-run mode', async () => {
      // AC1: Dry-run shows "Would write:" prefix
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\nDry run test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Would write:');
      expect(stdout).not.toContain('Wrote:');
    });

    it('should show "Wrote:" in normal mode', async () => {
      // AC2: Normal mode shows current "Wrote:" verb
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\nNormal mode test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Wrote:');
      expect(stdout).not.toContain('Would write:');
    });
  });

  describe('Phase 6: --delete-source flag', () => {
    it('should delete source files with --delete-source', async () => {
      // AC3: Delete used sources after conversion
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      const sourcePath = path.join(cursorDir, 'test.mdc');
      await fs.writeFile(
        sourcePath,
        '---\nalwaysApply: true\n---\nTest content\n'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --delete-source');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Wrote:');
      expect(stdout).toContain('Deleted:');
      
      // Verify source file was deleted
      await expect(fs.access(sourcePath)).rejects.toThrow();
      
      // Verify output file exists in .claude/rules/
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      const files = await fs.readdir(claudeRulesDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should preserve sources that are not converted when using --delete-source', async () => {
      // AC4: Sources that don't produce output should not be deleted
      // Create a skill without description (silently ignored - no output produced)
      const skillDir = path.join(tempDir, '.claude', 'skills', 'test-skill');
      await fs.mkdir(skillDir, { recursive: true });
      const skillPath = path.join(skillDir, 'SKILL.md');
      await fs.writeFile(
        skillPath,
        `---
name: test-skill
---
Skill content without description - will be ignored`
      );

      const { stdout, exitCode } = runCli('convert --from claude --to cursor --delete-source');

      expect(exitCode).toBe(0);
      // Source should be preserved because it was not converted (no description = silently ignored)
      await expect(fs.access(skillPath)).resolves.not.toThrow();
      expect(stdout).not.toContain('Deleted:');
    });

    it('should preserve sources with partial skips', async () => {
      // AC5: Preserve sources with partial skips
      // Create a mix: one normal file that converts, and one skill without description that gets ignored
      await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
      const normalRule = path.join(tempDir, '.claude/rules/test.md');
      await fs.writeFile(normalRule, '# Test rule');
      
      const skillDir = path.join(tempDir, '.claude', 'skills', 'no-desc-skill');
      await fs.mkdir(skillDir, { recursive: true });
      const skillPath = path.join(skillDir, 'SKILL.md');
      await fs.writeFile(
        skillPath,
        `---
name: no-desc-skill
---
This skill has no description - should be ignored`
      );
      
      const { stdout, exitCode } = runCli('convert --from claude --to cursor --delete-source');

      expect(exitCode).toBe(0);
      // Skill without description should be preserved (not converted, so not deleted)
      await expect(fs.access(skillPath)).resolves.not.toThrow();
      // Normal rule should be deleted (successfully converted)
      await expect(fs.access(normalRule)).rejects.toThrow();
      expect(stdout).toContain('Deleted');
    });

    it('should delete multiple sources that merge into single output', async () => {
      // AC6: Delete multiple sources when they merge
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      
      const source1 = path.join(cursorDir, 'rule1.mdc');
      const source2 = path.join(cursorDir, 'rule2.mdc');
      
      await fs.writeFile(source1, '---\nalwaysApply: true\n---\nRule 1');
      await fs.writeFile(source2, '---\nalwaysApply: true\n---\nRule 2');

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --delete-source');

      expect(exitCode).toBe(0);
      
      // Both sources should be deleted
      await expect(fs.access(source1)).rejects.toThrow();
      await expect(fs.access(source2)).rejects.toThrow();
      
      // Two separate output files should exist (no longer merged)
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      const files = await fs.readdir(claudeRulesDir);
      expect(files.length).toBe(2);
      
      // Should report 2 deletions
      expect(stdout).toContain('Deleted:');
    });

    it('should show "Would delete:" in dry-run with --delete-source', async () => {
      // AC7: Dry-run shows planned deletions
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      const sourcePath = path.join(cursorDir, 'test.mdc');
      await fs.writeFile(
        sourcePath,
        '---\nalwaysApply: true\n---\nDry run delete test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run --delete-source');

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Would delete:');
      expect(stdout).not.toContain('Deleted:');
      
      // Source should still exist (dry-run)
      await expect(fs.access(sourcePath)).resolves.not.toThrow();
    });

    it('should not delete sources without --delete-source flag', async () => {
      // AC8: Sources preserved when flag not used
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      const sourcePath = path.join(cursorDir, 'test.mdc');
      await fs.writeFile(
        sourcePath,
        '---\nalwaysApply: true\n---\nNo delete test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude');

      expect(exitCode).toBe(0);
      expect(stdout).not.toContain('Deleted:');
      expect(stdout).not.toContain('Would delete:');
      
      // Source should still exist
      await expect(fs.access(sourcePath)).resolves.not.toThrow();
    });

    it('should include deletedSources in JSON output', async () => {
      // AC9: JSON output includes deletedSources array
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      const sourcePath = path.join(cursorDir, 'test.mdc');
      await fs.writeFile(
        sourcePath,
        '---\nalwaysApply: true\n---\nJSON delete test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --delete-source --json');

      expect(exitCode).toBe(0);
      
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('deletedSources');
      expect(Array.isArray(result.deletedSources)).toBe(true);
      expect(result.deletedSources.length).toBeGreaterThan(0);
    });

    it('should use relative paths in deletedSources output and JSON (CR-12)', async () => {
      // CodeRabbit feedback: deletedSources should use relative paths for readability
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nRelative path test'
      );

      // Test human-readable output
      const { stdout: humanOutput, exitCode: humanExitCode } = runCli('convert --from cursor --to claude --delete-source');
      // Normalize paths for OS-agnostic assertions (CR-12 test feedback)
      const normalizedHumanOutput = humanOutput.replaceAll('\\', '/');
      const normalizedTempDir = tempDir.replaceAll('\\', '/');
      expect(humanExitCode).toBe(0);
      // Deleted line should show relative path like ".cursor/rules/test.mdc"
      expect(normalizedHumanOutput).toMatch(/Deleted:.*\.cursor\/rules\/test\.mdc/);
      // Deleted line should NOT contain absolute path
      const deletedLines = normalizedHumanOutput.split('\n').filter((l: string) => l.includes('Deleted:'));
      for (const line of deletedLines) {
        expect(line).not.toContain(normalizedTempDir);
      }

      // Test JSON output - recreate source for fresh test
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nRelative path test'
      );
      const { stdout: jsonOutput, exitCode: jsonExitCode } = runCli('convert --from cursor --to claude --delete-source --json');
      expect(jsonExitCode).toBe(0);
      
      const result = JSON.parse(jsonOutput);
      expect(result.deletedSources).toBeDefined();
      // JSON deletedSources should use relative paths (normalize for OS-agnostic check)
      for (const deletedPath of result.deletedSources) {
        const normalized = deletedPath.replaceAll('\\', '/');
        expect(deletedPath).not.toMatch(/^[A-Za-z]:/); // No Windows absolute path
        expect(deletedPath).not.toMatch(/^\//); // No Unix absolute path
        expect(normalized).toContain('.cursor/rules/');
      }
    });

    it('should use relative paths in dry-run delete verbose output (CR-12)', async () => {
      // CodeRabbit feedback: verbose "Would delete" messages should use relative paths
      const cursorDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorDir, 'test.mdc'),
        '---\nalwaysApply: true\n---\nDry run relative path test'
      );

      const { stderr, exitCode } = runCli('convert --from cursor --to claude --dry-run --delete-source --verbose');

      // Normalize paths for OS-agnostic assertions (CR-12 test feedback)
      const normalizedStderr = stderr.replaceAll('\\', '/');
      const normalizedTempDir = tempDir.replaceAll('\\', '/');

      expect(exitCode).toBe(0);
      // "Would delete source" line should use relative path
      expect(normalizedStderr).toMatch(/Would delete source:.*\.cursor\/rules\/test\.mdc/);
      // That specific line should NOT contain absolute path
      const deleteLines = normalizedStderr.split('\n').filter((l: string) => l.includes('Would delete source:'));
      for (const line of deleteLines) {
        expect(line).not.toContain(normalizedTempDir);
      }
    });
  });
});
