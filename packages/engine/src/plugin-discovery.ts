import * as fs from 'fs/promises';
import { statSync } from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import type { A16nPlugin } from '@a16njs/models';

/**
 * Options for controlling where plugin discovery searches.
 */
export interface PluginDiscoveryOptions {
  /** Custom search paths to scan for plugins. If omitted, uses getDefaultSearchPaths(). */
  searchPaths?: string[];
}

/**
 * Result of a plugin discovery scan.
 */
export interface PluginDiscoveryResult {
  /** Successfully loaded and validated plugins. */
  plugins: A16nPlugin[];
  /** Packages that were found but failed to load or validate. */
  errors: PluginLoadError[];
}

/**
 * Describes a plugin package that was found but could not be loaded.
 */
export interface PluginLoadError {
  /** The npm package name (e.g. "a16n-plugin-foo"). */
  packageName: string;
  /** Human-readable description of what went wrong. */
  error: string;
}

/** Pattern used to match plugin package directory names. */
const PLUGIN_PREFIX = 'a16n-plugin-';

/**
 * Scan search paths for installed `a16n-plugin-*` packages, dynamically import
 * each one, validate its default export, and return the valid plugins along
 * with error info for any that failed.
 *
 * @param options - Optional search path overrides
 * @returns Discovered plugins and any load errors
 */
export async function discoverInstalledPlugins(
  options?: PluginDiscoveryOptions,
): Promise<PluginDiscoveryResult> {
  const searchPaths = options?.searchPaths ?? getDefaultSearchPaths();
  const plugins: A16nPlugin[] = [];
  const errors: PluginLoadError[] = [];
  const seenPluginIds = new Set<string>();

  for (const searchPath of searchPaths) {
    // Read directory entries; skip if path doesn't exist
    let entries: string[];
    try {
      entries = await fs.readdir(searchPath);
    } catch {
      // Non-existent or unreadable path — skip silently
      continue;
    }

    // Filter for directories matching the plugin naming convention
    const pluginDirs = entries.filter((name) => name.startsWith(PLUGIN_PREFIX));

    for (const dirName of pluginDirs) {
      const pkgPath = path.join(searchPath, dirName);

      try {
        // Resolve entry point from package.json main field, falling back to index.js
        const entryFile = await resolvePluginEntry(pkgPath);
        const moduleUrl = pathToFileURL(entryFile).href;
        const mod = await import(moduleUrl);

        // Extract default export (handles both `export default` and CJS interop)
        const candidate = mod.default ?? mod;

        if (isValidPlugin(candidate)) {
          if (seenPluginIds.has(candidate.id)) {
            errors.push({
              packageName: dirName,
              error: `Duplicate plugin id: ${candidate.id} — already discovered`,
            });
          } else {
            seenPluginIds.add(candidate.id);
            plugins.push(candidate);
          }
        } else {
          errors.push({
            packageName: dirName,
            error: `Invalid plugin export: missing or incorrect required fields (id, name, supports, discover, emit)`,
          });
        }
      } catch (err) {
        errors.push({
          packageName: dirName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return { plugins, errors };
}

/**
 * Resolve the JavaScript entry point for a plugin package directory.
 *
 * Reads the `main` field from the package's `package.json` if it exists,
 * otherwise falls back to `index.js` at the package root.
 *
 * @param pkgPath - Absolute path to the plugin package directory
 * @returns Absolute path to the entry JavaScript file
 */
async function resolvePluginEntry(pkgPath: string): Promise<string> {
  try {
    const raw = await fs.readFile(path.join(pkgPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    if (typeof pkg.main === 'string' && pkg.main.length > 0) {
      return path.resolve(pkgPath, pkg.main);
    }
  } catch {
    // No package.json or unreadable — fall through to default
  }
  return path.join(pkgPath, 'index.js');
}

/**
 * Type-guard that checks whether an unknown value satisfies the A16nPlugin interface.
 *
 * Validates presence and types of: id (string), name (string), supports (array),
 * discover (function), emit (function).
 *
 * @param obj - The value to check
 * @returns True if obj is a valid A16nPlugin
 */
export function isValidPlugin(obj: unknown): obj is A16nPlugin {
  if (obj == null || typeof obj !== 'object') {
    return false;
  }
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    Array.isArray(candidate.supports) &&
    typeof candidate.discover === 'function' &&
    typeof candidate.emit === 'function'
  );
}

/**
 * Compute the default search paths for plugin discovery.
 *
 * Returns paths where `a16n-plugin-*` packages might be installed:
 * - The global npm `node_modules` directory (derived from this package's location)
 * - The local `node_modules` in the current working directory
 *
 * In a global install, the engine lives inside node_modules:
 *   .../lib/node_modules/@a16njs/engine/dist/plugin-discovery.js
 * so walking up finds the node_modules parent directly.
 *
 * In a monorepo (e.g. pnpm workspace), the engine lives at:
 *   <root>/packages/engine/dist/plugin-discovery.js
 * so we also check for a node_modules child directory at each level.
 *
 * @returns Array of directory paths to scan
 */
export function getDefaultSearchPaths(): string[] {
  const paths: string[] = [];

  const thisFile = fileURLToPath(import.meta.url);
  let dir = path.dirname(thisFile);
  while (dir !== path.dirname(dir)) {
    // Global install: this file is inside a node_modules tree
    if (path.basename(dir) === 'node_modules') {
      paths.push(dir);
      break;
    }
    // Monorepo / local dev: check for a sibling node_modules directory.
    // Don't stop — keep walking up to find all ancestor node_modules
    // (e.g. packages/engine/node_modules AND root/node_modules).
    const siblingNodeModules = path.join(dir, 'node_modules');
    try {
      const stat = statSync(siblingNodeModules);
      if (stat.isDirectory()) {
        paths.push(siblingNodeModules);
      }
    } catch {
      // Directory doesn't exist, keep walking
    }
    dir = path.dirname(dir);
  }

  // Local node_modules in cwd
  const localNodeModules = path.join(process.cwd(), 'node_modules');
  if (!paths.includes(localNodeModules)) {
    paths.push(localNodeModules);
  }

  return paths;
}
