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
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
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

  // Extract options (skip hidden options marked with .hideHelp())
  // Commander stores options in a private _options array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmdOptions = (cmd as any).options as Option[];
  for (const opt of cmdOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((opt as any).hidden) continue;
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

/**
 * Check whether a CLI source string exports the `createProgram` factory.
 *
 * Tagged CLI versions that predate the factory export have a monolithic
 * `program.parse()` at module level. Dynamically importing such a module
 * triggers Commander to parse `process.argv` and call `process.exit(1)`,
 * which cannot be caught by try/catch — it kills the entire Node process.
 * This function lets callers detect the old pattern and skip straight to
 * a fallback page without building or importing.
 *
 * The contract for the CLI's `createProgram` export is documented in
 * `packages/cli/src/index.ts`. If the export is renamed or removed,
 * this regex will no longer match, and all CLI versions will degrade
 * to fallback pages.
 *
 * @param source - TypeScript/JavaScript source text
 * @returns true if the source exports createProgram
 */
export function hasCreateProgramExport(source: string): boolean {
  return /export\s+function\s+createProgram/.test(source);
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
  exec('pnpm --filter a16n build', repoRoot);
}

/**
 * Get the CLI program by dynamically importing the built CLI.
 *
 * Builds the CLI package, then imports the compiled dist and calls
 * createProgram(null) to get the Commander program structure without
 * executing any actions. If the CLI version predates the createProgram
 * export, throws so the caller can fall back to a placeholder page.
 */
async function getCliProgram(): Promise<Command> {
  const repoRoot = getRepoRoot();
  const cliDistDir = join(repoRoot, 'packages', 'cli', 'dist');

  // Check if the checked-out source exports createProgram before building.
  // Tagged versions that predate the factory export have a monolithic
  // program.parse() at module level. Importing such a module triggers
  // process.exit(1) which cannot be caught, crashing the entire build.
  const cliSourcePath = join(repoRoot, 'packages', 'cli', 'src', 'index.ts');
  if (existsSync(cliSourcePath)) {
    const source = readFileSync(cliSourcePath, 'utf-8');
    if (!hasCreateProgramExport(source)) {
      throw new Error('CLI source does not export createProgram — version predates factory export');
    }
  }

  // Remove stale dist to prevent previous version's build from leaking through
  rmSync(cliDistDir, { recursive: true, force: true });

  buildCli();

  const cliDistPath = join(cliDistDir, 'index.js');

  if (!existsSync(cliDistPath)) {
    throw new Error(`CLI dist not found at ${cliDistPath} — build may have failed`);
  }

  // Dynamic import with cache-busting query to avoid stale module cache
  // when generating docs for multiple versions in sequence
  const mod = await import(`${cliDistPath}?t=${Date.now()}`);

  if (typeof mod.createProgram !== 'function') {
    throw new Error('createProgram not found — CLI version predates factory export');
  }

  // null engine — actions are never invoked during doc generation
  return mod.createProgram(null);
}

/**
 * Generate a fallback documentation page for versions where the CLI
 * predates the createProgram() factory export.
 *
 * The fallback page appears in the version picker and pagination chain
 * but directs users to run --help locally instead of showing auto-generated
 * command reference.
 *
 * @param version - Version string (e.g., '0.5.0')
 * @returns Markdown string with frontmatter
 */
export function generateFallbackPage(version: string): string {
  const slug = version.replace(/\s+/g, '-').replace(/[()]/g, '');
  return `---
title: ${version}
slug: /cli/reference/${slug}
---

# CLI Reference — ${version}

Auto-generated reference is not available for this version.

To view the full command reference, run:

\`\`\`bash
npx a16n@${version} --help
\`\`\`
`;
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

  let markdown: string;

  try {
    // Get CLI program structure via dynamic import
    const program = await getCliProgram();
    markdown = generateCliReference(program, actualVersion);
  } catch (err) {
    // Fallback for versions that predate the createProgram() export
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️  Dynamic import failed: ${message.split('\n')[0]}`);
    console.warn(`  ⚠️  Writing fallback page for ${actualVersion}`);
    markdown = generateFallbackPage(actualVersion);
  }

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
