import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runCli, createTempDir, removeTempDir } from '../test-support/cli-runner.js';

describe('CLI plugins command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should list available plugins', () => {
    const { stdout, exitCode } = runCli('plugins', tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('cursor');
    expect(stdout).toContain('claude');
  });

  it('should discover and list third-party plugins from node_modules', async () => {
    const pluginDir = path.join(tempDir, 'node_modules', 'a16n-plugin-test-disco');
    await fs.mkdir(pluginDir, { recursive: true });
    await fs.writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify({ name: 'a16n-plugin-test-disco', type: 'module', main: 'index.js' }),
    );
    await fs.writeFile(
      path.join(pluginDir, 'index.js'),
      `export default {
          id: 'test-disco',
          name: 'Test Disco Plugin',
          supports: ['global-prompt'],
          discover: async () => ({ items: [], warnings: [] }),
          emit: async () => ({ written: [], warnings: [], unsupported: [] }),
        };`,
    );

    const { stdout, exitCode } = runCli('plugins', tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('test-disco');
    expect(stdout).toContain('Test Disco Plugin');
    expect(stdout).toContain('cursor');
    expect(stdout).toContain('claude');
  });
});
