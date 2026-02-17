import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  discoverInstalledPlugins,
  isValidPlugin,
  getDefaultSearchPaths,
  getGlobalNodeModulesFromArgv1,
} from '../src/plugin-discovery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '.temp-discovery-test');

/**
 * Helper: create a fake ESM plugin package under a node_modules-like directory.
 * The package will have a package.json and an index.js that default-exports the plugin object.
 */
async function createFakePlugin(
  searchPath: string,
  packageName: string,
  pluginExport: Record<string, unknown>,
): Promise<void> {
  const pkgDir = path.join(searchPath, packageName);
  await fs.mkdir(pkgDir, { recursive: true });
  await fs.writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, type: 'module', main: 'index.js' }),
  );
  // Create ESM index.js that default-exports the plugin object
  await fs.writeFile(
    path.join(pkgDir, 'index.js'),
    `export default ${JSON.stringify(pluginExport)};`,
  );
}

/**
 * Helper: create a fake plugin that exports functions (can't JSON.stringify functions,
 * so we write the JS source directly).
 */
async function createFakePluginWithSource(
  searchPath: string,
  packageName: string,
  jsSource: string,
): Promise<void> {
  const pkgDir = path.join(searchPath, packageName);
  await fs.mkdir(pkgDir, { recursive: true });
  await fs.writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, type: 'module', main: 'index.js' }),
  );
  await fs.writeFile(path.join(pkgDir, 'index.js'), jsSource);
}

const VALID_PLUGIN_SOURCE = `
export default {
  id: 'test-plugin',
  name: 'Test Plugin',
  supports: ['global-prompt'],
  discover: async () => ({ items: [], warnings: [] }),
  emit: async () => ({ written: [], warnings: [], unsupported: [] }),
};
`;

describe('discoverInstalledPlugins', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should discover a16n-plugin-* packages in a given search path', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    await createFakePluginWithSource(searchPath, 'a16n-plugin-foo', VALID_PLUGIN_SOURCE);

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.id).toBe('test-plugin');
    expect(result.errors).toHaveLength(0);
  });

  it('should skip packages that do not match the a16n-plugin-* naming pattern', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    // Create a non-matching package
    await createFakePluginWithSource(searchPath, 'some-other-package', VALID_PLUGIN_SOURCE);
    // Create a matching package
    await createFakePluginWithSource(searchPath, 'a16n-plugin-bar', VALID_PLUGIN_SOURCE);

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should skip packages with invalid default exports (missing required fields)', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    // Create a package with invalid export (missing discover/emit functions)
    await createFakePlugin(searchPath, 'a16n-plugin-invalid', {
      id: 'invalid',
      name: 'Invalid Plugin',
      // missing supports, discover, emit
    });

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.packageName).toBe('a16n-plugin-invalid');
    expect(result.errors[0]?.error).toMatch(/invalid/i);
  });

  it('should return empty arrays when no plugins found', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    // Empty directory — no packages at all

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle non-existent search paths gracefully', async () => {
    const result = await discoverInstalledPlugins({
      searchPaths: [path.join(tempDir, 'does-not-exist')],
    });

    expect(result.plugins).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should extract plugin from ESM default export', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    await createFakePluginWithSource(
      searchPath,
      'a16n-plugin-esm',
      `
const plugin = {
  id: 'esm-test',
  name: 'ESM Test Plugin',
  supports: ['file-rule'],
  discover: async (root) => ({ items: [], warnings: [] }),
  emit: async (models, root) => ({ written: [], warnings: [], unsupported: [] }),
};
export default plugin;
      `,
    );

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.id).toBe('esm-test');
    expect(result.plugins[0]?.name).toBe('ESM Test Plugin');
  });

  it('should resolve entry point from package.json main field', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });

    // Create a plugin with main pointing to dist/index.js (like real packages)
    const pkgDir = path.join(searchPath, 'a16n-plugin-dist');
    const distDir = path.join(pkgDir, 'dist');
    await fs.mkdir(distDir, { recursive: true });
    await fs.writeFile(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name: 'a16n-plugin-dist', type: 'module', main: './dist/index.js' }),
    );
    await fs.writeFile(
      path.join(distDir, 'index.js'),
      `export default {
        id: 'dist-test',
        name: 'Dist Test Plugin',
        supports: ['global-prompt'],
        discover: async () => ({ items: [], warnings: [] }),
        emit: async () => ({ written: [], warnings: [], unsupported: [] }),
      };`,
    );

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.id).toBe('dist-test');
  });

  it('should fall back to index.js when package.json has no main field', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });

    const pkgDir = path.join(searchPath, 'a16n-plugin-nomain');
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name: 'a16n-plugin-nomain', type: 'module' }),
    );
    await fs.writeFile(
      path.join(pkgDir, 'index.js'),
      `export default {
        id: 'nomain-test',
        name: 'No Main Plugin',
        supports: ['global-prompt'],
        discover: async () => ({ items: [], warnings: [] }),
        emit: async () => ({ written: [], warnings: [], unsupported: [] }),
      };`,
    );

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.id).toBe('nomain-test');
  });

  it('should fall back to index.js when no package.json exists', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    await createFakePluginWithSource(searchPath, 'a16n-plugin-nopkg', VALID_PLUGIN_SOURCE);
    // Remove the package.json that createFakePluginWithSource created
    await fs.rm(path.join(searchPath, 'a16n-plugin-nopkg', 'package.json'));

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.id).toBe('test-plugin');
  });

  it('should handle packages that fail to import and report them as errors', async () => {
    const searchPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(searchPath, { recursive: true });
    // Create a package with syntax error
    await createFakePluginWithSource(
      searchPath,
      'a16n-plugin-broken',
      'this is not valid javascript }{}{',
    );

    const result = await discoverInstalledPlugins({ searchPaths: [searchPath] });

    expect(result.plugins).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.packageName).toBe('a16n-plugin-broken');
    expect(result.errors[0]?.error).toBeTruthy();
  });

  it('should discover multiple valid plugins across multiple search paths', async () => {
    const searchPath1 = path.join(tempDir, 'global_modules');
    const searchPath2 = path.join(tempDir, 'local_modules');
    await fs.mkdir(searchPath1, { recursive: true });
    await fs.mkdir(searchPath2, { recursive: true });

    await createFakePluginWithSource(
      searchPath1,
      'a16n-plugin-alpha',
      `export default {
        id: 'alpha', name: 'Alpha', supports: ['global-prompt'],
        discover: async () => ({ items: [], warnings: [] }),
        emit: async () => ({ written: [], warnings: [], unsupported: [] }),
      };`,
    );
    await createFakePluginWithSource(
      searchPath2,
      'a16n-plugin-beta',
      `export default {
        id: 'beta', name: 'Beta', supports: ['file-rule'],
        discover: async () => ({ items: [], warnings: [] }),
        emit: async () => ({ written: [], warnings: [], unsupported: [] }),
      };`,
    );

    const result = await discoverInstalledPlugins({
      searchPaths: [searchPath1, searchPath2],
    });

    expect(result.plugins).toHaveLength(2);
    const ids = result.plugins.map((p) => p.id).sort();
    expect(ids).toEqual(['alpha', 'beta']);
  });
});

describe('isValidPlugin', () => {
  it('should return true for objects with all required plugin fields', () => {
    const valid = {
      id: 'test',
      name: 'Test',
      supports: ['global-prompt'],
      discover: async () => ({ items: [], warnings: [] }),
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };
    expect(isValidPlugin(valid)).toBe(true);
  });

  it('should return false for null/undefined', () => {
    expect(isValidPlugin(null)).toBe(false);
    expect(isValidPlugin(undefined)).toBe(false);
  });

  it('should return false when id is missing or not a string', () => {
    const noId = {
      name: 'Test',
      supports: [],
      discover: async () => ({ items: [], warnings: [] }),
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };
    expect(isValidPlugin(noId)).toBe(false);

    const numericId = { ...noId, id: 42 };
    expect(isValidPlugin(numericId)).toBe(false);
  });

  it('should return false when name is missing or not a string', () => {
    const noName = {
      id: 'test',
      supports: [],
      discover: async () => ({ items: [], warnings: [] }),
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };
    expect(isValidPlugin(noName)).toBe(false);
  });

  it('should return false when supports is missing or not an array', () => {
    const noSupports = {
      id: 'test',
      name: 'Test',
      discover: async () => ({ items: [], warnings: [] }),
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };
    expect(isValidPlugin(noSupports)).toBe(false);

    const stringSupports = { ...noSupports, supports: 'global-prompt' };
    expect(isValidPlugin(stringSupports)).toBe(false);
  });

  it('should return false when discover is missing or not a function', () => {
    const noDiscover = {
      id: 'test',
      name: 'Test',
      supports: [],
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };
    expect(isValidPlugin(noDiscover)).toBe(false);

    const stringDiscover = { ...noDiscover, discover: 'not a function' };
    expect(isValidPlugin(stringDiscover)).toBe(false);
  });

  it('should return false when emit is missing or not a function', () => {
    const noEmit = {
      id: 'test',
      name: 'Test',
      supports: [],
      discover: async () => ({ items: [], warnings: [] }),
    };
    expect(isValidPlugin(noEmit)).toBe(false);

    const stringEmit = { ...noEmit, emit: 'not a function' };
    expect(isValidPlugin(stringEmit)).toBe(false);
  });
});

describe('getDefaultSearchPaths', () => {
  it('should return an array of strings', () => {
    const paths = getDefaultSearchPaths();
    expect(Array.isArray(paths)).toBe(true);
    for (const p of paths) {
      expect(typeof p).toBe('string');
    }
  });

  it('should include a path containing node_modules', () => {
    const paths = getDefaultSearchPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.some((p) => p.includes('node_modules'))).toBe(true);
  });

  it('should include argv1-derived global node_modules when running from a bin/ directory', async () => {
    // Create a fake PREFIX/bin/a16n and PREFIX/lib/node_modules structure
    const fakePrefix = path.join(tempDir, 'fake-prefix');
    await fs.mkdir(path.join(fakePrefix, 'bin'), { recursive: true });
    await fs.mkdir(path.join(fakePrefix, 'lib', 'node_modules'), { recursive: true });

    const originalArgv1 = process.argv[1];
    try {
      process.argv[1] = path.join(fakePrefix, 'bin', 'a16n');
      const paths = getDefaultSearchPaths();
      expect(paths).toContain(path.join(fakePrefix, 'lib', 'node_modules'));
    } finally {
      process.argv[1] = originalArgv1;
    }
  });

  it('should not add duplicate paths when argv1-derived path already found via walk-up', () => {
    // When argv1 points to a bin/ that resolves to a node_modules already
    // found by the walk-up, the path should not appear twice
    const paths = getDefaultSearchPaths();
    const uniquePaths = [...new Set(paths)];
    expect(paths).toEqual(uniquePaths);
  });
});

describe('getGlobalNodeModulesFromArgv1', () => {
  let originalArgv1: string | undefined;

  beforeEach(async () => {
    originalArgv1 = process.argv[1];
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    process.argv[1] = originalArgv1!;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return PREFIX/lib/node_modules when argv1 is in a bin/ directory (Unix)', async () => {
    const fakePrefix = path.join(tempDir, 'nvm-prefix');
    await fs.mkdir(path.join(fakePrefix, 'bin'), { recursive: true });
    await fs.mkdir(path.join(fakePrefix, 'lib', 'node_modules'), { recursive: true });

    process.argv[1] = path.join(fakePrefix, 'bin', 'a16n');
    expect(getGlobalNodeModulesFromArgv1()).toBe(path.join(fakePrefix, 'lib', 'node_modules'));
  });

  it('should fall back to PREFIX/node_modules when PREFIX/lib/node_modules does not exist', async () => {
    const fakePrefix = path.join(tempDir, 'win-prefix');
    await fs.mkdir(path.join(fakePrefix, 'bin'), { recursive: true });
    await fs.mkdir(path.join(fakePrefix, 'node_modules'), { recursive: true });

    process.argv[1] = path.join(fakePrefix, 'bin', 'a16n');
    expect(getGlobalNodeModulesFromArgv1()).toBe(path.join(fakePrefix, 'node_modules'));
  });

  it('should return null when argv1 is not in a bin/ directory', () => {
    process.argv[1] = path.join(tempDir, 'some', 'random', 'script.js');
    expect(getGlobalNodeModulesFromArgv1()).toBeNull();
  });

  it('should return null when process.argv[1] is undefined', () => {
    process.argv[1] = undefined as unknown as string;
    expect(getGlobalNodeModulesFromArgv1()).toBeNull();
  });

  it('should return null when neither PREFIX/lib/node_modules nor PREFIX/node_modules exist', async () => {
    const fakePrefix = path.join(tempDir, 'empty-prefix');
    await fs.mkdir(path.join(fakePrefix, 'bin'), { recursive: true });
    // No node_modules created

    process.argv[1] = path.join(fakePrefix, 'bin', 'a16n');
    expect(getGlobalNodeModulesFromArgv1()).toBeNull();
  });
});
