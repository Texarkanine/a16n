#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { Command } from 'commander';
import { A16nEngine } from '@a16n/engine';
import cursorPlugin from '@a16n/plugin-cursor';
import claudePlugin from '@a16n/plugin-claude';
import { formatWarning, formatError, formatSummary } from './output.js';

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
  .argument('[path]', 'Project path', '.')
  .action(async (projectPath, options) => {
    try {
      const verbose = (msg: string) => {
        if (options.verbose) console.error(`[verbose] ${msg}`);
      };

      // Validate directory exists
      const resolvedPath = path.resolve(projectPath);
      try {
        await fs.access(resolvedPath);
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

      // Validate directory exists
      const resolvedPath = path.resolve(projectPath);
      try {
        await fs.access(resolvedPath);
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
