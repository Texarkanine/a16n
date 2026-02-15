import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { formatWarning, formatError } from '../output.js';
import type { CommandIO } from './io.js';

/**
 * Options parsed from the discover CLI command.
 */
export interface DiscoverCommandOptions {
  from: string;
  json?: boolean;
  verbose?: boolean;
  fromDir?: string;
  toDir?: string;
}

/**
 * Execute the discover command.
 *
 * Discovers customizations using the specified plugin and outputs the results.
 * Uses CommandIO for testability.
 *
 * @param engine - The a16n engine instance
 * @param projectPath - The positional project path argument
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
    let discoverIsNotDir = false;
    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) discoverIsNotDir = true;
    } catch {
      discoverIsNotDir = true;
    }
    if (discoverIsNotDir) {
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

    verbose(`Found ${result.items.length} items`);

    if (options.json) {
      io.log(JSON.stringify(result, null, 2));
    } else {
      io.log(`Found ${result.items.length} items`);
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
