/**
 * Tests for generate-cli-docs.ts
 *
 * Tests the CLI documentation generation logic.
 * Uses mock Commander instances to test markdown generation
 * without importing actual CLI implementations.
 */

import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateCommandMarkdown,
  generateCliReference,
  extractCommandInfo,
  generateFallbackPage,
  hasCreateProgramExport,
  type CommandInfo,
} from '../scripts/generate-cli-docs.js';

describe('extractCommandInfo', () => {
  it('extracts basic command information', () => {
    const cmd = new Command('test')
      .description('A test command')
      .option('-v, --verbose', 'Enable verbose output');

    const info = extractCommandInfo(cmd);

    expect(info.name).toBe('test');
    expect(info.description).toBe('A test command');
    expect(info.options).toHaveLength(1);
    expect(info.options[0]).toEqual({
      flags: '-v, --verbose',
      description: 'Enable verbose output',
      defaultValue: undefined,
      required: false,
    });
  });

  it('extracts required options', () => {
    const cmd = new Command('convert')
      .description('Convert files')
      .requiredOption('-f, --from <agent>', 'Source agent');

    const info = extractCommandInfo(cmd);

    expect(info.options[0].required).toBe(true);
    expect(info.options[0].flags).toBe('-f, --from <agent>');
  });

  it('extracts options with default values', () => {
    const cmd = new Command('run')
      .description('Run something')
      .option('-p, --port <number>', 'Port number', '3000');

    const info = extractCommandInfo(cmd);

    expect(info.options[0].defaultValue).toBe('3000');
  });

  it('extracts command arguments', () => {
    const cmd = new Command('process')
      .description('Process files')
      .argument('<input>', 'Input file')
      .argument('[output]', 'Output file', 'out.txt');

    const info = extractCommandInfo(cmd);

    expect(info.arguments).toHaveLength(2);
    expect(info.arguments[0]).toEqual({
      name: '<input>',
      description: 'Input file',
      required: true,
      defaultValue: undefined,
    });
    expect(info.arguments[1]).toEqual({
      name: '[output]',
      description: 'Output file',
      required: false,
      defaultValue: 'out.txt',
    });
  });

  it('handles commands with no options or arguments', () => {
    const cmd = new Command('plugins')
      .description('List plugins');

    const info = extractCommandInfo(cmd);

    expect(info.name).toBe('plugins');
    expect(info.description).toBe('List plugins');
    expect(info.options).toHaveLength(0);
    expect(info.arguments).toHaveLength(0);
  });
});

describe('generateCommandMarkdown', () => {
  it('generates markdown for a simple command', () => {
    const info: CommandInfo = {
      name: 'plugins',
      description: 'Show available plugins',
      options: [],
      arguments: [],
    };

    const md = generateCommandMarkdown(info);

    expect(md).toContain('## plugins');
    expect(md).toContain('Show available plugins');
    expect(md).not.toContain('### Options');
    expect(md).not.toContain('### Arguments');
  });

  it('generates markdown with options section', () => {
    const info: CommandInfo = {
      name: 'convert',
      description: 'Convert files',
      options: [
        { flags: '-f, --from <agent>', description: 'Source agent', required: true },
        { flags: '-v, --verbose', description: 'Verbose output', required: false },
      ],
      arguments: [],
    };

    const md = generateCommandMarkdown(info);

    expect(md).toContain('## convert');
    expect(md).toContain('### Options');
    expect(md).toContain('`-f, --from <agent>`');
    expect(md).toContain('**(required)**');
    expect(md).toContain('`-v, --verbose`');
    expect(md).not.toContain('### Arguments');
  });

  it('generates markdown with arguments section', () => {
    const info: CommandInfo = {
      name: 'process',
      description: 'Process files',
      options: [],
      arguments: [
        { name: '<input>', description: 'Input file', required: true },
        { name: '[output]', description: 'Output file', required: false, defaultValue: 'out.txt' },
      ],
    };

    const md = generateCommandMarkdown(info);

    expect(md).toContain('### Arguments');
    expect(md).toContain('`<input>`');
    expect(md).toContain('`[output]`');
    expect(md).toContain('Default: `out.txt`');
  });

  it('includes default values for options', () => {
    const info: CommandInfo = {
      name: 'run',
      description: 'Run server',
      options: [
        { flags: '-p, --port <n>', description: 'Port', required: false, defaultValue: '3000' },
      ],
      arguments: [],
    };

    const md = generateCommandMarkdown(info);

    expect(md).toContain('Default: `3000`');
  });
});

describe('generateCliReference', () => {
  it('generates full CLI reference with frontmatter', () => {
    const program = new Command('a16n')
      .description('Agent customization tool')
      .version('1.0.0');

    program
      .command('convert')
      .description('Convert files')
      .requiredOption('-f, --from <agent>', 'Source agent')
      .argument('[path]', 'Project path', '.');

    program
      .command('plugins')
      .description('List plugins');

    const md = generateCliReference(program, '1.0.0');

    // Check frontmatter
    expect(md).toMatch(/^---\n/);
    expect(md).toContain('title: 1.0.0');
    expect(md).toContain('slug: /cli/reference/1.0.0');
    expect(md).toContain('---\n\n');

    // Check structure
    expect(md).toContain('# CLI Reference');
    expect(md).toContain('## convert');
    expect(md).toContain('## plugins');
    expect(md).toContain('-f, --from <agent>');
  });

  it('sanitizes slug for versions with spaces/parentheses', () => {
    const program = new Command('test')
      .description('Test')
      .version('1.0.0');

    const md = generateCliReference(program, 'current (unreleased)');

    expect(md).toContain('title: current (unreleased)');
    expect(md).toContain('slug: /cli/reference/current-unreleased');
  });

  it('excludes help command from output', () => {
    const program = new Command('a16n')
      .description('CLI tool')
      .version('1.0.0');

    program.command('real').description('Real command');
    // Commander adds help command automatically

    const md = generateCliReference(program, '1.0.0');

    expect(md).toContain('## real');
    expect(md).not.toContain('## help');
  });

  it('handles program with no subcommands', () => {
    const program = new Command('simple')
      .description('A simple CLI')
      .version('1.0.0')
      .option('-v, --verbose', 'Verbose');

    const md = generateCliReference(program, '1.0.0');

    expect(md).toContain('# CLI Reference');
    expect(md).toContain('-v, --verbose');
  });

  it('includes version in frontmatter', () => {
    const program = new Command('test')
      .description('Test')
      .version('2.5.0');

    const md = generateCliReference(program, '2.5.0');

    expect(md).toContain('2.5.0');
  });
});

describe('generateFallbackPage', () => {
  it('returns correct frontmatter with title and slug', () => {
    const md = generateFallbackPage('0.5.0');

    expect(md).toMatch(/^---\n/);
    expect(md).toContain('title: 0.5.0');
    expect(md).toContain('slug: /cli/reference/0.5.0');
    expect(md).toContain('---');
  });

  it('contains npx command with correct version', () => {
    const md = generateFallbackPage('0.5.0');

    expect(md).toContain('npx a16n@0.5.0 --help');
  });

  it('contains "not available" messaging', () => {
    const md = generateFallbackPage('0.5.0');

    expect(md).toMatch(/not available/i);
  });
});

// The CLI must export `createProgram` as a named function for the docsite to
// generate auto-generated reference pages. Without it, importing the CLI module
// triggers `program.parse()` at the top level, which calls `process.exit(1)` —
// uncatchable, killing the entire build. See the contract documented in
// `packages/cli/src/index.ts` on createProgram.
describe('hasCreateProgramExport', () => {
  it('returns true when source contains the createProgram factory export', () => {
    const sourceWithExport = `
import { Command } from 'commander';

export function createProgram(engine: A16nEngine | null): Command {
  const program = new Command();
  return program;
}
`;
    expect(hasCreateProgramExport(sourceWithExport)).toBe(true);
  });

  it('returns false when source uses monolithic program.parse() pattern', () => {
    const sourceWithoutExport = `
import { Command } from 'commander';

const program = new Command();
program.name('a16n');
program.parse();
`;
    expect(hasCreateProgramExport(sourceWithoutExport)).toBe(false);
  });

  it('returns false for empty source', () => {
    expect(hasCreateProgramExport('')).toBe(false);
  });
});

describe('buildCli configuration', () => {
  it('uses the correct pnpm filter name matching CLI package.json', () => {
    // Read the CLI package.json to get the actual package name
    const cliPkgPath = join(__dirname, '..', '..', 'cli', 'package.json');
    const cliPkg = JSON.parse(readFileSync(cliPkgPath, 'utf-8'));

    // Read the generate-cli-docs.ts source to find the filter name used
    const scriptPath = join(__dirname, '..', 'scripts', 'generate-cli-docs.ts');
    const scriptSource = readFileSync(scriptPath, 'utf-8');

    // Extract the pnpm filter name from the build command
    const filterMatch = scriptSource.match(/pnpm --filter (\S+) build/);
    expect(filterMatch).not.toBeNull();
    expect(filterMatch![1]).toBe(cliPkg.name);
  });
});
