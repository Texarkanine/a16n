import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const cliPath = path.join(__dirname, '..', '..', 'dist', 'index.js');

// These E2E tests spawn the CLI as a subprocess via spawnSync, so they
// do NOT contribute to v8 coverage (vitest-dev/vitest#7064). Behavioral
// coverage of the code paths exercised here is handled by unit tests in
// commands/convert.test.ts and commands/discover.test.ts.
export function runCli(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
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

export async function createTempDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'cli-test-'));
}

export async function removeTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}
