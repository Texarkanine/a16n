#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { matchesAny } from './matcher.js';
import { parseStdin, writeOutput, createEmptyOutput, createMatchOutput } from './io.js';

/**
 * Parse command line arguments.
 * Uses raw process.argv for fastest startup (no dependencies).
 */
function parseArgs(): { globs: string | null; contextFile: string | null } {
  const args = process.argv.slice(2);
  let globs: string | null = null;
  let contextFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--globs' && i + 1 < args.length) {
      globs = args[++i] ?? null;
    } else if (arg === '--context-file' && i + 1 < args.length) {
      contextFile = args[++i] ?? null;
    }
  }

  return { globs, contextFile };
}

/**
 * Read entire stdin.
 * Returns empty string if stdin is a TTY or no data.
 */
async function readAllStdin(): Promise<string> {
  // If stdin is a TTY (interactive), no piped data
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });

    process.stdin.on('error', () => {
      resolve('');
    });

    // Resume stdin to start receiving data
    process.stdin.resume();
  });
}

/**
 * Read context file content.
 * Returns null if file cannot be read.
 */
function readContextFile(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Main CLI entry point.
 * Always exits 0 to prevent hook failures in Claude.
 */
async function main(): Promise<void> {
  try {
    // Parse arguments
    const { globs, contextFile } = parseArgs();

    // Validate required arguments
    if (!globs || !contextFile) {
      console.error('glob-hook: Missing required arguments --globs and --context-file');
      writeOutput(createEmptyOutput());
      return;
    }

    // Read stdin
    const stdinData = await readAllStdin();

    // Parse input JSON
    const input = parseStdin(stdinData);
    if (!input) {
      console.error('glob-hook: Invalid or empty JSON input');
      writeOutput(createEmptyOutput());
      return;
    }

    // Extract file path
    const filePath = input.tool_input?.file_path;
    if (!filePath) {
      // No file_path in input - silently output empty (not an error, just not applicable)
      writeOutput(createEmptyOutput());
      return;
    }

    // Parse glob patterns (comma-separated)
    const patterns = globs.split(',').map((p) => p.trim()).filter(Boolean);

    // Check if file matches any pattern
    if (!matchesAny(filePath, patterns)) {
      writeOutput(createEmptyOutput());
      return;
    }

    // Match found - read context file
    const context = readContextFile(contextFile);
    if (!context) {
      console.error(`glob-hook: Cannot read context file: ${contextFile}`);
      writeOutput(createEmptyOutput());
      return;
    }

    // Output context
    writeOutput(createMatchOutput(context));
  } catch (err) {
    // Log error but don't fail the hook
    console.error('glob-hook: Unexpected error:', err instanceof Error ? err.message : err);
    writeOutput(createEmptyOutput());
  }
}

// Run
main();
