#!/usr/bin/env node
import { createRequire } from 'module';
import { Command, Option } from 'commander';
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import a16nPlugin from '@a16njs/plugin-a16n';
import agentsmdPlugin from '@a16njs/plugin-agentsmd';
import { handleConvert } from './commands/convert.js';
import { handleDiscover } from './commands/discover.js';
import { handlePlugins } from './commands/plugins.js';
import type { CommandIO } from './commands/io.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

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
 * @param io - Optional I/O adapter (defaults to console/process)
 * @returns Configured Commander program
 */
export function createProgram(engine: A16nEngine | null, io: CommandIO = defaultIO): Command {
  const program = new Command();
  const pluginIds = engine?.listPlugins().map(p => p.id).join(', ') ?? 'cursor, claude, a16n, agentsmd';

  program
    .name('a16n')
    .description('Agent customization portability for AI coding tools')
    .version(pkg.version);

  program
    .command('convert')
    .description('Convert agent customization between tools')
    .requiredOption('-f, --from <tool>', `Source tool (available: ${pluginIds})`)
    .requiredOption('-t, --to <tool>', `Target tool (available: ${pluginIds})`)
    .option('--dry-run', 'Show what would happen without writing')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-error output')
    .option('-v, --verbose', 'Show detailed output')
    .addOption(
      new Option('--gitignore-output-with <style>', 'Manage git-ignore status of output files')
        .choices(['none', 'ignore', 'exclude', 'hook', 'match'])
        .default('none')
    )
    .addOption(
      new Option('--if-gitignore-conflict <resolution>', 'How to resolve git-ignore conflicts in match mode')
        .choices(['skip', 'ignore', 'exclude', 'hook', 'commit'])
        .default('skip')
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
      if (!engine) {
        io.error('engine not initialized');
        io.setExitCode(1);
        return;
      }
      await handleConvert(engine, projectPath, options, io);
    });

  program
    .command('discover')
    .description('List agent customization without converting')
    .requiredOption('-f, --from <tool>', `Tool to discover (available: ${pluginIds})`)
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed output')
    .option(
      '--from-dir <dir>',
      'Override source directory for reading. Default: positional [path]',
    )
    .addOption(new Option('--to-dir <dir>', 'hidden').hideHelp())
    .argument('[path]', 'Project path', '.')
    .action(async (projectPath, options) => {
      if (!engine) {
        io.error('engine not initialized');
        io.setExitCode(1);
        return;
      }
      await handleDiscover(engine, projectPath, options, io);
    });

  program
    .command('plugins')
    .description('Show available plugins')
    .action(() => {
      if (!engine) {
        io.error('engine not initialized');
        io.setExitCode(1);
        return;
      }
      handlePlugins(engine, io);
    });

  return program;
}

// Run CLI when this module is executed directly (not imported by tests/doc-gen)
// Intentionally co-located with the entry-point guard below rather than at the
// top of the file — these are only needed for the "am I the main module?" check
// and grouping them here keeps the exported API visually separate.
import { fileURLToPath } from 'url';
import { statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);

/**
 * Are two paths the same file on disk? Compares device+inode from `statSync`
 * (which follows symlinks). This is symlink-transparent, which matters
 * because Node's ESM loader sets `import.meta.url` to the resolved real
 * path while leaving `process.argv[1]` as whatever the user invoked — e.g.
 * `node_modules/.bin/a16n`, which is a symlink under every normal install.
 */
function isSameFile(a: string, b: string): boolean {
  try {
    const sa = statSync(a);
    const sb = statSync(b);
    return sa.dev === sb.dev && sa.ino === sb.ino;
  } catch {
    return false;
  }
}

const isMainModule = Boolean(process.argv[1]) && isSameFile(process.argv[1]!, __filename);

if (isMainModule) {
  const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin, agentsmdPlugin]);
  await engine.discoverAndRegisterPlugins();
  const program = createProgram(engine);
  program.parse();
}
