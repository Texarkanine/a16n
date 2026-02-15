import { Command } from 'commander';
import type { A16nEngine } from '@a16njs/engine';

/**
 * Create the a16n CLI program structure.
 *
 * This function returns a Commander program with all subcommands and options
 * configured, but does NOT call .parse(). This allows the program structure
 * to be inspected programmatically (e.g., by documentation generators) or
 * executed when ready.
 *
 * @param engine - The A16nEngine instance to use, or null for structure-only usage
 * @returns Configured Commander Command instance
 */
export function createProgram(engine: A16nEngine | null): Command {
  const program = new Command();

  program
    .name('a16n')
    .description('Convert agent customizations between formats')
    .version('0.11.1');

  // Convert subcommand
  const convert = program
    .command('convert')
    .description('Convert customizations from one format to another')
    .option('--from-dir <path>', 'Source directory to read from')
    .option('--to-dir <path>', 'Target directory to write to')
    .option('--rewrite-path-refs', 'Rewrite path references in content during conversion');

  if (engine) {
    convert.action(async (options) => {
      // Implementation would use engine.convert() here
      console.log('Convert with options:', options);
    });
  }

  // Discover subcommand
  const discover = program
    .command('discover')
    .description('Discover customizations in a directory')
    .option('--from-dir <path>', 'Directory to discover from');

  if (engine) {
    discover.action(async (options) => {
      // Implementation would use engine.discover() here
      console.log('Discover with options:', options);
    });
  }

  // Plugins subcommand
  const plugins = program
    .command('plugins')
    .description('List available plugins');

  if (engine) {
    plugins.action(() => {
      // Implementation would use engine.listPlugins() here
      console.log('List plugins');
    });
  }

  return program;
}
