import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { runCli, createTempDir, removeTempDir } from '../test-support/cli-runner.js';

describe('CLI --gitignore-output-with flag', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should succeed without --gitignore-output-with flag', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nTest rule.'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude'], tempDir);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Discovered: 1');
  });

  it('should show planned git changes in dry-run mode with --gitignore-output-with ignore', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nTest rule.'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--dry-run', '--gitignore-output-with', 'ignore'], tempDir);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Would update');
    expect(stdout).toContain('.gitignore');
  });

  it('should NOT actually write to .gitignore in dry-run mode', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nTest rule.'
    );

    runCli(['convert', '--from', 'cursor', '--to', 'claude', '--dry-run', '--gitignore-output-with', 'ignore'], tempDir);
    
    await expect(fs.access(path.join(tempDir, '.gitignore'))).rejects.toThrow();
  });

  it('should show per-file details in dry-run match mode', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
    
    await fs.writeFile(path.join(tempDir, '.gitignore'), '.cursor/rules/local/\n');
    
    const cursorDir = path.join(tempDir, '.cursor', 'rules', 'local');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'secret.mdc'),
      '---\nalwaysApply: true\n---\nSecret rule that should be gitignored.'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--dry-run', '--gitignore-output-with', 'match'], tempDir);

    expect(exitCode).toBe(0);
    const normalizedStdout = stdout.replaceAll('\\', '/');
    expect(normalizedStdout).toContain('Would update .gitignore');
    expect(normalizedStdout).toMatch(/\.claude\/rules\/local\/secret\.md.*→.*\.gitignore/);
  });

  it('should route outputs to .git/info/exclude when source is ignored via exclude', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
    
    await fs.mkdir(path.join(tempDir, '.git', 'info'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.git', 'info', 'exclude'), '.cursor/rules/local/\n');
    
    const cursorDir = path.join(tempDir, '.cursor', 'rules', 'local');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'secret.mdc'),
      '---\nalwaysApply: true\n---\nSecret rule that should go to exclude.'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--dry-run', '--gitignore-output-with', 'match'], tempDir);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Would update');
    expect(stdout).toContain('.git/info/exclude');
  });

  it('should actually write to .git/info/exclude in match mode (non-dry-run)', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
    
    await fs.mkdir(path.join(tempDir, '.git', 'info'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.git', 'info', 'exclude'), '.cursor/rules/local/\n');
    
    const cursorDir = path.join(tempDir, '.cursor', 'rules', 'local');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'secret.mdc'),
      '---\nalwaysApply: true\n---\nSecret rule that should go to exclude.'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match'], tempDir);
    
    expect(exitCode).toBe(0);
    
    const excludeContent = await fs.readFile(path.join(tempDir, '.git', 'info', 'exclude'), 'utf-8');
    expect(excludeContent).toContain('.claude/rules/local/secret.md');
    expect(excludeContent).toContain('# BEGIN a16n managed');
  });
});

describe('CLI sourceItems conflict detection', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should emit GitStatusConflict warning when existing tracked output has ignored sources (Case 1)', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });

    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'tracked-source.mdc'),
      '---\nalwaysApply: true\n---\nA rule from a source that will become ignored.'
    );

    runCli(['convert', '--from', 'cursor', '--to', 'claude'], tempDir);

    spawnSync('git', ['add', '.claude/'], { cwd: tempDir });
    spawnSync('git', ['commit', '-m', 'add claude output', '--no-gpg-sign'], { cwd: tempDir });

    await fs.writeFile(path.join(tempDir, '.gitignore'), '.cursor/rules/\n');

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--json'], tempDir);

    expect(exitCode).toBe(0);
    const result = JSON.parse(stdout);
    const conflictWarnings = result.warnings.filter(
      (w: { code: string }) => w.code === 'git-status-conflict'
    );
    expect(conflictWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('should proceed normally when new output has unanimous ignored sources (Case 2)', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });

    await fs.writeFile(path.join(tempDir, '.gitignore'), '.cursor/rules/\n');

    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'ignored-source.mdc'),
      '---\nalwaysApply: true\n---\nA rule from an ignored source.'
    );

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match'], tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('.gitignore');

    const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(gitignoreContent).toContain('.claude/rules/ignored-source.md');
  });

  it('should proceed normally when new output has unanimous tracked sources (Case 2)', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });

    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'tracked-source.mdc'),
      '---\nalwaysApply: true\n---\nA rule from a tracked source.'
    );

    spawnSync('git', ['add', '.cursor/'], { cwd: tempDir });
    spawnSync('git', ['commit', '-m', 'add cursor rules', '--no-gpg-sign'], { cwd: tempDir });

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match'], tempDir);

    expect(exitCode).toBe(0);
    expect(stdout).not.toContain('.gitignore');
    expect(stdout).not.toContain('.git/info/exclude');

    try {
      const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
      expect(gitignoreContent).not.toContain('.claude/');
    } catch {
      // .gitignore doesn't exist — that's fine, means nothing was gitignored
    }
  });

  it('should independently mirror git status for each output when sources have different statuses', async () => {
    // When two independent outputs exist side-by-side, one whose source is git-ignored
    // and one whose source is tracked, match mode must treat each output independently —
    // gitignoring the ignored-source output and leaving the tracked-source output uncommitted.
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });

    await fs.writeFile(path.join(tempDir, '.gitignore'), '.cursor/rules/private/\n');

    const privateDir = path.join(tempDir, '.cursor', 'rules', 'private');
    const publicDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(privateDir, { recursive: true });
    await fs.writeFile(
      path.join(privateDir, 'secret.mdc'),
      '---\nalwaysApply: true\n---\nSecret rule.'
    );
    await fs.writeFile(
      path.join(publicDir, 'public.mdc'),
      '---\nalwaysApply: true\n---\nPublic rule.'
    );

    spawnSync('git', ['add', '.cursor/rules/public.mdc', '.gitignore'], { cwd: tempDir });
    spawnSync('git', ['commit', '-m', 'initial', '--no-gpg-sign'], { cwd: tempDir });

    const { stdout, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--json'], tempDir);

    expect(exitCode).toBe(0);
    const result = JSON.parse(stdout);

    const gitIgnoreChanges = result.gitIgnoreChanges || [];
    const gitignored = gitIgnoreChanges.flatMap((c: { added: string[] }) => c.added);

    expect(gitignored.some((f: string) => f.includes('secret'))).toBe(true);
    expect(gitignored.some((f: string) => f.includes('public'))).toBe(false);
  });
});

describe('CLI --gitignore-output-with match mode validation', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  it('should error when using match mode on non-git repository', async () => {
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nTest rule.'
    );

    const { stderr, exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match'], tempDir);
    
    expect(exitCode).toBe(1);
    expect(stderr).toContain('not a git repository');
  });

  it('should succeed with match mode on valid git repository', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
    
    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nTest rule.'
    );

    const { exitCode } = runCli(['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match'], tempDir);
    
    expect(exitCode).toBe(0);
  });
});

describe('CLI --if-gitignore-conflict flag', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(tempDir);
  });

  async function setupConflictScenario(): Promise<void> {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });

    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'conflict.mdc'),
      '---\nalwaysApply: true\n---\nConflict test rule.'
    );

    runCli(['convert', '--from', 'cursor', '--to', 'claude'], tempDir);

    spawnSync('git', ['add', '.claude/'], { cwd: tempDir });
    spawnSync('git', ['commit', '-m', 'track output', '--no-gpg-sign'], { cwd: tempDir });

    await fs.writeFile(path.join(tempDir, '.gitignore'), '.cursor/rules/\n');
  }

  it('should accept "skip" value (default behavior)', async () => {
    await setupConflictScenario();

    const { stdout, exitCode } = runCli(
      ['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--if-gitignore-conflict', 'skip', '--json'],
      tempDir
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(stdout);
    const conflictWarnings = result.warnings.filter(
      (w: { code: string }) => w.code === 'git-status-conflict'
    );
    expect(conflictWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('should accept "ignore" value and add to .gitignore on conflict', async () => {
    await setupConflictScenario();

    const { exitCode } = runCli(
      ['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--if-gitignore-conflict', 'ignore'],
      tempDir
    );

    expect(exitCode).toBe(0);

    const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(gitignoreContent).toContain('.claude/rules/conflict.md');
  });

  it('should accept "exclude" value and add to .git/info/exclude on conflict', async () => {
    await setupConflictScenario();

    const { exitCode } = runCli(
      ['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--if-gitignore-conflict', 'exclude'],
      tempDir
    );

    expect(exitCode).toBe(0);

    const excludeContent = await fs.readFile(
      path.join(tempDir, '.git', 'info', 'exclude'), 'utf-8'
    );
    expect(excludeContent).toContain('.claude/rules/conflict.md');
  });

  it('should accept "hook" value and add to pre-commit hook on conflict', async () => {
    await setupConflictScenario();

    const { exitCode } = runCli(
      ['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--if-gitignore-conflict', 'hook'],
      tempDir
    );

    expect(exitCode).toBe(0);

    const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
    const hookContent = await fs.readFile(hookPath, 'utf-8');
    expect(hookContent).toContain('.claude/rules/conflict.md');
  });

  it('should accept "commit" value and remove from a16n-managed sections on conflict', async () => {
    await setupConflictScenario();

    const gitignorePath = path.join(tempDir, '.gitignore');
    const existingContent = await fs.readFile(gitignorePath, 'utf-8');
    await fs.writeFile(
      gitignorePath,
      existingContent + '\n# BEGIN a16n managed\n.claude/rules/conflict.md\n# END a16n managed\n'
    );

    const { exitCode } = runCli(
      ['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'match', '--if-gitignore-conflict', 'commit'],
      tempDir
    );

    expect(exitCode).toBe(0);

    const updatedContent = await fs.readFile(gitignorePath, 'utf-8');
    expect(updatedContent).not.toMatch(
      /# BEGIN a16n managed[\s\S]*conflict\.md[\s\S]*# END a16n managed/
    );

    const checkIgnore = spawnSync(
      'git', ['check-ignore', '-q', '.claude/rules/conflict.md'],
      { cwd: tempDir }
    );
    expect(checkIgnore.status).not.toBe(0);
  });

  it('should only apply to match mode (ignored in other modes)', async () => {
    spawnSync('git', ['init'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    spawnSync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });

    const cursorDir = path.join(tempDir, '.cursor', 'rules');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      path.join(cursorDir, 'test.mdc'),
      '---\nalwaysApply: true\n---\nTest rule.'
    );

    const { exitCode } = runCli(
      ['convert', '--from', 'cursor', '--to', 'claude', '--gitignore-output-with', 'ignore', '--if-gitignore-conflict', 'commit'],
      tempDir
    );

    expect(exitCode).toBe(0);

    const gitignoreContent = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(gitignoreContent).toContain('.claude/');
  });
});
