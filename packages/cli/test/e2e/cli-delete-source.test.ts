import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runCli, createTempDir, removeTempDir } from '../test-support/cli-runner.js';

describe('CLI --delete-source flag', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should delete source files with --delete-source', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    const sourcePath = path.join(cursorDir, 'test.mdc');
    await fs.writeFile(
      sourcePath,
      '---\nalwaysApply: true\n---\nTest content\n'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--delete-source'], tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Wrote:');
    expect(stdout).toContain('Deleted:');
    
    await expect(fs.access(sourcePath)).rejects.toThrow();
    
    const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
    const files = await fs.readdir(claudeRulesDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should preserve sources that are not converted when using --delete-source', async () => {
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

    const { stdout, exitCode } = runCli(['convert', '--from', 'claude', '--to', 'cursor', '--delete-source'], tempDir);

    expect(exitCode).toBe(0);
    await expect(fs.access(skillPath)).resolves.not.toThrow();
    expect(stdout).not.toContain('Deleted:');
  });

  it('should preserve sources with partial skips', async () => {
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
    
    const { stdout, exitCode } = runCli(['convert', '--from', 'claude', '--to', 'cursor', '--delete-source'], tempDir);

    expect(exitCode).toBe(0);
    await expect(fs.access(skillPath)).resolves.not.toThrow();
    await expect(fs.access(normalRule)).rejects.toThrow();
    expect(stdout).toContain('Deleted');
  });

  it('should delete all sources when each produces a separate output file', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    
    const source1 = path.join(cursorDir, 'rule1.mdc');
    const source2 = path.join(cursorDir, 'rule2.mdc');
    
    await fs.writeFile(source1, '---\nalwaysApply: true\n---\nRule 1');
    await fs.writeFile(source2, '---\nalwaysApply: true\n---\nRule 2');

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--delete-source'], tempDir);

    expect(exitCode).toBe(0);
    
    await expect(fs.access(source1)).rejects.toThrow();
    await expect(fs.access(source2)).rejects.toThrow();
    
    const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
    const files = await fs.readdir(claudeRulesDir);
    expect(files.length).toBe(2);
    
    expect(stdout).toContain('Deleted:');
  });

  it('should show "Would delete:" in dry-run with --delete-source', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    const sourcePath = path.join(cursorDir, 'test.mdc');
    await fs.writeFile(
      sourcePath,
      '---\nalwaysApply: true\n---\nDry run delete test'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--dry-run', '--delete-source'], tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Would delete:');
    expect(stdout).not.toContain('Deleted:');
    
    await expect(fs.access(sourcePath)).resolves.not.toThrow();
  });

  it('should not delete sources without --delete-source flag', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    const sourcePath = path.join(cursorDir, 'test.mdc');
    await fs.writeFile(
      sourcePath,
      '---\nalwaysApply: true\n---\nNo delete test'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude'], tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).not.toContain('Deleted:');
    expect(stdout).not.toContain('Would delete:');
    
    await expect(fs.access(sourcePath)).resolves.not.toThrow();
  });

  it('should include deletedSources in JSON output', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    const sourcePath = path.join(cursorDir, 'test.mdc');
    await fs.writeFile(
      sourcePath,
      '---\nalwaysApply: true\n---\nJSON delete test'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--delete-source', '--json'], tempDir);

    expect(exitCode).toBe(0);
    
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('deletedSources');
    expect(Array.isArray(result.deletedSources)).toBe(true);
    expect(result.deletedSources.length).toBeGreaterThan(0);
  });

  it('should use relative paths in deletedSources output and JSON', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nRelative path test'
    );

    const { stdout: humanOutput, exitCode: humanExitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--delete-source'], tempDir);
    const normalizedHumanOutput = humanOutput.replaceAll('\\', '/');
    const normalizedTempDir = tempDir.replaceAll('\\', '/');
    expect(humanExitCode).toBe(0);
    expect(normalizedHumanOutput).toMatch(/Deleted:.*\.cursor\/rules\/test\.mdc/);
    const deletedLines = normalizedHumanOutput.split('\n').filter((l: string) => l.includes('Deleted:'));
    for (const line of deletedLines) {
      expect(line).not.toContain(normalizedTempDir);
    }

    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nRelative path test'
    );
    const { stdout: jsonOutput, exitCode: jsonExitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--delete-source', '--json'], tempDir);
    expect(jsonExitCode).toBe(0);
    
    const result = JSON.parse(jsonOutput);
    expect(result.deletedSources).toBeDefined();
    for (const deletedPath of result.deletedSources) {
      const normalized = deletedPath.replaceAll('\\', '/');
      expect(deletedPath).not.toMatch(/^[A-Za-z]:/);
      expect(deletedPath).not.toMatch(/^\//);
      expect(normalized).toContain('.cursor/rules/');
    }
  });

  it('should use relative paths in dry-run delete verbose output', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nDry run relative path test'
    );

    const { stderr, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--dry-run', '--delete-source', '--verbose'], tempDir);

    const normalizedStderr = stderr.replaceAll('\\', '/');
    const normalizedTempDir = tempDir.replaceAll('\\', '/');

    expect(exitCode).toBe(0);
    expect(normalizedStderr).toMatch(/Would delete source:.*\.cursor\/rules\/test\.mdc/);
    const deleteLines = normalizedStderr.split('\n').filter((l: string) => l.includes('Would delete source:'));
    for (const line of deleteLines) {
      expect(line).not.toContain(normalizedTempDir);
    }
  });
});
