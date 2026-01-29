/**
 * Generate Versioned API Documentation
 *
 * This script generates API documentation for all tagged versions of each package.
 * It reads git tags, checks out historical source code, runs TypeDoc, and creates
 * a versions.json manifest for the VersionPicker component.
 *
 * Usage: npx tsx scripts/generate-versioned-api.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync, unlinkSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

/** Package configuration for API doc generation */
interface PackageConfig {
  /** Package name without @a16njs/ prefix (e.g., 'models') */
  name: string;
  /** Relative path from repo root to package src/index.ts */
  entryPoint: string;
}

/** Version manifest structure for versions.json */
interface VersionManifest {
  [pkg: string]: string[];
}

/** Parsed git tag information */
interface ParsedTag {
  /** Full tag name (e.g., '@a16njs/models@0.2.0') */
  fullTag: string;
  /** Package name without scope (e.g., 'models') */
  packageName: string;
  /** Version string (e.g., '0.2.0') */
  version: string;
}

/**
 * Packages to generate API docs for.
 * Must match the packages in the main apidoc scripts.
 * Note: CLI tools (cli, glob-hook) are excluded - they don't export library APIs.
 */
const PACKAGES: PackageConfig[] = [
  { name: 'engine', entryPoint: 'packages/engine/src/index.ts' },
  { name: 'models', entryPoint: 'packages/models/src/index.ts' },
  { name: 'plugin-cursor', entryPoint: 'packages/plugin-cursor/src/index.ts' },
  { name: 'plugin-claude', entryPoint: 'packages/plugin-claude/src/index.ts' },
];

/**
 * Execute a shell command and return stdout.
 * @param cmd - Command to execute
 * @param cwd - Working directory (defaults to repo root)
 * @returns stdout as string
 */
function exec(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    encoding: 'utf-8',
    cwd: cwd ?? getRepoRoot(),
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Get the repository root directory.
 * @returns Absolute path to repo root
 */
function getRepoRoot(): string {
  return exec('git rev-parse --show-toplevel', process.cwd());
}

/**
 * Get the docs package directory (.generated output location).
 * @returns Absolute path to packages/docs
 */
function getDocsDir(): string {
  return join(getRepoRoot(), 'packages', 'docs');
}

/**
 * List all git tags.
 * @returns Array of tag names
 */
export function listTags(): string[] {
  const output = exec('git tag -l');
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

/**
 * Parse a git tag into package name and version.
 * Supports formats:
 * - @a16njs/models@0.2.0 → { packageName: 'models', version: '0.2.0' }
 * - a16n@0.3.0 → { packageName: 'cli', version: '0.3.0' } (CLI package)
 *
 * @param tag - Git tag string
 * @returns Parsed tag info or null if not a valid package tag
 */
export function parseTag(tag: string): ParsedTag | null {
  // Pattern: @a16njs/{package}@{version}
  const scopedMatch = tag.match(/^@a16njs\/([^@]+)@(\d+\.\d+\.\d+.*)$/);
  if (scopedMatch) {
    return {
      fullTag: tag,
      packageName: scopedMatch[1],
      version: scopedMatch[2],
    };
  }

  // Pattern: a16n@{version} (CLI package uses 'a16n' as npm name)
  const cliMatch = tag.match(/^a16n@(\d+\.\d+\.\d+.*)$/);
  if (cliMatch) {
    return {
      fullTag: tag,
      packageName: 'cli',
      version: cliMatch[1],
    };
  }

  return null;
}

/**
 * Group tags by package name.
 * @param tags - Array of git tags
 * @returns Map of package name to array of ParsedTag
 */
export function groupTagsByPackage(tags: string[]): Map<string, ParsedTag[]> {
  const groups = new Map<string, ParsedTag[]>();

  for (const tag of tags) {
    const parsed = parseTag(tag);
    if (!parsed) continue;

    const existing = groups.get(parsed.packageName) || [];
    existing.push(parsed);
    groups.set(parsed.packageName, existing);
  }

  return groups;
}

/**
 * Get the latest version for a package (highest semver).
 * @param versions - Array of version strings
 * @returns Latest version string
 */
export function getLatestVersion(versions: string[]): string {
  return versions.sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true })
  )[0];
}

/**
 * Get the commit SHA for a git tag.
 * @param tag - Git tag
 * @returns Commit SHA
 */
function getTagCommit(tag: string): string {
  return exec(`git rev-parse "${tag}"`);
}

/**
 * Paths to all workspace packages that need to be checked out together.
 * This ensures type compatibility across packages at any point in time.
 */
const WORKSPACE_PACKAGE_PATHS = [
  'packages/cli/src',
  'packages/engine/src',
  'packages/models/src',
  'packages/plugin-cursor/src',
  'packages/plugin-claude/src',
  'packages/glob-hook/src',
];

/**
 * Check out all workspace packages from a specific commit.
 * This ensures type compatibility - all packages are from the same point in time.
 * @param commit - Git commit SHA to check out from
 */
function checkoutAllPackagesFromCommit(commit: string): void {
  for (const path of WORKSPACE_PACKAGE_PATHS) {
    try {
      exec(`git checkout "${commit}" -- "${path}"`);
    } catch {
      // Some packages may not exist at older commits, that's okay
    }
  }
}

/**
 * Restore all workspace packages to HEAD.
 */
function restoreAllPackagesToHead(): void {
  for (const path of WORKSPACE_PACKAGE_PATHS) {
    try {
      exec(`git checkout HEAD -- "${path}"`);
    } catch {
      // Ignore errors (file may not have changed)
    }
  }
}

/**
 * Run TypeDoc to generate API documentation.
 * @param entryPoint - Path to entry point file (relative to repo root, e.g., "packages/cli/src/index.ts")
 * @param outputDir - Output directory for generated docs (relative to docs dir, e.g., ".generated/cli/api/0.3.0")
 * @param useVersionedConfig - If true, use typedoc.versioned.json with path mappings
 */
function runTypedoc(entryPoint: string, outputDir: string, useVersionedConfig = false): void {
  const repoRoot = getRepoRoot();
  const docsDir = getDocsDir();

  // Entry point: packages/cli/src/index.ts -> from docs: ../cli/src/index.ts
  const relativeEntryPoint = relative(docsDir, join(repoRoot, entryPoint));

  // Package tsconfig: packages/cli/tsconfig.json -> from docs: ../cli/tsconfig.json
  const packageDir = dirname(dirname(join(repoRoot, entryPoint))); // e.g., /repo/packages/cli
  const packageTsconfig = join(packageDir, 'tsconfig.json');
  const relativeTsconfig = relative(docsDir, packageTsconfig);

  // Use versioned config (with path mappings) for historical versions
  const typedocConfig = useVersionedConfig ? 'typedoc.versioned.json' : 'typedoc.json';

  // Ensure output directory exists
  mkdirSync(join(docsDir, dirname(outputDir)), { recursive: true });

  // Run TypeDoc from docs directory (where typedoc is installed)
  const cmd = `npx typedoc --options ${typedocConfig} --tsconfig "${relativeTsconfig}" --plugin typedoc-plugin-markdown --out "${outputDir}" "${relativeEntryPoint}"`;
  exec(cmd, docsDir);
}

/** Result of generating docs for a version */
interface GenerationResult {
  pkg: string;
  version: string;
  success: boolean;
  error?: string;
}

/**
 * Generate API docs for a specific version of a package.
 * Checks out ALL workspace packages from the tag's commit to ensure type compatibility.
 * @param pkg - Package configuration
 * @param tag - Parsed tag info
 * @returns Result indicating success or failure
 */
function generateForVersion(pkg: PackageConfig, tag: ParsedTag): GenerationResult {
  const outputDir = `.generated/${pkg.name}/api/${tag.version}`;
  console.log(`  Generating ${pkg.name}@${tag.version}...`);

  try {
    // Get the commit SHA for this tag
    const commit = getTagCommit(tag.fullTag);

    // Check out ALL packages from this commit for type compatibility
    checkoutAllPackagesFromCommit(commit);

    // Generate docs using versioned config with path mappings
    runTypedoc(pkg.entryPoint, outputDir, true);

    return { pkg: pkg.name, version: tag.version, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️  Failed: ${message.split('\n')[0]}`);
    return { pkg: pkg.name, version: tag.version, success: false, error: message };
  } finally {
    // Always restore ALL packages to HEAD
    restoreAllPackagesToHead();
  }
}

/**
 * Create a symlink for 'latest' pointing to the latest version.
 * @param pkgName - Package name
 * @param latestVersion - Version to link to
 */
function createLatestSymlink(pkgName: string, latestVersion: string): void {
  const docsDir = getDocsDir();
  const apiDir = join(docsDir, '.generated', pkgName, 'api');
  const latestLink = join(apiDir, 'latest');
  const targetDir = join(apiDir, latestVersion);

  // Remove existing symlink if present
  if (existsSync(latestLink)) {
    rmSync(latestLink, { recursive: true });
  }

  // Create symlink (relative path)
  symlinkSync(latestVersion, latestLink);
  console.log(`  Created symlink: latest -> ${latestVersion}`);
}

/**
 * Generate the versions.json manifest file.
 * Outputs to static/versions.json so Docusaurus serves it at /versions.json.
 * @param tagGroups - Map of package name to tags
 */
function generateVersionsManifest(tagGroups: Map<string, ParsedTag[]>): void {
  const manifest: VersionManifest = {};

  for (const [pkgName, tags] of tagGroups) {
    // Sort versions descending (latest first)
    const versions = tags
      .map((t) => t.version)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    manifest[pkgName] = versions;
  }

  // Output to static/ so Docusaurus serves it at /versions.json
  const outputPath = join(getDocsDir(), 'static', 'versions.json');
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Generated versions.json with ${tagGroups.size} packages`);
}

/**
 * Main entry point for versioned API generation.
 * @param dryRun - If true, only show what would be done
 */
export async function main(dryRun = false): Promise<void> {
  console.log('Generating versioned API documentation...\n');

  // Get all tags
  const tags = listTags();
  console.log(`Found ${tags.length} git tags`);

  // Group by package
  const tagGroups = groupTagsByPackage(tags);
  console.log(`Found tags for ${tagGroups.size} packages\n`);

  if (dryRun) {
    console.log('DRY RUN - would generate:');
    for (const [pkgName, pkgTags] of tagGroups) {
      console.log(`  ${pkgName}:`);
      for (const tag of pkgTags) {
        console.log(`    - ${tag.version}`);
      }
    }
    return;
  }

  // Track all results
  const results: GenerationResult[] = [];

  // Generate docs for each package version
  for (const pkg of PACKAGES) {
    const pkgTags = tagGroups.get(pkg.name);
    if (!pkgTags || pkgTags.length === 0) {
      console.log(`Skipping ${pkg.name}: no tags found`);
      continue;
    }

    console.log(`\nProcessing ${pkg.name} (${pkgTags.length} versions):`);

    for (const tag of pkgTags) {
      const result = generateForVersion(pkg, tag);
      results.push(result);
    }
  }

  // Generate versions manifest (only include successful versions)
  console.log('\n');
  const successfulTagGroups = new Map<string, ParsedTag[]>();
  for (const result of results.filter((r) => r.success)) {
    const existing = successfulTagGroups.get(result.pkg) || [];
    existing.push({
      fullTag: `@a16njs/${result.pkg}@${result.version}`,
      packageName: result.pkg,
      version: result.version,
    });
    successfulTagGroups.set(result.pkg, existing);
  }
  generateVersionsManifest(successfulTagGroups);

  // Post-process TypeDoc-generated files
  console.log('Post-processing TypeDoc files...');
  try {
    const docsDir = getDocsDir();
    
    // Determine latest version for each package
    const latestVersions = new Map<string, string>();
    for (const pkg of PACKAGES) {
      const pkgTags = tagGroups.get(pkg.name);
      if (!pkgTags || pkgTags.length === 0) continue;
      
      const versions = pkgTags.map(t => t.version);
      const latest = getLatestVersion(versions);
      latestVersions.set(pkg.name, latest);
    }
    
    // Process each versioned directory
    for (const pkg of PACKAGES) {
      const pkgTags = tagGroups.get(pkg.name);
      if (!pkgTags || pkgTags.length === 0) continue;
      
      const latestVersion = latestVersions.get(pkg.name);
      
      for (const tag of pkgTags) {
        const versionDir = join(docsDir, '.generated', pkg.name, 'api', tag.version);
        const readmePath = join(versionDir, 'README.md');
        const indexPath = join(versionDir, 'index.md');
        
        if (existsSync(readmePath)) {
          // Read README content
          const content = readFileSync(readmePath, 'utf-8');
          
          // Add frontmatter with proper title and slug
          const frontmatter = `---
title: ${tag.version}
slug: /${pkg.name}/api/${tag.version}
---

`;
          const newContent = frontmatter + content;
          
          // Write as index.md with frontmatter
          writeFileSync(indexPath, newContent);
          unlinkSync(readmePath);
          
          // Fix links in this version's files to point to version root
          exec(`find "${versionDir}" -type f -name "*.md" -exec sed -i 's|](../README.md)|](../)|g' {} +`, docsDir);
        }
      }
    }
    
    // Remove top-level README.md files (they conflict with wrapper pages)
    exec('find .generated -type f -name "README.md" -path "*/api/README.md" -delete', getDocsDir());
    
    console.log('Post-processing complete');
  } catch (err) {
    console.warn('Warning: Could not post-process files:', err instanceof Error ? err.message : err);
  }

  // Report summary
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  console.log('\n=== Summary ===');
  console.log(`✅ Successful: ${successes.length}`);
  if (failures.length > 0) {
    console.log(`⚠️  Failed: ${failures.length}`);
    for (const f of failures) {
      console.log(`   - ${f.pkg}@${f.version}`);
    }
    console.log('\nNote: Failed versions may have dependency mismatches with current code.');
  }

  console.log('\nVersioned API generation complete!');
}

// Run if executed directly
if (process.argv[1]?.endsWith('generate-versioned-api.ts')) {
  const dryRun = process.argv.includes('--dry-run');
  main(dryRun).catch((err) => {
    console.error('Error generating versioned API docs:', err);
    process.exit(1);
  });
}
