import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const CLI_PATH = join(__dirname, '../src/index.ts');
const FIXTURES_PATH = join(__dirname, 'fixtures');

/**
 * Run the CLI with given arguments and stdin input.
 */
function runCli(
  args: string[],
  stdin: object | string | null
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', CLI_PATH, ...args], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code ?? 0 });
    });

    // Write stdin and close
    if (stdin !== null) {
      const input = typeof stdin === 'string' ? stdin : JSON.stringify(stdin);
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

describe('CLI Integration', () => {
  describe('AC1: Basic Glob Matching', () => {
    it('outputs additionalContext when pattern matches', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.tsx',
          '--context-file', join(FIXTURES_PATH, 'react-rules.txt'),
        ],
        { tool_input: { file_path: 'src/Button.tsx' } }
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput?.additionalContext).toContain('React component guidelines');
    });
  });

  describe('AC2: No Match', () => {
    it('outputs empty object when pattern does not match', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.tsx',
          '--context-file', join(FIXTURES_PATH, 'react-rules.txt'),
        ],
        { tool_input: { file_path: 'src/utils.py' } }
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
    });
  });

  describe('AC3: Multiple Patterns', () => {
    it('matches when any pattern matches (comma-separated)', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.ts,**/*.tsx',
          '--context-file', join(FIXTURES_PATH, 'typescript-rules.txt'),
        ],
        { tool_input: { file_path: 'src/index.ts' } }
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput?.additionalContext).toContain('TypeScript guidelines');
    });
  });

  describe('AC4: Multiline Context', () => {
    it('preserves multiline content in output', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.ts',
          '--context-file', join(FIXTURES_PATH, 'typescript-rules.txt'),
        ],
        { tool_input: { file_path: 'src/test.ts' } }
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      const context = output.hookSpecificOutput?.additionalContext;
      expect(context).toContain('TypeScript guidelines:');
      expect(context).toContain('- Use strict mode');
      expect(context).toContain('- Prefer interfaces');
    });
  });

  describe('AC5: Missing file_path', () => {
    it('outputs empty object when tool_input has no file_path', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.ts',
          '--context-file', join(FIXTURES_PATH, 'typescript-rules.txt'),
        ],
        { tool_name: 'Bash', tool_input: { command: 'ls' } }
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
    });
  });

  describe('AC6: Invalid JSON Input', () => {
    it('outputs empty object and logs error for invalid JSON', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.ts',
          '--context-file', join(FIXTURES_PATH, 'typescript-rules.txt'),
        ],
        'not valid json at all'
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
      expect(result.stderr).toContain('Invalid');
    });
  });

  describe('AC7: Missing Required Args', () => {
    it('outputs empty object when --globs is missing', async () => {
      const result = await runCli(
        ['--context-file', join(FIXTURES_PATH, 'typescript-rules.txt')],
        { tool_input: { file_path: 'src/test.ts' } }
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
      expect(result.stderr).toContain('Missing required');
    });

    it('outputs empty object when --context-file is missing', async () => {
      const result = await runCli(
        ['--globs', '**/*.ts'],
        { tool_input: { file_path: 'src/test.ts' } }
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
      expect(result.stderr).toContain('Missing required');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty patterns gracefully', async () => {
      const result = await runCli(
        [
          '--globs', '',
          '--context-file', join(FIXTURES_PATH, 'react-rules.txt'),
        ],
        { tool_input: { file_path: 'src/Button.tsx' } }
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
    });

    it('handles missing context file gracefully', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.ts',
          '--context-file', join(FIXTURES_PATH, 'nonexistent.txt'),
        ],
        { tool_input: { file_path: 'src/test.ts' } }
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('{}');
      expect(result.stderr).toContain('Cannot read context file');
    });

    it('handles directory patterns correctly', async () => {
      const result = await runCli(
        [
          '--globs', 'src/components/**',
          '--context-file', join(FIXTURES_PATH, 'react-rules.txt'),
        ],
        { tool_input: { file_path: 'src/components/Button.tsx' } }
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput?.additionalContext).toBeDefined();
    });

    it('handles dotfiles correctly', async () => {
      const result = await runCli(
        [
          '--globs', '**/*.js',
          '--context-file', join(FIXTURES_PATH, 'typescript-rules.txt'),
        ],
        { tool_input: { file_path: '.eslintrc.js' } }
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput?.additionalContext).toBeDefined();
    });
  });
});
