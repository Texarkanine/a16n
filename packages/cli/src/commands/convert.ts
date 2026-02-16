/**
 * Convert command handler.
 * Extracted from index.ts for testability via CommandIO abstraction.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine, ConversionResult } from '@a16njs/engine';
import { WarningCode } from '@a16njs/models';
import { formatWarning, formatError, formatSummary } from '../output.js';
import {
  isGitRepo,
  isGitIgnored,
  isGitTracked,
  addToGitIgnore,
  addToGitExclude,
  updatePreCommitHook,
  getIgnoreSource,
  removeFromGitIgnore,
  removeFromGitExclude,
  removeFromPreCommitHook,
  type GitIgnoreResult,
} from '../git-ignore.js';
import type { CommandIO } from './io.js';

/**
 * Options for the convert command, matching Commander option names.
 */
export interface ConvertCommandOptions {
  from: string;
  to: string;
  fromDir?: string;
  toDir?: string;
  dryRun?: boolean;
  json?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  rewritePathRefs?: boolean;
  deleteSource?: boolean;
  gitignoreOutputWith?: string;
  ifGitignoreConflict?: string;
}

/**
 * Converts a path to POSIX format (forward slashes) for gitignore compatibility.
 */
function toGitIgnorePath(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Handle the convert command action.
 *
 * @param engine - A16n engine instance
 * @param projectPath - Positional project path argument
 * @param options - Parsed command options
 * @param io - I/O abstraction for output
 */
export async function handleConvert(
  engine: A16nEngine,
  projectPath: string,
  options: ConvertCommandOptions,
  io: CommandIO,
): Promise<void> {
  try {
    const verbose = (msg: string) => {
      if (options.verbose) io.error(`[verbose] ${msg}`);
    };

    // Resolve split roots:
    // --from-dir overrides source, --to-dir overrides target, positional fills gaps
    const resolvedPath = path.resolve(projectPath);
    const resolvedSourceRoot = options.fromDir ? path.resolve(options.fromDir) : resolvedPath;
    const resolvedTargetRoot = options.toDir ? path.resolve(options.toDir) : resolvedPath;

    // Validate source root exists and is a directory
    let sourceIsNotDir = false;
    try {
      const stat = await fs.stat(resolvedSourceRoot);
      if (!stat.isDirectory()) sourceIsNotDir = true;
    } catch {
      sourceIsNotDir = true;
    }
    if (sourceIsNotDir) {
      const label = options.fromDir ? `--from-dir '${options.fromDir}'` : `'${projectPath}'`;
      io.error(formatError(
        `${label} is not a valid directory`,
        'Make sure the path is correct and the directory exists.',
      ));
      io.setExitCode(1);
      return;
    }

    // Validate target root exists and is a directory
    let targetIsNotDir = false;
    try {
      const stat = await fs.stat(resolvedTargetRoot);
      if (!stat.isDirectory()) targetIsNotDir = true;
    } catch {
      targetIsNotDir = true;
    }
    if (targetIsNotDir) {
      const label = options.toDir ? `--to-dir '${options.toDir}'` : `'${projectPath}'`;
      io.error(formatError(
        `${label} is not a valid directory`,
        'Make sure the path is correct and the directory exists.',
      ));
      io.setExitCode(1);
      return;
    }

    verbose(`Discovering from ${options.from}...`);
    verbose(`Source root: ${resolvedSourceRoot}`);
    verbose(`Target root: ${resolvedTargetRoot}`);

    const result: ConversionResult = await engine.convert({
      source: options.from,
      target: options.to,
      root: resolvedPath,
      sourceRoot: options.fromDir ? resolvedSourceRoot : undefined,
      targetRoot: options.toDir ? resolvedTargetRoot : undefined,
      dryRun: options.dryRun,
      rewritePathRefs: options.rewritePathRefs,
    });

    verbose(`Discovered ${result.discovered.length} items:`);
    if (options.verbose) {
      for (const item of result.discovered) {
        verbose(`  - ${item.type}: ${item.sourcePath}`);
      }
    }
    verbose(`Writing ${result.written.length} files...`);

    // === Git Ignore Management ===
    const gitignoreStyle = options.gitignoreOutputWith || 'none';
    result.gitIgnoreChanges = [];

    if (gitignoreStyle !== 'none' && result.written.length > 0) {
      await handleGitIgnore(result, gitignoreStyle, resolvedPath, options, verbose, io);
    }

    // Handle --delete-source flag
    if (options.deleteSource) {
      await handleDeleteSource(result, resolvedSourceRoot, options, verbose, io);
    }

    if (options.json) {
      io.log(JSON.stringify(result, null, 2));
    } else if (!options.quiet) {
      io.log(`Discovered: ${result.discovered.length} items`);

      if (result.written.length > 0) {
        for (const file of result.written) {
          const writePrefix = options.dryRun ? 'Would write' : 'Wrote';
          const relativePath = path.relative(resolvedPath, file.path);
          io.log(`${writePrefix}: ${relativePath}`);
        }
      }

      if (result.gitIgnoreChanges && result.gitIgnoreChanges.length > 0) {
        for (const change of result.gitIgnoreChanges) {
          const prefix = options.dryRun ? 'Would update' : 'Git: Updated';
          io.log(`${prefix} ${change.file} (${change.added.length} entries)`);

          if (options.dryRun && gitignoreStyle === 'match' && change.added.length > 0) {
            for (const f of change.added) {
              io.log(`  ${f} \u2192 ${change.file}`);
            }
          }
        }
      }

      if (result.deletedSources && result.deletedSources.length > 0) {
        const deletePrefix = options.dryRun ? 'Would delete' : 'Deleted';
        for (const source of result.deletedSources) {
          io.log(`${deletePrefix}: ${source}`);
        }
      }

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          io.log(formatWarning(warning));
        }
      }

      if (result.unsupported.length > 0) {
        io.log(`Unsupported: ${result.unsupported.length} items`);
      }

      io.log(formatSummary(result.discovered.length, result.written.length, result.warnings.length));
    }
  } catch (error) {
    io.error(formatError((error as Error).message));
    io.setExitCode(1);
  }
}

/**
 * Handle git-ignore management for conversion output.
 */
async function handleGitIgnore(
  result: ConversionResult,
  gitignoreStyle: string,
  resolvedPath: string,
  options: ConvertCommandOptions,
  verbose: (msg: string) => void,
  io: CommandIO,
): Promise<void> {
  verbose(`Planning git-ignore style: ${gitignoreStyle}${options.dryRun ? ' (dry-run)' : ''}`);

  const newFiles = result.written
    .filter(w => w.isNewFile)
    .map(w => toGitIgnorePath(path.relative(resolvedPath, w.path)));

  if (newFiles.length === 0) {
    verbose('No new files to manage (all outputs are edits to existing files)');
    return;
  }

  verbose(`${options.dryRun ? 'Would manage' : 'Managing'} ${newFiles.length} new file(s)`);

  try {
    if (gitignoreStyle === 'ignore') {
      const plannedResult: GitIgnoreResult = { file: '.gitignore', added: newFiles };
      if (!options.dryRun) {
        await addToGitIgnore(resolvedPath, newFiles);
      }
      result.gitIgnoreChanges!.push(plannedResult);
    } else if (gitignoreStyle === 'exclude') {
      if (!(await isGitRepo(resolvedPath))) {
        throw new Error("Cannot use --gitignore-output-with 'exclude': not a git repository");
      }
      const plannedResult: GitIgnoreResult = { file: '.git/info/exclude', added: newFiles };
      if (!options.dryRun) {
        await addToGitExclude(resolvedPath, newFiles);
      }
      result.gitIgnoreChanges!.push(plannedResult);
    } else if (gitignoreStyle === 'hook') {
      if (!(await isGitRepo(resolvedPath))) {
        throw new Error("Cannot use --gitignore-output-with 'hook': not a git repository");
      }
      const plannedResult: GitIgnoreResult = { file: '.git/hooks/pre-commit', added: newFiles };
      if (!options.dryRun) {
        await updatePreCommitHook(resolvedPath, newFiles);
      }
      result.gitIgnoreChanges!.push(plannedResult);
    } else if (gitignoreStyle === 'match') {
      await handleGitIgnoreMatch(result, resolvedPath, options, verbose);
    }
  } catch (error) {
    io.error(formatError((error as Error).message));
    io.setExitCode(1);
  }
}

/**
 * Handle git-ignore "match" mode — mirror source git status to output.
 */
async function handleGitIgnoreMatch(
  result: ConversionResult,
  resolvedPath: string,
  options: ConvertCommandOptions,
  verbose: (msg: string) => void,
): Promise<void> {
  if (!(await isGitRepo(resolvedPath))) {
    throw new Error("Cannot use --gitignore-output-with 'match': not a git repository");
  }
  verbose('Checking git status for source files...');

  const conflictResolution = options.ifGitignoreConflict || 'skip';

  const filesToGitignore: string[] = [];
  const filesToExclude: string[] = [];
  const filesToHook: string[] = [];
  const filesToCommit: string[] = [];

  for (const written of result.written) {
    const relativePath = toGitIgnorePath(path.relative(resolvedPath, written.path));

    if (!written.sourceItems) {
      result.warnings.push({
        code: WarningCode.Approximated,
        message: `Skipping gitignore management for '${relativePath}': plugin does not provide source tracking`,
      });
      continue;
    }

    const sources = written.sourceItems;
    if (sources.length === 0) continue;

    const sourceStatuses = await Promise.all(
      sources.map(async (source) => ({
        source,
        ignoreSource: source.sourcePath
          ? await getIgnoreSource(resolvedPath, source.sourcePath)
          : null,
      })),
    );

    const ignoredSources = sourceStatuses.filter(s => s.ignoreSource !== null);
    const trackedSources = sourceStatuses.filter(s => s.ignoreSource === null);

    if (!written.isNewFile) {
      const outputTracked = await isGitTracked(resolvedPath, relativePath);
      const outputIgnored = !outputTracked && await isGitIgnored(resolvedPath, relativePath);
      const hasDestinationConflict =
        (outputTracked && ignoredSources.length > 0) ||
        (outputIgnored && trackedSources.length > 0);

      if (hasDestinationConflict) {
        routeConflict(conflictResolution, relativePath, result, sources, ignoredSources, trackedSources, outputTracked ?? false, filesToGitignore, filesToExclude, filesToHook, filesToCommit, verbose);
      }
      continue;
    }

    if (ignoredSources.length === sources.length) {
      const ignoreDestinations = new Set(ignoredSources.map(s => s.ignoreSource));
      if (ignoreDestinations.size > 1) {
        routeConflictSimple(conflictResolution, relativePath, result, sources, filesToGitignore, filesToExclude, filesToHook, filesToCommit, verbose, 'sources ignored by different files');
      } else {
        const ignoreDestination = ignoredSources[0]?.ignoreSource;
        if (ignoreDestination === '.git/info/exclude') {
          filesToExclude.push(relativePath);
        } else {
          filesToGitignore.push(relativePath);
        }
      }
    } else if (trackedSources.length === sources.length) {
      verbose(`  ${relativePath} not ignored (all sources tracked)`);
    } else if (ignoredSources.length > 0 && trackedSources.length > 0) {
      routeConflictSimple(conflictResolution, relativePath, result, sources, filesToGitignore, filesToExclude, filesToHook, filesToCommit, verbose, 'sources have mixed status');
    }
  }

  // Apply accumulated changes
  if (filesToGitignore.length > 0) {
    const plannedResult: GitIgnoreResult = { file: '.gitignore', added: filesToGitignore };
    if (!options.dryRun) {
      await addToGitIgnore(resolvedPath, filesToGitignore);
    }
    result.gitIgnoreChanges!.push(plannedResult);
  }

  if (filesToExclude.length > 0) {
    const plannedResult: GitIgnoreResult = { file: '.git/info/exclude', added: filesToExclude };
    if (!options.dryRun) {
      await addToGitExclude(resolvedPath, filesToExclude);
    }
    result.gitIgnoreChanges!.push(plannedResult);
  }

  if (filesToHook.length > 0) {
    const plannedResult: GitIgnoreResult = { file: '.git/hooks/pre-commit', added: filesToHook };
    if (!options.dryRun) {
      await updatePreCommitHook(resolvedPath, filesToHook);
    }
    result.gitIgnoreChanges!.push(plannedResult);
  }

  if (filesToCommit.length > 0) {
    if (!options.dryRun) {
      await removeFromGitIgnore(resolvedPath, filesToCommit);
      if (await isGitRepo(resolvedPath)) {
        await removeFromGitExclude(resolvedPath, filesToCommit);
        await removeFromPreCommitHook(resolvedPath, filesToCommit);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function routeConflict(
  conflictResolution: string,
  relativePath: string,
  result: ConversionResult,
  sources: any[],
  ignoredSources: any[],
  trackedSources: any[],
  outputTracked: boolean,
  filesToGitignore: string[],
  filesToExclude: string[],
  filesToHook: string[],
  filesToCommit: string[],
  verbose: (msg: string) => void,
): void {
  if (conflictResolution === 'skip') {
    const msg = outputTracked
      ? `Git status conflict: output '${relativePath}' is tracked, but ${ignoredSources.length} source(s) are ignored`
      : `Git status conflict: output '${relativePath}' is ignored, but ${trackedSources.length} source(s) are tracked`;
    result.warnings.push({
      code: WarningCode.GitStatusConflict,
      message: msg,
      sources: (outputTracked ? ignoredSources : trackedSources).map((s: any) => s.source.sourcePath).filter((p: any): p is string => p !== undefined),
    });
  } else {
    applyConflictResolution(conflictResolution, relativePath, filesToGitignore, filesToExclude, filesToHook, filesToCommit);
    verbose(`  Resolved conflict for ${relativePath} with ${conflictResolution}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function routeConflictSimple(
  conflictResolution: string,
  relativePath: string,
  result: ConversionResult,
  sources: any[],
  filesToGitignore: string[],
  filesToExclude: string[],
  filesToHook: string[],
  filesToCommit: string[],
  verbose: (msg: string) => void,
  reason: string,
): void {
  if (conflictResolution === 'skip') {
    result.warnings.push({
      code: WarningCode.GitStatusConflict,
      message: `Git status conflict: cannot determine status for '${relativePath}' (${reason})`,
      sources: sources.map((s: any) => s.sourcePath).filter((p: any): p is string => p !== undefined),
    });
  } else {
    applyConflictResolution(conflictResolution, relativePath, filesToGitignore, filesToExclude, filesToHook, filesToCommit);
    verbose(`  Resolved conflict for ${relativePath} with ${conflictResolution}`);
  }
}

function applyConflictResolution(
  resolution: string,
  relativePath: string,
  filesToGitignore: string[],
  filesToExclude: string[],
  filesToHook: string[],
  filesToCommit: string[],
): void {
  switch (resolution) {
    case 'ignore':
      filesToGitignore.push(relativePath);
      break;
    case 'exclude':
      filesToExclude.push(relativePath);
      break;
    case 'hook':
      filesToHook.push(relativePath);
      break;
    case 'commit':
      filesToCommit.push(relativePath);
      break;
  }
}

/**
 * Handle --delete-source flag: delete source files after conversion.
 */
async function handleDeleteSource(
  result: ConversionResult,
  resolvedSourceRoot: string,
  options: ConvertCommandOptions,
  verbose: (msg: string) => void,
  io: CommandIO,
): Promise<void> {
  const deletedSources: string[] = [];

  const usedSources = new Set<string>();
  for (const written of result.written) {
    if (written.sourceItems) {
      for (const item of written.sourceItems) {
        if (item.sourcePath) {
          usedSources.add(path.resolve(resolvedSourceRoot, item.sourcePath));
        }
      }
    }
  }

  const skippedSources = new Set<string>();
  for (const warning of result.warnings) {
    if (warning.code === WarningCode.Skipped && warning.sources) {
      for (const source of warning.sources) {
        skippedSources.add(path.resolve(resolvedSourceRoot, source));
      }
    }
  }

  const sourcesToDelete = Array.from(usedSources).filter(
    source => !skippedSources.has(source),
  );

  for (const absolutePath of sourcesToDelete) {
    const relativePath = path.relative(resolvedSourceRoot, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      io.error(formatError(`Warning: Refusing to delete source outside project: ${relativePath}`));
      continue;
    }
    if (options.dryRun) {
      verbose(`Would delete source: ${relativePath}`);
    } else {
      try {
        await fs.unlink(absolutePath);
        verbose(`Deleted source: ${relativePath}`);
        deletedSources.push(relativePath);
      } catch (error) {
        io.error(formatError(`Warning: Failed to delete ${relativePath}: ${(error as Error).message}`));
      }
    }
  }

  if (deletedSources.length > 0 || (options.dryRun && sourcesToDelete.length > 0)) {
    result.deletedSources = options.dryRun
      ? sourcesToDelete.map(s => path.relative(resolvedSourceRoot, s))
      : deletedSources;
  }
}
