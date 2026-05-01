import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { cliPath, runCli, createTempDir, removeTempDir } from '../test-support/cli-runner.js';

describe('CLI --help', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should show help', () => {
    const { stdout, exitCode } = runCli('--help', tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('a16n');
    expect(stdout).toContain('convert');
    expect(stdout).toContain('discover');
    expect(stdout).toContain('plugins');
  });

  it('should show help when invoked through a symlink', async () => {
    const symlinkPath = path.join(tempDir, 'a16n-symlink.js');
    await fs.symlink(path.resolve(cliPath), symlinkPath);

    const result = spawnSync('node', [symlinkPath, '--help'], {
      cwd: tempDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('a16n');
    expect(result.stdout).toContain('convert');
    expect(result.stdout).toContain('discover');
  });
});
