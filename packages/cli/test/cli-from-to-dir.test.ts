import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runCli, createTempDir, removeTempDir } from './test-support/cli-runner.js';

describe('CLI --from-dir and --to-dir flags', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('--from-dir reads from specified source directory', async () => {
    const sourceDir = path.join(tempDir, 'source');
    const outputDir = path.join(tempDir, 'output');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nFromDir test'
    );

    const { stdout, exitCode } = runCli(`convert --from cursor --to claude --from-dir ${sourceDir}`, outputDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Discovered: 1');
  });

  it('--to-dir writes output to specified target directory', async () => {
    const targetDir = path.join(tempDir, 'target');
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nToDir test'
    );

    const { stdout, exitCode } = runCli(`convert --from cursor --to claude --to-dir ${targetDir}`, tempDir);

    expect(exitCode).toBe(0);
    const claudeRulesDir = path.join(targetDir, '.claude', 'rules');
    const files = await fs.readdir(claudeRulesDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('combines --from-dir and --to-dir so output lands only in target', async () => {
    const sourceDir = path.join(tempDir, 'source');
    const targetDir = path.join(tempDir, 'target');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nBoth flags test'
    );

    const { stdout, exitCode } = runCli(`convert --from cursor --to claude --from-dir ${sourceDir} --to-dir ${targetDir}`, tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Discovered: 1');
    const claudeRulesDir = path.join(targetDir, '.claude', 'rules');
    const files = await fs.readdir(claudeRulesDir);
    expect(files.length).toBeGreaterThan(0);
    await expect(fs.access(path.join(tempDir, '.claude', 'rules'))).rejects.toThrow();
  });

  it('--from-dir with nonexistent directory produces error', () => {
    const { stderr, exitCode } = runCli('convert --from cursor --to claude --from-dir /nonexistent/source', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('is not a valid directory');
  });

  it('--to-dir with nonexistent directory produces error', () => {
    const { stderr, exitCode } = runCli('convert --from cursor --to claude --to-dir /nonexistent/target', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('is not a valid directory');
  });

  it('passes discover with --from-dir', async () => {
    const sourceDir = path.join(tempDir, 'source');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nDiscover fromDir test'
    );

    const { stdout, exitCode } = runCli(`discover --from cursor --from-dir ${sourceDir}`, tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('global-prompt');
  });

  it('rejects --to-dir on discover command', () => {
    const { stderr, exitCode } = runCli(`discover --from cursor --to-dir ${tempDir}`, tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('--to-dir');
  });

  it('--delete-source deletes under source root when using --from-dir and --to-dir', async () => {
    const sourceDir = path.join(tempDir, 'source');
    const targetDir = path.join(tempDir, 'target');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
    const sourcePath = path.join(sourceDir, '.cursor/rules/test.mdc');
    await fs.writeFile(
      sourcePath,
      '---\nalwaysApply: true\n---\n\nDelete source test'
    );

    const { exitCode } = runCli(`convert --from cursor --to claude --from-dir ${sourceDir} --to-dir ${targetDir} --delete-source`, tempDir);

    expect(exitCode).toBe(0);
    await expect(fs.access(sourcePath)).rejects.toThrow();
    const claudeRulesDir = path.join(targetDir, '.claude', 'rules');
    const files = await fs.readdir(claudeRulesDir);
    expect(files.length).toBeGreaterThan(0);
  });
});
