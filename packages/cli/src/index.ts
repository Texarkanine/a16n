#!/usr/bin/env node
import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { Command, Option } from 'commander';
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import a16nPlugin from '@a16njs/plugin-a16n';
import { createDefaultIO } from './commands/io.js';
import { handleConvert } from './commands/convert.js';
import { handleDiscover } from './commands/discover.js';
import { handlePlugins } from './commands/plugins.js';

/**
 * Create the CLI program with all commands and options.
 *
 * Accepts an engine instance (or null for structure-only usage such as
 * documentation generation). When engine is null, the program can still
 * be inspected for its command/option structure, but actions that call
 * engine methods will fail at runtime — which is fine since actions are
 * never invoked during doc generation.
 *
 * @param engine - A16nEngine instance, or null for structure-only usage
 * @returns Configured Commander program
 */
export function createProgram(engine: A16nEngine | null): Command {
  const program = new Command();
  const io = createDefaultIO();

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
      await handleConvert(engine!, projectPath, options, io);
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
      await handleDiscover(engine!, projectPath, options, io);
    });

  program
    .command('plugins')
    .description('Show available plugins')
    .action(() => {
      handlePlugins(engine!, io);
    });

  return program;
}

// ESM "is main module" guard — only parse when executed directly as CLI
const isDirectRun = process.argv[1] &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));

if (isDirectRun) {
  const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin]);
  const program = createProgram(engine);
  program.parse();
}
