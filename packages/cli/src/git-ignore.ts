/**
 * Git ignore management utilities for a16n.
 * Handles .gitignore, .git/info/exclude, and pre-commit hook generation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Information about git-ignore changes made during conversion.
 */
export interface GitIgnoreResult {
  /** The file that was modified (e.g., '.gitignore', '.git/info/exclude', '.git/hooks/pre-commit') */
  file: string;
  /** Entries that were added */
  added: string[];
}

/**
 * Semaphore markers for managed sections.
 */
const SEMAPHORE_BEGIN = '# BEGIN a16n managed';
const SEMAPHORE_END = '# END a16n managed';

/**
 * Execute a git command and return its output.
 */
async function execGit(
  cwd: string,
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn('git', ['--no-pager', ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
  });
}

/**
 * Check if a file is git-ignored.
 * Uses `git check-ignore` to determine if the file would be ignored.
 * 
 * @param root - The root directory of the git repository
 * @param filepath - The file path to check (relative to root)
 * @returns True if the file is git-ignored, false otherwise
 */
export async function isGitIgnored(root: string, filepath: string): Promise<boolean> {
  try {
    const { exitCode } = await execGit(root, ['check-ignore', '-q', filepath]);
    return exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Possible sources where a file can be git-ignored from.
 */
export type IgnoreSource = '.gitignore' | '.git/info/exclude' | null;

/**
 * Get the source file that causes a path to be git-ignored.
 * Uses `git check-ignore --verbose` to determine which gitignore file
 * contains the rule that ignores the path.
 * 
 * @param root - The root directory of the git repository
 * @param filepath - The file path to check (relative to root)
 * @returns The ignore source ('.gitignore', '.git/info/exclude') or null if not ignored
 * 
 * @example
 * // If .git/info/exclude contains 'local/'
 * await getIgnoreSource(root, 'local/foo.txt'); // Returns '.git/info/exclude'
 * 
 * // If .gitignore contains '*.log'
 * await getIgnoreSource(root, 'debug.log'); // Returns '.gitignore'
 * 
 * // If file is not ignored
 * await getIgnoreSource(root, 'src/index.ts'); // Returns null
 */
export async function getIgnoreSource(root: string, filepath: string): Promise<IgnoreSource> {
  try {
    const { stdout, exitCode } = await execGit(root, ['check-ignore', '--verbose', filepath]);
    
    // Exit code 0 means the file is ignored, stdout contains the source info
    // Format: <source>:<linenum>:<pattern><TAB><pathname>
    if (exitCode !== 0 || !stdout.trim()) {
      return null;
    }
    
    // Parse the verbose output to extract the source file
    // Example: ".git/info/exclude:1:local/\tlocal/foo.txt"
    const colonIndex = stdout.indexOf(':');
    if (colonIndex === -1) {
      return null;
    }
    
    const source = stdout.substring(0, colonIndex);
    
    // Normalize source paths to our standard format
    if (source === '.gitignore') {
      return '.gitignore';
    } else if (source === '.git/info/exclude') {
      return '.git/info/exclude';
    }
    
    // Handle relative paths that might not start with './'
    // e.g., 'git/info/exclude' without the leading '.'
    if (source.endsWith('.gitignore') || source === '.gitignore') {
      return '.gitignore';
    } else if (source.includes('.git/info/exclude') || source.includes('info/exclude')) {
      return '.git/info/exclude';
    }
    
    // Unknown source (could be a nested .gitignore in subdirectory)
    // For now, treat as .gitignore for simplicity
    return '.gitignore';
  } catch {
    return null;
  }
}

/**
 * Check if a file is tracked by git.
 * Uses `git ls-files` to determine if the file is in the index.
 * 
 * @param root - The root directory of the git repository
 * @param filepath - The file path to check (relative to root)
 * @returns True if the file is tracked, false otherwise
 */
export async function isGitTracked(root: string, filepath: string): Promise<boolean> {
  try {
    const { stdout } = await execGit(root, ['ls-files', filepath]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if a directory is a git repository.
 * Looks for .git directory.
 * 
 * @param root - The directory to check
 * @returns True if the directory is a git repository, false otherwise
 */
export async function isGitRepo(root: string): Promise<boolean> {
  try {
    const gitDir = path.join(root, '.git');
    const stat = await fs.stat(gitDir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Add entries to .gitignore using semaphore pattern.
 * Creates .gitignore if it doesn't exist.
 * Preserves existing content outside semaphore section.
 * Replaces content within semaphore section if it exists.
 * 
 * @param root - The root directory of the project
 * @param entries - File paths to add to .gitignore
 * @returns Information about the changes made
 */
export async function addToGitIgnore(
  root: string,
  entries: string[]
): Promise<GitIgnoreResult> {
  const filepath = path.join(root, '.gitignore');
  let content = '';
  
  try {
    content = await fs.readFile(filepath, 'utf-8');
  } catch {
    // File doesn't exist, will be created
  }

  const newContent = updateSemaphoreSection(content, entries);
  await fs.writeFile(filepath, newContent, 'utf-8');

  return {
    file: '.gitignore',
    added: entries,
  };
}

/**
 * Add entries to .git/info/exclude using semaphore pattern.
 * Creates .git/info/exclude if it doesn't exist.
 * Preserves existing content outside semaphore section.
 * Replaces content within semaphore section if it exists.
 * 
 * @param root - The root directory of the git repository
 * @param entries - File paths to add to .git/info/exclude
 * @returns Information about the changes made
 */
export async function addToGitExclude(
  root: string,
  entries: string[]
): Promise<GitIgnoreResult> {
  // Verify it's a git repository
  if (!(await isGitRepo(root))) {
    throw new Error('Not a git repository');
  }

  const filepath = path.join(root, '.git', 'info', 'exclude');
  let content = '';
  
  try {
    content = await fs.readFile(filepath, 'utf-8');
  } catch {
    // File doesn't exist, create directory and file
    await fs.mkdir(path.dirname(filepath), { recursive: true });
  }

  const newContent = updateSemaphoreSection(content, entries);
  await fs.writeFile(filepath, newContent, 'utf-8');

  return {
    file: '.git/info/exclude',
    added: entries,
  };
}

/**
 * Create or update pre-commit hook to unstage entries.
 * Creates .git/hooks/pre-commit if it doesn't exist.
 * Makes the hook executable.
 * Preserves existing content outside semaphore section.
 * Replaces content within semaphore section if it exists.
 * 
 * @param root - The root directory of the git repository
 * @param entries - File paths to unstage in the pre-commit hook
 * @returns Information about the changes made
 */
export async function updatePreCommitHook(
  root: string,
  entries: string[]
): Promise<GitIgnoreResult> {
  // Verify it's a git repository
  if (!(await isGitRepo(root))) {
    throw new Error('Not a git repository');
  }

  const filepath = path.join(root, '.git', 'hooks', 'pre-commit');
  let content = '';
  let needsShebang = false;
  
  try {
    content = await fs.readFile(filepath, 'utf-8');
  } catch {
    // File doesn't exist, create directory and add shebang
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    needsShebang = true;
  }

  // Ensure shebang exists
  if (needsShebang || !content.startsWith('#!')) {
    content = '#!/bin/bash\n\n' + content;
  }

  // Generate hook command (just the command, not the whole section)
  const quotedEntries = entries.map(e => `"${e}"`).join(' ');
  const command = `git reset HEAD -- ${quotedEntries} 2>/dev/null || true`;

  const newContent = updateSemaphoreSection(content, [command]);
  await fs.writeFile(filepath, newContent, 'utf-8');

  // Make executable
  await fs.chmod(filepath, 0o755);

  return {
    file: '.git/hooks/pre-commit',
    added: entries,
  };
}

/**
 * Update content with semaphore-wrapped section.
 * Preserves content outside semaphores, replaces content within.
 * 
 * @param content - Existing file content
 * @param entries - Entries to include (for gitignore) or lines (for hooks)
 * @returns Updated content with semaphore section
 */
function updateSemaphoreSection(
  content: string,
  entries: string[]
): string {
  const lines = content.split('\n');
  
  // Find existing semaphore section
  const beginIndex = lines.findIndex(l => l.trim() === SEMAPHORE_BEGIN);
  const endIndex = lines.findIndex(l => l.trim() === SEMAPHORE_END);

  let result: string[];
  
  if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
    // Replace existing semaphore section
    result = [
      ...lines.slice(0, beginIndex),
      SEMAPHORE_BEGIN,
      ...entries,
      SEMAPHORE_END,
      ...lines.slice(endIndex + 1),
    ];
  } else {
    // Append new semaphore section
    const hasTrailingNewline = content.endsWith('\n') || content === '';
    result = [
      ...lines.filter(l => l.length > 0 || lines.length === 1),
      ...(content && !hasTrailingNewline ? [''] : []),
      SEMAPHORE_BEGIN,
      ...entries,
      SEMAPHORE_END,
      '', // Trailing newline
    ];
  }

  return result.join('\n');
}
