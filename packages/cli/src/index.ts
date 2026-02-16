#!/usr/bin/env node
import * as path from 'path';
import { Command, Option } from 'commander';
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import a16nPlugin from '@a16njs/plugin-a16n';
import { handleConvert } from './commands/convert.js';
import { handleDiscover } from './commands/discover.js';
import type { CommandIO } from './commands/io.js';

/**
 * Default CommandIO that delegates to console and process.
 */
const defaultIO: CommandIO = {
  log: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg),
  setExitCode: (code: number) => { process.exitCode = code; },
};

/**
 * Create a Commander program with all a16n subcommands.
 *
 * When engine is null the program is still structurally valid (has all
 * commands and options) but actions will fail if invoked. This supports
 * the doc generator which only inspects program structure.
 *
 * @param engine - A16n engine instance, or null for structure-only usage
 * @returns Configured Commander program
 */
export function createProgram(engine: A16nEngine | null): Command {
  const program = new Command();

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
      'none',
    )
    .option(
      '--if-gitignore-conflict <resolution>',
      'How to resolve git-ignore conflicts in match mode (skip, ignore, exclude, hook, commit)',
      'skip',
    )
    .option(
      '--delete-source',
      'Delete source files after successful conversion (skipped sources are preserved)',
    )
    .option(
      '--from-dir <dir>',
      'Override source directory for reading (discover). Default: positional [path]',
    )
    .option(
      '--to-dir <dir>',
      'Override target directory for writing (emit). Default: positional [path]',
    )
    .option(
      '--rewrite-path-refs',
      'Rewrite file path references in content to point to target-format paths',
    )
    .argument('[path]', 'Project path', '.')
    .action(async (projectPath, options) => {
      if (!engine) return;
      await handleConvert(engine, projectPath, options, defaultIO);
    });

  program
    .command('discover')
    .description('List agent customization without converting')
    .requiredOption('-f, --from <agent>', 'Agent to discover')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed output')
    .option(
      '--from-dir <dir>',
      'Override source directory for reading. Default: positional [path]',
    )
    .addOption(new Option('--to-dir <dir>', 'hidden').hideHelp())
    .argument('[path]', 'Project path', '.')
    .action(async (projectPath, options) => {
      if (!engine) return;
      await handleDiscover(engine, projectPath, options, defaultIO);
    });

  program
    .command('plugins')
    .description('Show available plugins')
    .action(() => {
      if (!engine) return;
      const plugins = engine.listPlugins();

      console.log('Available plugins:\n');
      for (const plugin of plugins) {
        console.log(`  ${plugin.id}`);
        console.log(`    Name: ${plugin.name}`);
        console.log(`    Supports: ${plugin.supports.join(', ')}\n`);
      }
    });

  return program;
}

// Run CLI when this module is executed directly (not imported by tests/doc-gen)
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);

/**
 * Resolve a path through symlinks, falling back to path.resolve if the
 * target does not exist (e.g. during bundling or unusual setups).
 */
function resolveReal(p: string): string {
  try { return realpathSync(p); } catch { return path.resolve(p); }
}

const isMainModule = process.argv[1] && resolveReal(process.argv[1]) === resolveReal(__filename);

if (isMainModule) {
  const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin]);
  const program = createProgram(engine);
  program.parse();
}
