#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { Command } from 'commander';
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import { formatWarning, formatError, formatSummary } from './output.js';
import { WarningCode } from '@a16njs/models';
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
  type IgnoreSource,
} from './git-ignore.js';

const program = new Command();

/**
 * Converts a path to POSIX format (forward slashes) for gitignore compatibility.
 * On Windows, path.relative() returns backslash-separated paths, but .gitignore
 * files require forward slashes for proper pattern matching.
 */
function toGitIgnorePath(p: string): string {
  return p.split(path.sep).join('/');
}

// Create engine with bundled plugins
const engine = new A16nEngine([cursorPlugin, claudePlugin]);

program
  .name('a16n')
  .description('Agent customization portability for AI coding tools')
  .version('0.0.1');

program
  .command('convert')
  .description('Convert agent customization between tools')
  .requiredOption('-f, --from <agent>', 'Source agent')
  .requiredOption('-t, --to <agent>', 'Target agent')
  .option('--dry-run', 'Show what would happen without writing')
  .option('--json', 'Output as JSON')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('-v, --verbose', 'Show detailed output')
  .option(
    '--gitignore-output-with <style>',
    'Manage git-ignore status of output files (none, ignore, exclude, hook, match)',
    'none'
  )
  .option(
    '--if-gitignore-conflict <resolution>',
    'How to resolve git-ignore conflicts in match mode (skip, ignore, exclude, hook, commit)',
    'skip'
  )
  .argument('[path]', 'Project path', '.')
  .action(async (projectPath, options) => {
    try {
      const verbose = (msg: string) => {
        if (options.verbose) console.error(`[verbose] ${msg}`);
      };

      // Validate --if-gitignore-conflict flag
      const validConflictResolutions = ['skip', 'ignore', 'exclude', 'hook', 'commit'];
      const conflictResolution = options.ifGitignoreConflict as string;
      if (conflictResolution && !validConflictResolutions.includes(conflictResolution)) {
        console.error(formatError(
          `Invalid --if-gitignore-conflict value: '${conflictResolution}'`,
          `Must be one of: ${validConflictResolutions.join(', ')}`
        ));
        process.exitCode = 1;
        return;
      }

      // Validate directory exists and is a directory
      const resolvedPath = path.resolve(projectPath);
      try {
        const stat = await fs.stat(resolvedPath);
        if (!stat.isDirectory()) {
          throw new Error('not-a-directory');
        }
      } catch {
        console.error(formatError(
          `Directory '${projectPath}' does not exist`,
          'Make sure the path is correct and the directory exists.'
        ));
        process.exitCode = 1;
        return;
      }

      verbose(`Discovering from ${options.from}...`);
      verbose(`Root: ${resolvedPath}`);

      const result = await engine.convert({
        source: options.from,
        target: options.to,
        root: resolvedPath,
        dryRun: options.dryRun,
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
      if (gitignoreStyle !== 'none' && result.written.length > 0) {
        verbose(`Planning git-ignore style: ${gitignoreStyle}${options.dryRun ? ' (dry-run)' : ''}`);
        
        // Filter for new files only and convert absolute paths to relative paths (POSIX format)
        const newFiles = result.written
          .filter(w => w.isNewFile)
          .map(w => toGitIgnorePath(path.relative(resolvedPath, w.path)));
        
        if (newFiles.length === 0) {
          verbose('No new files to manage (all outputs are edits to existing files)');
        } else {
          verbose(`${options.dryRun ? 'Would manage' : 'Managing'} ${newFiles.length} new file(s)`);
          
          try {
            if (gitignoreStyle === 'ignore') {
              // Style: ignore - append to .gitignore
              const plannedResult: GitIgnoreResult = { file: '.gitignore', added: newFiles };
              
              if (options.dryRun) {
                verbose(`Would add to .gitignore with semaphore pattern`);
              } else {
                verbose('Adding to .gitignore with semaphore pattern');
                await addToGitIgnore(resolvedPath, newFiles);
                verbose(`✓ Updated ${plannedResult.file}`);
              }
              result.gitIgnoreChanges!.push(plannedResult);
              
            } else if (gitignoreStyle === 'exclude') {
              // Style: exclude - append to .git/info/exclude
              if (!(await isGitRepo(resolvedPath))) {
                throw new Error('Cannot use --gitignore-output-with \'exclude\': not a git repository');
              }
              const plannedResult: GitIgnoreResult = { file: '.git/info/exclude', added: newFiles };
              
              if (options.dryRun) {
                verbose(`Would add to .git/info/exclude with semaphore pattern`);
              } else {
                verbose('Adding to .git/info/exclude with semaphore pattern');
                await addToGitExclude(resolvedPath, newFiles);
                verbose(`✓ Updated ${plannedResult.file}`);
              }
              result.gitIgnoreChanges!.push(plannedResult);
              
            } else if (gitignoreStyle === 'hook') {
              // Style: hook - create/update pre-commit hook
              if (!(await isGitRepo(resolvedPath))) {
                throw new Error('Cannot use --gitignore-output-with \'hook\': not a git repository');
              }
              const plannedResult: GitIgnoreResult = { file: '.git/hooks/pre-commit', added: newFiles };
              
              if (options.dryRun) {
                verbose(`Would create/update pre-commit hook with semaphore pattern`);
              } else {
                verbose('Creating/updating pre-commit hook with semaphore pattern');
                await updatePreCommitHook(resolvedPath, newFiles);
                verbose(`✓ Updated ${plannedResult.file} (executable)`);
              }
              result.gitIgnoreChanges!.push(plannedResult);
              
            } else if (gitignoreStyle === 'match') {
              // Style: match - mirror source git status to output, routing to same destination
              if (!(await isGitRepo(resolvedPath))) {
                throw new Error("Cannot use --gitignore-output-with 'match': not a git repository");
              }
              verbose('Checking git status for source files...');
              
              // Get conflict resolution strategy
              const conflictResolution = (options.ifGitignoreConflict as string) || 'skip';
              
              // Group files by destination (.gitignore vs .git/info/exclude)
              const filesToGitignore: string[] = [];
              const filesToExclude: string[] = [];
              const filesToHook: string[] = [];
              const filesToCommit: string[] = [];
              
              for (const written of result.written) {
                // Convert absolute path to relative path for git operations (POSIX format)
                const relativePath = toGitIgnorePath(path.relative(resolvedPath, written.path));
                
                // Check if plugin provides sourceItems (required for accurate conflict detection)
                if (!written.sourceItems) {
                  // Plugin doesn't provide source tracking - can't safely detect conflicts
                  result.warnings.push({
                    code: WarningCode.Approximated,
                    message: `Skipping gitignore management for '${relativePath}': plugin does not provide source tracking (update plugin for accurate conflict detection)`,
                  });
                  verbose(`  ⚠ Skipping ${relativePath} (no sourceItems, can't detect conflicts)`);
                  continue;
                }
                
                const sources = written.sourceItems;
                if (sources.length === 0) continue;
                
                // Check git status for each source
                const sourceStatuses = await Promise.all(
                  sources.map(async (source) => ({
                    source,
                    ignoreSource: await getIgnoreSource(resolvedPath, source.sourcePath),
                  }))
                );
                
                const ignoredSources = sourceStatuses.filter(s => s.ignoreSource !== null);
                const trackedSources = sourceStatuses.filter(s => s.ignoreSource === null);
                
                // Case 1: Output file already exists
                if (!written.isNewFile) {
                  const outputTracked = await isGitTracked(resolvedPath, relativePath);
                  const outputIgnored = !outputTracked && await isGitIgnored(resolvedPath, relativePath);
                  
                  // Check for destination conflict (output status doesn't match sources)
                  const hasDestinationConflict = 
                    (outputTracked && ignoredSources.length > 0) ||
                    (outputIgnored && trackedSources.length > 0);
                  
                  if (hasDestinationConflict) {
                    // Handle conflict based on resolution strategy
                    if (conflictResolution === 'skip') {
                      // Default: emit warning and skip
                      if (outputTracked && ignoredSources.length > 0) {
                        result.warnings.push({
                          code: WarningCode.GitStatusConflict,
                          message: `Git status conflict: output '${relativePath}' is tracked, but ${ignoredSources.length} source(s) are ignored`,
                          sources: ignoredSources.map(s => s.source.sourcePath),
                        });
                        verbose(`  ⚠ Git status conflict for ${relativePath} (output tracked, sources ignored) - skipping`);
                      } else {
                        result.warnings.push({
                          code: WarningCode.GitStatusConflict,
                          message: `Git status conflict: output '${relativePath}' is ignored, but ${trackedSources.length} source(s) are tracked`,
                          sources: trackedSources.map(s => s.source.sourcePath),
                        });
                        verbose(`  ⚠ Git status conflict for ${relativePath} (output ignored, sources tracked) - skipping`);
                      }
                    } else {
                      // Apply conflict resolution
                      verbose(`  ⚠ Git status conflict for ${relativePath} - resolving with --if-gitignore-conflict ${conflictResolution}`);
                      
                      switch (conflictResolution) {
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
                  }
                  continue; // Skip to next file (existing files don't get normal processing)
                }
                
                // Case 2: Output is new + sources unanimous
                if (ignoredSources.length === sources.length) {
                  // All sources ignored - check if they're all from the same ignore file
                  const ignoreDestinations = new Set(ignoredSources.map(s => s.ignoreSource));
                  
                  if (ignoreDestinations.size > 1) {
                    // Sources are ignored by different files (e.g., .gitignore vs .git/info/exclude)
                    // Treat as conflict
                    if (conflictResolution === 'skip') {
                      result.warnings.push({
                        code: WarningCode.GitStatusConflict,
                        message: `Git status conflict: sources for '${relativePath}' are ignored by different files (${[...ignoreDestinations].join(', ')})`,
                        sources: sources.map(s => s.sourcePath),
                      });
                      verbose(`  ⚠ Git status conflict for ${relativePath} (sources ignored by different files) - skipping`);
                    } else {
                      // Apply conflict resolution
                      verbose(`  ⚠ Git status conflict for ${relativePath} (sources ignored by different files) - resolving with --if-gitignore-conflict ${conflictResolution}`);
                      
                      switch (conflictResolution) {
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
                  } else {
                    // All sources ignored by the same file - proceed normally
                    const ignoreDestination = ignoredSources[0]?.ignoreSource;
                    if (ignoreDestination === '.git/info/exclude') {
                      filesToExclude.push(relativePath);
                    } else {
                      filesToGitignore.push(relativePath);
                    }
                    verbose(`  ${relativePath} → ${ignoreDestination} (all sources ignored)`);
                  }
                } else if (trackedSources.length === sources.length) {
                  // All sources tracked - don't add to gitignore
                  verbose(`  ${relativePath} not ignored (all sources tracked)`);
                } 
                // Case 3: Output is new + sources conflict
                else if (ignoredSources.length > 0 && trackedSources.length > 0) {
                  // Sources have conflicting status - handle based on resolution strategy
                  if (conflictResolution === 'skip') {
                    // Default: emit warning and skip
                    result.warnings.push({
                      code: WarningCode.GitStatusConflict,
                      message: `Git status conflict: cannot determine status for '${relativePath}' (${ignoredSources.length} source(s) ignored, ${trackedSources.length} tracked)`,
                      sources: sources.map(s => s.sourcePath),
                    });
                    verbose(`  ⚠ Git status conflict for ${relativePath} (sources have mixed status) - skipping`);
                  } else {
                    // Apply conflict resolution
                    verbose(`  ⚠ Git status conflict for ${relativePath} - resolving with --if-gitignore-conflict ${conflictResolution}`);
                    
                    switch (conflictResolution) {
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
                }
              }
              
              // Add files to .gitignore if any
              if (filesToGitignore.length > 0) {
                const plannedResult: GitIgnoreResult = { file: '.gitignore', added: filesToGitignore };
                
                if (options.dryRun) {
                  verbose(`Would add ${filesToGitignore.length} file(s) to .gitignore to match source status`);
                } else {
                  verbose(`Adding ${filesToGitignore.length} file(s) to .gitignore to match source status`);
                  await addToGitIgnore(resolvedPath, filesToGitignore);
                  verbose(`✓ Updated ${plannedResult.file}`);
                }
                result.gitIgnoreChanges!.push(plannedResult);
              }
              
              // Add files to .git/info/exclude if any
              if (filesToExclude.length > 0) {
                const plannedResult: GitIgnoreResult = { file: '.git/info/exclude', added: filesToExclude };
                
                if (options.dryRun) {
                  verbose(`Would add ${filesToExclude.length} file(s) to .git/info/exclude to match source status`);
                } else {
                  verbose(`Adding ${filesToExclude.length} file(s) to .git/info/exclude to match source status`);
                  await addToGitExclude(resolvedPath, filesToExclude);
                  verbose(`✓ Updated ${plannedResult.file}`);
                }
                result.gitIgnoreChanges!.push(plannedResult);
              }
              
              // Add files to pre-commit hook if any
              if (filesToHook.length > 0) {
                const plannedResult: GitIgnoreResult = { file: '.git/hooks/pre-commit', added: filesToHook };
                
                if (options.dryRun) {
                  verbose(`Would add ${filesToHook.length} file(s) to pre-commit hook (conflict resolution)`);
                } else {
                  verbose(`Adding ${filesToHook.length} file(s) to pre-commit hook (conflict resolution)`);
                  await updatePreCommitHook(resolvedPath, filesToHook);
                  verbose(`✓ Updated ${plannedResult.file}`);
                }
                result.gitIgnoreChanges!.push(plannedResult);
              }
              
              // Remove files from a16n-managed sections if any (commit resolution)
              if (filesToCommit.length > 0) {
                if (options.dryRun) {
                  verbose(`Would remove ${filesToCommit.length} file(s) from a16n-managed sections (conflict resolution: commit)`);
                } else {
                  verbose(`Removing ${filesToCommit.length} file(s) from a16n-managed sections (conflict resolution: commit)`);
                  
                  // Remove from .gitignore
                  const gitignoreResult = await removeFromGitIgnore(resolvedPath, filesToCommit);
                  if (gitignoreResult.file) {
                    verbose(`  Removed from .gitignore`);
                  }
                  
                  // Remove from .git/info/exclude if git repo
                  if (await isGitRepo(resolvedPath)) {
                    const excludeResult = await removeFromGitExclude(resolvedPath, filesToCommit);
                    if (excludeResult.file) {
                      verbose(`  Removed from .git/info/exclude`);
                    }
                    
                    // Remove from pre-commit hook if git repo
                    const hookResult = await removeFromPreCommitHook(resolvedPath, filesToCommit);
                    if (hookResult.file) {
                      verbose(`  Removed from pre-commit hook`);
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
            console.error(formatError((error as Error).message));
            process.exitCode = 1;
            return;
          }
        }
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (!options.quiet) {
        // Print summary (suppressed with --quiet)
        console.log(`Discovered: ${result.discovered.length} items`);
        
        if (result.written.length > 0) {
          for (const file of result.written) {
            console.log(`Wrote: ${file.path}`);
          }
        }
        
        if (result.gitIgnoreChanges && result.gitIgnoreChanges.length > 0) {
          for (const change of result.gitIgnoreChanges) {
            const prefix = options.dryRun ? 'Would update' : 'Git: Updated';
            console.log(`${prefix} ${change.file} (${change.added.length} entries)`);
            
            // Show per-file details in dry-run match mode
            if (options.dryRun && gitignoreStyle === 'match' && change.added.length > 0) {
              for (const file of change.added) {
                console.log(`  ${file} → ${change.file}`);
              }
            }
          }
        }
        
        if (result.warnings.length > 0) {
          for (const warning of result.warnings) {
            console.log(formatWarning(warning));
          }
        }
        
        if (result.unsupported.length > 0) {
          console.log(`Unsupported: ${result.unsupported.length} items`);
        }

        // Print summary
        console.log(formatSummary(result.discovered.length, result.written.length, result.warnings.length));
      }
    } catch (error) {
      console.error(formatError((error as Error).message));
      process.exitCode = 1;
    }
  });

program
  .command('discover')
  .description('List agent customization without converting')
  .requiredOption('-f, --from <agent>', 'Agent to discover')
  .option('--json', 'Output as JSON')
  .option('-v, --verbose', 'Show detailed output')
  .argument('[path]', 'Project path', '.')
  .action(async (projectPath, options) => {
    try {
      const verbose = (msg: string) => {
        if (options.verbose) console.error(`[verbose] ${msg}`);
      };

      // Validate directory exists and is a directory
      const resolvedPath = path.resolve(projectPath);
      try {
        const stat = await fs.stat(resolvedPath);
        if (!stat.isDirectory()) {
          throw new Error('not-a-directory');
        }
      } catch {
        console.error(formatError(
          `Directory '${projectPath}' does not exist`,
          'Make sure the path is correct and the directory exists.'
        ));
        process.exitCode = 1;
        return;
      }

      verbose(`Discovering from ${options.from}...`);
      verbose(`Root: ${resolvedPath}`);

      const result = await engine.discover(options.from, projectPath);

      verbose(`Found ${result.items.length} items`);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Found ${result.items.length} items`);
        for (const item of result.items) {
          console.log(`  - ${item.type}: ${item.sourcePath}`);
        }
        
        if (result.warnings.length > 0) {
          for (const warning of result.warnings) {
            console.log(formatWarning(warning));
          }
        }
      }
    } catch (error) {
      console.error(formatError((error as Error).message));
      process.exitCode = 1;
    }
  });

program
  .command('plugins')
  .description('Show available plugins')
  .action(() => {
    const plugins = engine.listPlugins();

    console.log('Available plugins:\n');
    for (const plugin of plugins) {
      console.log(`  ${plugin.id}`);
      console.log(`    Name: ${plugin.name}`);
      console.log(`    Supports: ${plugin.supports.join(', ')}\n`);
    }
  });

program.parse();
