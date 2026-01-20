import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '.temp-cli-test');
const cliPath = path.join(__dirname, '..', 'dist', 'index.js');

// Helper to run CLI
function runCli(args: string, cwd: string = tempDir): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${cliPath} ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; status?: number };
    return {
      stdout: execError.stdout || '',
      exitCode: execError.status ?? 1,
    };
  }
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
      const { stdout, exitCode } = runCli('discover --from unknown');

      expect(exitCode).toBe(1);
      expect(stdout).toContain('Unknown');
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
      const { stdout, exitCode } = runCli('convert --from unknown --to claude');

      expect(exitCode).toBe(1);
      expect(stdout).toContain('Unknown source');
    });

    it('should error on unknown target', () => {
      const { stdout, exitCode } = runCli('convert --from cursor --to unknown');

      expect(exitCode).toBe(1);
      expect(stdout).toContain('Unknown target');
    });
  });
});
