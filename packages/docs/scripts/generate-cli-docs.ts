/**
 * Generate CLI Documentation
 *
 * This script extracts command information from Commander.js programs
 * and generates markdown documentation for CLI tools.
 *
 * Usage: npx tsx scripts/generate-cli-docs.ts
 *
 * The script supports two modes:
 * 1. Standalone: Generates docs for the current CLI source
 * 2. Versioned: Called from generate-versioned-api.ts for each tag
 */

import { Command, Option, Argument } from 'commander';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

/** Information about a CLI option */
export interface OptionInfo {
  /** Option flags (e.g., '-f, --from <agent>') */
  flags: string;
  /** Option description */
  description: string;
  /** Default value if any */
  defaultValue?: string;
  /** Whether the option is required */
  required: boolean;
}

/** Information about a CLI argument */
export interface ArgumentInfo {
  /** Argument name including brackets (e.g., '<input>' or '[output]') */
  name: string;
  /** Argument description */
  description: string;
  /** Whether the argument is required */
  required: boolean;
  /** Default value if any */
  defaultValue?: string;
}

/** Complete information about a CLI command */
export interface CommandInfo {
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command options */
  options: OptionInfo[];
  /** Command arguments */
  arguments: ArgumentInfo[];
}

/**
 * Extract information from a Commander.js command.
 *
 * @param cmd - Commander Command instance
 * @returns Extracted command information
 */
export function extractCommandInfo(cmd: Command): CommandInfo {
  const options: OptionInfo[] = [];
  const args: ArgumentInfo[] = [];

  // Extract options
  // Commander stores options in a private _options array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmdOptions = (cmd as any).options as Option[];
  for (const opt of cmdOptions) {
    options.push({
      flags: opt.flags,
      description: opt.description,
      defaultValue: opt.defaultValue !== undefined ? String(opt.defaultValue) : undefined,
      required: opt.mandatory,
    });
  }

  // Extract arguments
  // Commander stores arguments in registeredArguments array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmdArgs = (cmd as any).registeredArguments as Argument[] | undefined;
  if (cmdArgs) {
    for (const arg of cmdArgs) {
      const isRequired = arg.required;
      const name = isRequired ? `<${arg.name()}>` : `[${arg.name()}]`;
      args.push({
        name,
        description: arg.description,
        required: isRequired,
        defaultValue: arg.defaultValue !== undefined ? String(arg.defaultValue) : undefined,
      });
    }
  }

  return {
    name: cmd.name(),
    description: cmd.description(),
    options,
    arguments: args,
  };
}

/**
 * Generate markdown documentation for a single command.
 *
 * @param info - Command information
 * @returns Markdown string
 */
export function generateCommandMarkdown(info: CommandInfo): string {
  const lines: string[] = [];

  // Command header
  lines.push(`## ${info.name}`);
  lines.push('');
  lines.push(info.description);
  lines.push('');

  // Arguments section
  if (info.arguments.length > 0) {
    lines.push('### Arguments');
    lines.push('');
    for (const arg of info.arguments) {
      let line = `- \`${arg.name}\` - ${arg.description}`;
      if (arg.defaultValue !== undefined) {
        line += ` (Default: \`${arg.defaultValue}\`)`;
      }
      lines.push(line);
    }
    lines.push('');
  }

  // Options section
  if (info.options.length > 0) {
    lines.push('### Options');
    lines.push('');
    for (const opt of info.options) {
      let line = `- \`${opt.flags}\``;
      if (opt.required) {
        line += ' **(required)**';
      }
      line += ` - ${opt.description}`;
      if (opt.defaultValue !== undefined) {
        line += ` (Default: \`${opt.defaultValue}\`)`;
      }
      lines.push(line);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate full CLI reference documentation from a Commander program.
 *
 * @param program - Commander program instance
 * @param version - CLI version for frontmatter
 * @returns Complete markdown document with frontmatter
 */
export function generateCliReference(program: Command, version: string): string {
  const lines: string[] = [];

  // Frontmatter
  // Slug must be URL-safe (no spaces)
  const slug = version.replace(/\s+/g, '-').replace(/[()]/g, '');
  lines.push('---');
  lines.push(`title: ${version}`);
  lines.push(`slug: /cli/reference/${slug}`);
  lines.push('---');
  lines.push('');

  // Title
  lines.push('# CLI Reference');
  lines.push('');
  lines.push(program.description());
  lines.push('');

  // Get subcommands (excluding 'help')
  const commands = program.commands.filter((cmd) => cmd.name() !== 'help');

  if (commands.length > 0) {
    // Generate docs for each subcommand
    for (const cmd of commands) {
      const info = extractCommandInfo(cmd);
      lines.push(generateCommandMarkdown(info));
    }
  } else {
    // Program has no subcommands, document the program itself
    const info = extractCommandInfo(program);
    // Remove the redundant header since we already have CLI Reference
    const md = generateCommandMarkdown(info);
    // Skip the first two lines (## name and empty line)
    const mdLines = md.split('\n').slice(3);
    lines.push(...mdLines);
  }

  return lines.join('\n');
}

// ============================================================================
// Execution Logic (for standalone use and integration with versioned pipeline)
// ============================================================================

/**
 * Execute a shell command and return stdout.
 * @param cmd - Command to execute
 * @param cwd - Working directory
 * @returns stdout as string
 */
function exec(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    encoding: 'utf-8',
    cwd: cwd ?? process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Get the repository root directory.
 * @returns Absolute path to repo root
 */
function getRepoRoot(): string {
  return exec('git rev-parse --show-toplevel');
}

/**
 * Get the docs package directory.
 * @returns Absolute path to packages/docs
 */
function getDocsDir(): string {
  return join(getRepoRoot(), 'packages', 'docs');
}

/**
 * Build the CLI package to generate dist files.
 * Required for dynamic import.
 */
function buildCli(): void {
  const repoRoot = getRepoRoot();
  exec('pnpm --filter @a16njs/cli build', repoRoot);
}

/**
 * Get the CLI program by dynamically importing the built CLI.
 * Note: This imports the actual CLI which sets up Commander, but we
 * need to access the program before .parse() is called.
 *
 * Since the CLI calls program.parse() at module load, we need a different
 * approach - we'll create a mock program by reading the source and
 * extracting the structure.
 */
async function getCliProgram(): Promise<Command> {
  const repoRoot = getRepoRoot();
  const cliSrcPath = join(repoRoot, 'packages', 'cli', 'src', 'index.ts');

  if (!existsSync(cliSrcPath)) {
    throw new Error(`CLI source not found at ${cliSrcPath}`);
  }

  // Read CLI source to extract version
  const cliSource = readFileSync(cliSrcPath, 'utf-8');

  // Extract version from source (look for .version() call)
  const versionMatch = cliSource.match(/\.version\(['"]([^'"]+)['"]\)/);
  const version = versionMatch?.[1] ?? 'unknown';

  // Build the program structure by parsing the source
  // This is a simplified approach - we'll construct the program manually
  // based on the known structure of our CLI
  const program = new Command('a16n')
    .description('Agent customization portability for AI coding tools')
    .version(version);

  // Parse the convert command
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
    .option(
      '--delete-source',
      'Delete source files after successful conversion (skipped sources are preserved)'
    )
    .argument('[path]', 'Project path', '.');

  // Parse the discover command
  program
    .command('discover')
    .description('List agent customization without converting')
    .requiredOption('-f, --from <agent>', 'Agent to discover')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed output')
    .argument('[path]', 'Project path', '.');

  // Parse the plugins command
  program
    .command('plugins')
    .description('Show available plugins');

  return program;
}

/**
 * Read CLI version from package.json.
 * @returns Version string
 */
function getCliVersion(): string {
  const repoRoot = getRepoRoot();
  const pkgPath = join(repoRoot, 'packages', 'cli', 'package.json');

  if (!existsSync(pkgPath)) {
    throw new Error(`CLI package.json not found at ${pkgPath}`);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

/**
 * Generate CLI docs for current source and write to output directory.
 *
 * @param outputDir - Output directory (relative to docs dir)
 * @param version - Version string for frontmatter (defaults to package.json version)
 */
export async function generateCliDocsForVersion(
  outputDir: string,
  version?: string
): Promise<void> {
  const docsDir = getDocsDir();
  const actualVersion = version ?? getCliVersion();

  console.log(`Generating CLI docs for version ${actualVersion}...`);

  // Get CLI program structure
  const program = await getCliProgram();

  // Generate markdown
  const markdown = generateCliReference(program, actualVersion);

  // Ensure output directory exists
  const fullOutputDir = join(docsDir, outputDir);
  mkdirSync(fullOutputDir, { recursive: true });

  // Write index.md
  const outputPath = join(fullOutputDir, 'index.md');
  writeFileSync(outputPath, markdown);

  console.log(`  Wrote ${outputPath}`);
}

/**
 * Generate CLI docs for "current" (unreleased) version.
 */
export async function generateCurrentCliDocs(): Promise<void> {
  await generateCliDocsForVersion('.generated/cli/reference/current', 'current (unreleased)');
}

/**
 * Main entry point for standalone CLI doc generation.
 */
export async function main(): Promise<void> {
  console.log('Generating CLI documentation...\n');

  try {
    await generateCurrentCliDocs();
    console.log('\nCLI documentation generation complete!');
  } catch (err) {
    console.error('Error generating CLI docs:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.endsWith('generate-cli-docs.ts')) {
  main();
}
