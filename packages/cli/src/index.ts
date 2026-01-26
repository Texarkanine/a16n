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
      
      if (gitignoreStyle !== 'none' && !options.dryRun && result.written.length > 0) {
        verbose(`Applying git-ignore style: ${gitignoreStyle}`);
        
        // Filter for new files only
        const newFiles = result.written.filter(w => w.isNewFile).map(w => w.path);
        
        if (newFiles.length === 0) {
          verbose('No new files to manage (all outputs are edits to existing files)');
        } else {
          verbose(`Managing ${newFiles.length} new file(s)`);
          
          try {
            if (gitignoreStyle === 'ignore') {
              // Style: ignore - append to .gitignore
              verbose('Adding to .gitignore with semaphore pattern');
              const gitResult = await addToGitIgnore(resolvedPath, newFiles);
              result.gitIgnoreChanges!.push(gitResult);
              verbose(`✓ Updated ${gitResult.file}`);
              
            } else if (gitignoreStyle === 'exclude') {
              // Style: exclude - append to .git/info/exclude
              if (!(await isGitRepo(resolvedPath))) {
                throw new Error('Cannot use --gitignore-output-with \'exclude\': not a git repository');
              }
              verbose('Adding to .git/info/exclude with semaphore pattern');
              const gitResult = await addToGitExclude(resolvedPath, newFiles);
              result.gitIgnoreChanges!.push(gitResult);
              verbose(`✓ Updated ${gitResult.file}`);
              
            } else if (gitignoreStyle === 'hook') {
              // Style: hook - create/update pre-commit hook
              if (!(await isGitRepo(resolvedPath))) {
                throw new Error('Cannot use --gitignore-output-with \'hook\': not a git repository');
              }
              verbose('Creating/updating pre-commit hook with semaphore pattern');
              const gitResult = await updatePreCommitHook(resolvedPath, newFiles);
              result.gitIgnoreChanges!.push(gitResult);
              verbose(`✓ Updated ${gitResult.file} (executable)`);
              
            } else if (gitignoreStyle === 'match') {
              // Style: match - mirror source git status to output
              verbose('Checking git status for source files...');
              const filesToIgnore: string[] = [];
              
              for (const written of result.written) {
                if (!written.isNewFile) continue; // Only manage new files
                
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
                    verbose(`  ${source.sourcePath} is ignored → ${written.path} should be ignored`);
                    break;
                  }
                }
                
                if (anySourceIgnored) {
                  // Check if output already exists and is tracked (boundary crossing)
                  const outputTracked = await isGitTracked(resolvedPath, written.path);
                  if (outputTracked) {
                    // Boundary crossing: source ignored but output tracked
                    result.warnings.push({
                      code: 'boundary-crossing' as any,
                      message: `Cannot match git-ignore status: source is ignored, but output '${written.path}' already exists and is tracked`,
                      sources: sources.map(s => s.sourcePath),
                    });
                    verbose(`  ⚠ Boundary crossing detected for ${written.path}`);
                  } else {
                    // Safe to ignore
                    filesToIgnore.push(written.path);
                  }
                }
              }
              
              if (filesToIgnore.length > 0) {
                verbose(`Ignoring ${filesToIgnore.length} output file(s) to match source status`);
                const gitResult = await addToGitIgnore(resolvedPath, filesToIgnore);
                result.gitIgnoreChanges!.push(gitResult);
                verbose(`✓ Updated ${gitResult.file}`);
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
            console.log(`Git: Updated ${change.file} (${change.added.length} entries)`);
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
