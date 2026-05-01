import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runCli, createTempDir, removeTempDir } from '../test-support/cli-runner.js';

describe('CLI discover command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should discover cursor rules', async () => {
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/test.mdc'),
      '---\nalwaysApply: true\n---\n\nTest content'
    );

    const { stdout, exitCode } = runCli('discover --from cursor', tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('global-prompt');
  });

  it('should output JSON with --json flag', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'Test');

    const { stdout, exitCode } = runCli('discover --from claude --json', tempDir);

    expect(exitCode).toBe(0);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('warnings');
  });

  it('should error on unknown plugin', () => {
    const { stderr, exitCode } = runCli('discover --from unknown', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown');
  });

  it('should support --verbose flag', async () => {
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), 'Verbose discover test');

    const { stderr, exitCode } = runCli('discover --from claude --verbose', tempDir);

    expect(exitCode).toBe(0);
    expect(stderr).toContain('[verbose]');
    expect(stderr).toContain('Discovering');
  });

  it('should error with helpful message for non-existent path in discover', () => {
    const { stderr, exitCode } = runCli('discover --from cursor /nonexistent/path', tempDir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('is not a valid directory');
  });
});
