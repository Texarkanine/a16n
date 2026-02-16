/**
 * Discover command handler.
 * Extracted from index.ts for testability via CommandIO abstraction.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { formatWarning, formatError } from '../output.js';
import type { CommandIO } from './io.js';

/**
 * Options for the discover command, matching Commander option names.
 */
export interface DiscoverCommandOptions {
  from: string;
  fromDir?: string;
  toDir?: string;
  json?: boolean;
  verbose?: boolean;
}

/**
 * Handle the discover command action.
 *
 * @param engine - A16n engine instance
 * @param projectPath - Positional project path argument
 * @param options - Parsed command options
 * @param io - I/O abstraction for output
 */
export async function handleDiscover(
  engine: A16nEngine,
  projectPath: string,
  options: DiscoverCommandOptions,
  io: CommandIO,
): Promise<void> {
  try {
    const verbose = (msg: string) => {
      if (options.verbose) io.error(`[verbose] ${msg}`);
    };

    // --to-dir is not applicable to discover (no output)
    if (options.toDir) {
      io.error(formatError(
        '--to-dir is not applicable to the discover command',
        'Use --to-dir with the convert command instead.',
      ));
      io.setExitCode(1);
      return;
    }

    // Resolve the effective root: --from-dir overrides positional path
    const resolvedPath = options.fromDir
      ? path.resolve(options.fromDir)
      : path.resolve(projectPath);

    // Validate directory exists and is a directory
    let isNotDir = false;
    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) isNotDir = true;
    } catch {
      isNotDir = true;
    }
    if (isNotDir) {
      const label = options.fromDir ? `--from-dir '${options.fromDir}'` : `'${projectPath}'`;
      io.error(formatError(
        `${label} is not a valid directory`,
        'Make sure the path is correct and the directory exists.',
      ));
      io.setExitCode(1);
      return;
    }

    verbose(`Discovering from ${options.from}...`);
    verbose(`Root: ${resolvedPath}`);

    const result = await engine.discover(options.from, resolvedPath);

    const count = result.items.length;
    verbose(`Found ${count} ${count === 1 ? 'item' : 'items'}`);

    if (options.json) {
      io.log(JSON.stringify(result, null, 2));
    } else {
      io.log(`Found ${count} ${count === 1 ? 'item' : 'items'}`);
      for (const item of result.items) {
        io.log(`  - ${item.type}: ${item.sourcePath}`);
      }

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          io.log(formatWarning(warning));
        }
      }
    }
  } catch (error) {
    io.error(formatError((error as Error).message));
    io.setExitCode(1);
  }
}
