import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runCli, createTempDir, removeTempDir } from './test-support/cli-runner.js';

describe('CLI convert command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should convert cursor to claude', async () => {
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nConvert test'
    );

    const { stdout, exitCode } = runCli('convert --from cursor --to claude', tempDir);

    expect(exitCode).toBe(0);
    const normalizedStdout = stdout.replaceAll('\\', '/');
    expect(normalizedStdout).toContain('.claude/rules/test.md');

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

    const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run', tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Discovered');

    await expect(
      fs.access(path.join(tempDir, '.claude', 'rules'))
    ).rejects.toThrow();
  });

  it('should output JSON with --json flag', async () => {
    await fs.mkdir(path.join(tempDir, '.claude', 'rules'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.claude/rules/test.md'), 'JSON test');

    const { stdout, exitCode } = runCli('convert --from claude --to cursor --json', tempDir);

    expect(exitCode).toBe(0);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('discovered');
    expect(result).toHaveProperty('written');
    expect(result).toHaveProperty('warnings');
  });

  it('should error on unknown source', () => {
    const { stderr, exitCode } = runCli('convert --from unknown --to claude', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown source');
    expect(stderr).toContain('Available tools:');
  });

  it('should error on unknown target', () => {
    const { stderr, exitCode } = runCli('convert --from cursor --to unknown', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown target');
    expect(stderr).toContain('Available tools:');
  });

  it('should support --verbose flag', async () => {
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nVerbose test'
    );

    const { stdout, stderr, exitCode } = runCli('convert --from cursor --to claude --verbose', tempDir);

    expect(exitCode).toBe(0);
    expect(stderr).toContain('[verbose]');
    expect(stderr).toContain('Discovering');
  });

  it('should support --verbose with --json (verbose to stderr, JSON to stdout)', async () => {
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nJSON verbose test'
    );

    const { stdout, stderr, exitCode } = runCli('convert --from cursor --to claude --verbose --json', tempDir);

    expect(exitCode).toBe(0);
    expect(stderr).toContain('[verbose]');
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('discovered');
  });

  it('should error with helpful message for non-existent directory', () => {
    const { stderr, exitCode } = runCli('convert --from cursor --to claude /nonexistent/path', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('is not a valid directory');
    expect(stderr).toContain('Make sure');
  });

  it('should rewrite path references in converted files', async () => {
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/a.mdc'),
      '---\nalwaysApply: true\n---\n\nSee .cursor/rules/b.mdc for details'
    );
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/b.mdc'),
      '---\nalwaysApply: true\n---\n\nRule B'
    );

    const { stdout, exitCode } = runCli('convert --from cursor --to claude --rewrite-path-refs', tempDir);

    expect(exitCode).toBe(0);
    const aContent = await fs.readFile(
      path.join(tempDir, '.claude/rules/a.md'),
      'utf-8'
    );
    expect(aContent).toContain('.claude/rules/b.md');
    expect(aContent).not.toContain('.cursor/rules/b.mdc');
  });

  describe('dry-run output wording', () => {
    it('should show "Would write:" in dry-run mode', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\nDry run test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude --dry-run', tempDir);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Would write:');
      expect(stdout).not.toContain('Wrote:');
    });

    it('should show "Wrote:" in normal mode', async () => {
      await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.cursor/rules/test.mdc'),
        '---\nalwaysApply: true\n---\nNormal mode test'
      );

      const { stdout, exitCode } = runCli('convert --from cursor --to claude', tempDir);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Wrote:');
      expect(stdout).not.toContain('Would write:');
    });
  });
});
