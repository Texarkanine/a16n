import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { WarningCode } from '@a16njs/models';
import { formatWarning, formatError, formatSummary } from '../output.js';
import {
  isGitRepo,
  addToGitIgnore,
  addToGitExclude,
  updatePreCommitHook,
  getIgnoreSource,
  isGitIgnored,
  isGitTracked,
  removeFromGitIgnore,
  removeFromGitExclude,
  removeFromPreCommitHook,
  type GitIgnoreResult,
} from '../git-ignore.js';
import type { CommandIO } from './io.js';

/**
 * Converts a path to POSIX format (forward slashes) for gitignore compatibility.
 */
function toGitIgnorePath(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Options parsed from the convert CLI command.
 */
export interface ConvertCommandOptions {
  from: string;
  to: string;
  dryRun?: boolean;
  json?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  fromDir?: string;
  toDir?: string;
  rewritePathRefs?: boolean;
  gitignoreOutputWith?: string;
  ifGitignoreConflict?: string;
  deleteSource?: boolean;
}

/**
 * Execute the convert command.
 *
 * Orchestrates discovery, conversion, git-ignore management, source deletion,
 * and output formatting. Uses CommandIO for testability.
 *
 * @param engine - The a16n engine instance
 * @param projectPath - The positional project path argument
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

    // Validate --if-gitignore-conflict flag
    const validConflictResolutions = ['skip', 'ignore', 'exclude', 'hook', 'commit'];
    const conflictResolution = options.ifGitignoreConflict as string;
    if (conflictResolution && !validConflictResolutions.includes(conflictResolution)) {
      io.error(formatError(
        `Invalid --if-gitignore-conflict value: '${conflictResolution}'`,
        `Must be one of: ${validConflictResolutions.join(', ')}`,
      ));
      io.setExitCode(1);
      return;
    }

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

    const result = await engine.convert({
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
    const gitignoreStyle = options.gitignoreOutputWith as string;
    result.gitIgnoreChanges = [];

    // Calculate planned git changes (for both dry-run and normal mode)
    if (gitignoreStyle && gitignoreStyle !== 'none' && result.written.length > 0) {
      verbose(`Planning git-ignore style: ${gitignoreStyle}${options.dryRun ? ' (dry-run)' : ''}`);

      // Filter for new files only and convert absolute paths to relative paths (POSIX format)
      // Git-ignore operations use the target root (where output files live)
      const newFiles = result.written
        .filter(w => w.isNewFile)
        .map(w => toGitIgnorePath(path.relative(resolvedTargetRoot, w.path)));

      if (newFiles.length === 0) {
        verbose('No new files to manage (all outputs are edits to existing files)');
      } else {
        verbose(`${options.dryRun ? 'Would manage' : 'Managing'} ${newFiles.length} new file(s)`);

        try {
          if (gitignoreStyle === 'ignore') {
            const plannedResult: GitIgnoreResult = { file: '.gitignore', added: newFiles };
            if (options.dryRun) {
              verbose('Would add to .gitignore with semaphore pattern');
            } else {
              verbose('Adding to .gitignore with semaphore pattern');
              await addToGitIgnore(resolvedTargetRoot, newFiles);
              verbose(`✓ Updated ${plannedResult.file}`);
            }
            result.gitIgnoreChanges!.push(plannedResult);
          } else if (gitignoreStyle === 'exclude') {
            if (!(await isGitRepo(resolvedTargetRoot))) {
              throw new Error("Cannot use --gitignore-output-with 'exclude': not a git repository");
            }
            const plannedResult: GitIgnoreResult = { file: '.git/info/exclude', added: newFiles };
            if (options.dryRun) {
              verbose('Would add to .git/info/exclude with semaphore pattern');
            } else {
              verbose('Adding to .git/info/exclude with semaphore pattern');
              await addToGitExclude(resolvedTargetRoot, newFiles);
              verbose(`✓ Updated ${plannedResult.file}`);
            }
            result.gitIgnoreChanges!.push(plannedResult);
          } else if (gitignoreStyle === 'hook') {
            if (!(await isGitRepo(resolvedTargetRoot))) {
              throw new Error("Cannot use --gitignore-output-with 'hook': not a git repository");
            }
            const plannedResult: GitIgnoreResult = { file: '.git/hooks/pre-commit', added: newFiles };
            if (options.dryRun) {
              verbose('Would create/update pre-commit hook with semaphore pattern');
            } else {
              verbose('Creating/updating pre-commit hook with semaphore pattern');
              await updatePreCommitHook(resolvedTargetRoot, newFiles);
              verbose(`✓ Updated ${plannedResult.file} (executable)`);
            }
            result.gitIgnoreChanges!.push(plannedResult);
          } else if (gitignoreStyle === 'match') {
            if (!(await isGitRepo(resolvedTargetRoot))) {
              throw new Error("Cannot use --gitignore-output-with 'match': not a git repository");
            }
            verbose('Checking git status for source files...');

            const matchConflictResolution = (options.ifGitignoreConflict as string) || 'skip';

            const filesToGitignore: string[] = [];
            const filesToExclude: string[] = [];
            const filesToHook: string[] = [];
            const filesToCommit: string[] = [];

            for (const written of result.written) {
              const relativePath = toGitIgnorePath(path.relative(resolvedTargetRoot, written.path));

              if (!written.sourceItems) {
                result.warnings.push({
                  code: WarningCode.Approximated,
                  message: `Skipping gitignore management for '${relativePath}': plugin does not provide source tracking (update plugin for accurate conflict detection)`,
                });
                verbose(`  ⚠ Skipping ${relativePath} (no sourceItems, can't detect conflicts)`);
                continue;
              }

              const sources = written.sourceItems;
              if (sources.length === 0) continue;

              const sourceStatuses = await Promise.all(
                sources.map(async (source) => ({
                  source,
                  ignoreSource: source.sourcePath
                    ? await getIgnoreSource(resolvedSourceRoot, source.sourcePath)
                    : null,
                })),
              );

              const ignoredSources = sourceStatuses.filter(s => s.ignoreSource !== null);
              const trackedSources = sourceStatuses.filter(s => s.ignoreSource === null);

              // Case 1: Output file already exists
              if (!written.isNewFile) {
                const outputTracked = await isGitTracked(resolvedTargetRoot, relativePath);
                const outputIgnored = !outputTracked && await isGitIgnored(resolvedTargetRoot, relativePath);

                const hasDestinationConflict =
                  (outputTracked && ignoredSources.length > 0) ||
                  (outputIgnored && trackedSources.length > 0);

                if (hasDestinationConflict) {
                  if (matchConflictResolution === 'skip') {
                    if (outputTracked && ignoredSources.length > 0) {
                      result.warnings.push({
                        code: WarningCode.GitStatusConflict,
                        message: `Git status conflict: output '${relativePath}' is tracked, but ${ignoredSources.length} source(s) are ignored`,
                        sources: ignoredSources.map(s => s.source.sourcePath).filter((p): p is string => p !== undefined),
                      });
                      verbose(`  ⚠ Git status conflict for ${relativePath} (output tracked, sources ignored) - skipping`);
                    } else {
                      result.warnings.push({
                        code: WarningCode.GitStatusConflict,
                        message: `Git status conflict: output '${relativePath}' is ignored, but ${trackedSources.length} source(s) are tracked`,
                        sources: trackedSources.map(s => s.source.sourcePath).filter((p): p is string => p !== undefined),
                      });
                      verbose(`  ⚠ Git status conflict for ${relativePath} (output ignored, sources tracked) - skipping`);
                    }
                  } else {
                    verbose(`  ⚠ Git status conflict for ${relativePath} - resolving with --if-gitignore-conflict ${matchConflictResolution}`);
                    switch (matchConflictResolution) {
                      case 'ignore': filesToGitignore.push(relativePath); break;
                      case 'exclude': filesToExclude.push(relativePath); break;
                      case 'hook': filesToHook.push(relativePath); break;
                      case 'commit': filesToCommit.push(relativePath); break;
                    }
                  }
                }
                continue;
              }

              // Case 2: Output is new + sources unanimous
              if (ignoredSources.length === sources.length) {
                const ignoreDestinations = new Set(ignoredSources.map(s => s.ignoreSource));

                if (ignoreDestinations.size > 1) {
                  if (matchConflictResolution === 'skip') {
                    result.warnings.push({
                      code: WarningCode.GitStatusConflict,
                      message: `Git status conflict: sources for '${relativePath}' are ignored by different files (${[...ignoreDestinations].join(', ')})`,
                      sources: sources.map(s => s.sourcePath).filter((p): p is string => p !== undefined),
                    });
                    verbose(`  ⚠ Git status conflict for ${relativePath} (sources ignored by different files) - skipping`);
                  } else {
                    verbose(`  ⚠ Git status conflict for ${relativePath} (sources ignored by different files) - resolving with --if-gitignore-conflict ${matchConflictResolution}`);
                    switch (matchConflictResolution) {
                      case 'ignore': filesToGitignore.push(relativePath); break;
                      case 'exclude': filesToExclude.push(relativePath); break;
                      case 'hook': filesToHook.push(relativePath); break;
                      case 'commit': filesToCommit.push(relativePath); break;
                    }
                  }
                } else {
                  const ignoreDestination = ignoredSources[0]?.ignoreSource;
                  if (ignoreDestination === '.git/info/exclude') {
                    filesToExclude.push(relativePath);
                  } else {
                    filesToGitignore.push(relativePath);
                  }
                  verbose(`  ${relativePath} → ${ignoreDestination} (all sources ignored)`);
                }
              } else if (trackedSources.length === sources.length) {
                verbose(`  ${relativePath} not ignored (all sources tracked)`);
              }
              // Case 3: Output is new + sources conflict
              else if (ignoredSources.length > 0 && trackedSources.length > 0) {
                if (matchConflictResolution === 'skip') {
                  result.warnings.push({
                    code: WarningCode.GitStatusConflict,
                    message: `Git status conflict: cannot determine status for '${relativePath}' (${ignoredSources.length} source(s) ignored, ${trackedSources.length} tracked)`,
                    sources: sources.map(s => s.sourcePath).filter((p): p is string => p !== undefined),
                  });
                  verbose(`  ⚠ Git status conflict for ${relativePath} (sources have mixed status) - skipping`);
                } else {
                  verbose(`  ⚠ Git status conflict for ${relativePath} - resolving with --if-gitignore-conflict ${matchConflictResolution}`);
                  switch (matchConflictResolution) {
                    case 'ignore': filesToGitignore.push(relativePath); break;
                    case 'exclude': filesToExclude.push(relativePath); break;
                    case 'hook': filesToHook.push(relativePath); break;
                    case 'commit': filesToCommit.push(relativePath); break;
                  }
                }
              }
            }

            if (filesToGitignore.length > 0) {
              const plannedResult: GitIgnoreResult = { file: '.gitignore', added: filesToGitignore };
              if (options.dryRun) {
                verbose(`Would add ${filesToGitignore.length} file(s) to .gitignore to match source status`);
              } else {
                verbose(`Adding ${filesToGitignore.length} file(s) to .gitignore to match source status`);
                await addToGitIgnore(resolvedTargetRoot, filesToGitignore);
                verbose(`✓ Updated ${plannedResult.file}`);
              }
              result.gitIgnoreChanges!.push(plannedResult);
            }

            if (filesToExclude.length > 0) {
              const plannedResult: GitIgnoreResult = { file: '.git/info/exclude', added: filesToExclude };
              if (options.dryRun) {
                verbose(`Would add ${filesToExclude.length} file(s) to .git/info/exclude to match source status`);
              } else {
                verbose(`Adding ${filesToExclude.length} file(s) to .git/info/exclude to match source status`);
                await addToGitExclude(resolvedTargetRoot, filesToExclude);
                verbose(`✓ Updated ${plannedResult.file}`);
              }
              result.gitIgnoreChanges!.push(plannedResult);
            }

            if (filesToHook.length > 0) {
              const plannedResult: GitIgnoreResult = { file: '.git/hooks/pre-commit', added: filesToHook };
              if (options.dryRun) {
                verbose(`Would add ${filesToHook.length} file(s) to pre-commit hook (conflict resolution)`);
              } else {
                verbose(`Adding ${filesToHook.length} file(s) to pre-commit hook (conflict resolution)`);
                await updatePreCommitHook(resolvedTargetRoot, filesToHook);
                verbose(`✓ Updated ${plannedResult.file}`);
              }
              result.gitIgnoreChanges!.push(plannedResult);
            }

            if (filesToCommit.length > 0) {
              if (options.dryRun) {
                verbose(`Would remove ${filesToCommit.length} file(s) from a16n-managed sections (conflict resolution: commit)`);
              } else {
                verbose(`Removing ${filesToCommit.length} file(s) from a16n-managed sections (conflict resolution: commit)`);
                const gitignoreResult = await removeFromGitIgnore(resolvedTargetRoot, filesToCommit);
                if (gitignoreResult.file) {
                  verbose('  Removed from .gitignore');
                }
                if (await isGitRepo(resolvedTargetRoot)) {
                  const excludeResult = await removeFromGitExclude(resolvedTargetRoot, filesToCommit);
                  if (excludeResult.file) {
                    verbose('  Removed from .git/info/exclude');
                  }
                  const hookResult = await removeFromPreCommitHook(resolvedTargetRoot, filesToCommit);
                  if (hookResult.file) {
                    verbose('  Removed from pre-commit hook');
                  }
                }
                verbose(`✓ Ensured ${filesToCommit.length} file(s) are tracked (removed from a16n sections)`);
              }
            }

            if (filesToGitignore.length === 0 && filesToExclude.length === 0 && filesToHook.length === 0 && filesToCommit.length === 0) {
              verbose('No files need to be ignored (sources are tracked)');
            }
          }
        } catch (error) {
          io.error(formatError((error as Error).message));
          io.setExitCode(1);
          return;
        }
      }
    }

    // Handle --delete-source flag
    // Delete from the source root (--from-dir if set, otherwise positional path)
    if (options.deleteSource) {
      const deletedSources: string[] = [];

      // Collect all sources that contributed to successful outputs
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

      // Collect sources involved in skips (these should be preserved)
      const skippedSources = new Set<string>();
      for (const warning of result.warnings) {
        if (warning.code === WarningCode.Skipped && warning.sources) {
          for (const source of warning.sources) {
            skippedSources.add(path.resolve(resolvedSourceRoot, source));
          }
        }
      }

      // Calculate sources to delete: used sources minus skipped sources
      const sourcesToDelete = Array.from(usedSources).filter(
        source => !skippedSources.has(source),
      );

      // Delete sources (or show what would be deleted in dry-run)
      for (const absolutePath of sourcesToDelete) {
        const relativePath = path.relative(resolvedSourceRoot, absolutePath);
        // Guard: prevent deletion outside project root (CR-12 security feedback)
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

      // Add deletedSources to result for JSON output (relative paths)
      if (deletedSources.length > 0 || (options.dryRun && sourcesToDelete.length > 0)) {
        result.deletedSources = options.dryRun
          ? sourcesToDelete.map(s => path.relative(resolvedSourceRoot, s))
          : deletedSources;
      }
    }

    if (options.json) {
      io.log(JSON.stringify(result, null, 2));
    } else if (!options.quiet) {
      // Print summary (suppressed with --quiet)
      io.log(`Discovered: ${result.discovered.length} items`);

      if (result.written.length > 0) {
        for (const file of result.written) {
          const writePrefix = options.dryRun ? 'Would write' : 'Wrote';
          const relativePath = path.relative(resolvedTargetRoot, file.path);
          io.log(`${writePrefix}: ${relativePath}`);
        }
      }

      if (result.gitIgnoreChanges && result.gitIgnoreChanges.length > 0) {
        for (const change of result.gitIgnoreChanges) {
          const prefix = options.dryRun ? 'Would update' : 'Git: Updated';
          io.log(`${prefix} ${change.file} (${change.added.length} entries)`);

          if (options.dryRun && gitignoreStyle === 'match' && change.added.length > 0) {
            for (const file of change.added) {
              io.log(`  ${file} → ${change.file}`);
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

      // Print summary
      io.log(formatSummary(result.discovered.length, result.written.length, result.warnings.length));
    }
  } catch (error) {
    io.error(formatError((error as Error).message));
    io.setExitCode(1);
  }
}
