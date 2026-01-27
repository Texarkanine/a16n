#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { Command } from 'commander';
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import { formatWarning, formatError, formatSummary } from './output.js';
import {
  isGitRepo,
  isGitIgnored,
  isGitTracked,
  addToGitIgnore,
  addToGitExclude,
  updatePreCommitHook,
  type GitIgnoreResult,
} from './git-ignore.js';

const program = new Command();

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

      const result = await engine.convert({
        source: options.from,
        target: options.to,
        root: projectPath,
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
        
        // Filter for new files only and convert absolute paths to relative paths
        const newFiles = result.written
          .filter(w => w.isNewFile)
          .map(w => path.relative(resolvedPath, w.path));
        
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
              // Style: match - mirror source git status to output
              verbose('Checking git status for source files...');
              const filesToIgnore: string[] = [];
              
              for (const written of result.written) {
                if (!written.isNewFile) continue; // Only manage new files
                
                // Convert absolute path to relative path for git operations
                const relativePath = path.relative(resolvedPath, written.path);
                
                // Find source files that contributed to this output
                const sources = result.discovered.filter(d => {
                  // Simple heuristic: assume sources contribute to outputs of same type
                  // This is a simplification - a more robust approach would track this in the engine
                  return d.type === written.type;
                });
                
                if (sources.length === 0) continue;
                
                // Check if ANY source is git-ignored (conservative approach)
                let anySourceIgnored = false;
                for (const source of sources) {
                  if (await isGitIgnored(resolvedPath, source.sourcePath)) {
                    anySourceIgnored = true;
                    verbose(`  ${source.sourcePath} is ignored → ${relativePath} should be ignored`);
                    break;
                  }
                }
                
                if (anySourceIgnored) {
                  // Check if output already exists and is tracked (boundary crossing)
                  const outputTracked = await isGitTracked(resolvedPath, relativePath);
                  if (outputTracked) {
                    // Boundary crossing: source ignored but output tracked
                    result.warnings.push({
                      code: 'boundary-crossing' as any,
                      message: `Cannot match git-ignore status: source is ignored, but output '${relativePath}' already exists and is tracked`,
                      sources: sources.map(s => s.sourcePath),
                    });
                    verbose(`  ⚠ Boundary crossing detected for ${relativePath}`);
                  } else {
                    // Safe to ignore
                    filesToIgnore.push(relativePath);
                  }
                }
              }
              
              if (filesToIgnore.length > 0) {
                const plannedResult: GitIgnoreResult = { file: '.gitignore', added: filesToIgnore };
                
                if (options.dryRun) {
                  verbose(`Would ignore ${filesToIgnore.length} output file(s) to match source status`);
                } else {
                  verbose(`Ignoring ${filesToIgnore.length} output file(s) to match source status`);
                  await addToGitIgnore(resolvedPath, filesToIgnore);
                  verbose(`✓ Updated ${plannedResult.file}`);
                }
                result.gitIgnoreChanges!.push(plannedResult);
              } else {
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
