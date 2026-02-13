import * as fs from 'fs/promises';
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
        // Dynamic import using file:// URL (required for absolute paths in ESM)
        const entryFile = path.join(pkgPath, 'index.js');
        const moduleUrl = pathToFileURL(entryFile).href;
        const mod = await import(moduleUrl);

        // Extract default export (handles both `export default` and CJS interop)
        const candidate = mod.default ?? mod;

        if (isValidPlugin(candidate)) {
          plugins.push(candidate);
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
 * @returns Array of directory paths to scan
 */
export function getDefaultSearchPaths(): string[] {
  const paths: string[] = [];

  // Walk up from this file's location to find the nearest node_modules parent.
  // In a typical global install: .../lib/node_modules/@a16njs/engine/dist/plugin-discovery.js
  // We want: .../lib/node_modules
  const thisFile = fileURLToPath(import.meta.url);
  let dir = path.dirname(thisFile);
  while (dir !== path.dirname(dir)) {
    if (path.basename(dir) === 'node_modules') {
      paths.push(dir);
      break;
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
