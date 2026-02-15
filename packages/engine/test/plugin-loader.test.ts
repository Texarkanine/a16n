import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  PluginLoader,
  PluginConflictStrategy,
  type PluginLoadResult,
} from '../src/plugin-loader.js';
import { PluginRegistry } from '../src/plugin-registry.js';
import { CustomizationType } from '@a16njs/models';
import type { A16nPlugin } from '@a16njs/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '.temp-loader-test');

/**
 * Helper to create a minimal fake plugin for testing.
 */
function createFakePlugin(overrides: Partial<A16nPlugin> = {}): A16nPlugin {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    supports: [CustomizationType.GlobalPrompt],
    discover: async () => ({ items: [], warnings: [] }),
    emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    ...overrides,
  };
}

/**
 * Helper: create a fake ESM plugin package on disk for discovery.
 */
async function createFakePluginOnDisk(
  searchPath: string,
  packageName: string,
  pluginId: string,
  pluginName: string,
): Promise<void> {
  const pkgDir = path.join(searchPath, packageName);
  await fs.mkdir(pkgDir, { recursive: true });
  await fs.writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, type: 'module', main: 'index.js' }),
  );
  await fs.writeFile(
    path.join(pkgDir, 'index.js'),
    `export default {
      id: '${pluginId}',
      name: '${pluginName}',
      supports: ['global-prompt'],
      discover: async () => ({ items: [], warnings: [] }),
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };`,
  );
}

describe('PluginLoader', () => {
  describe('constructor', () => {
    it('should default to PREFER_BUNDLED strategy', () => {
      const loader = new PluginLoader();
      expect(loader.conflictStrategy).toBe(PluginConflictStrategy.PREFER_BUNDLED);
    });

    it('should accept a custom conflict strategy', () => {
      const loader = new PluginLoader(PluginConflictStrategy.PREFER_INSTALLED);
      expect(loader.conflictStrategy).toBe(PluginConflictStrategy.PREFER_INSTALLED);
    });
  });

  describe('loadInstalled', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should discover plugins and wrap them as installed PluginRegistrationInput', async () => {
      // Creates a fake plugin on disk and verifies loadInstalled returns
      // it wrapped with source='installed'
      const searchPath = path.join(tempDir, 'node_modules');
      await createFakePluginOnDisk(searchPath, 'a16n-plugin-disco', 'disco', 'Disco Plugin');

      const loader = new PluginLoader();
      const result = await loader.loadInstalled({ searchPaths: [searchPath] });

      expect(result.loaded).toHaveLength(1);
      expect(result.loaded[0]!.plugin.id).toBe('disco');
      expect(result.loaded[0]!.source).toBe('installed');
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass through discovery errors', async () => {
      // Creates a broken plugin on disk and verifies the error is propagated
      const searchPath = path.join(tempDir, 'node_modules');
      const pkgDir = path.join(searchPath, 'a16n-plugin-broken');
      await fs.mkdir(pkgDir, { recursive: true });
      await fs.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: 'a16n-plugin-broken', type: 'module', main: 'index.js' }),
      );
      await fs.writeFile(path.join(pkgDir, 'index.js'), 'invalid javascript }{}{');

      const loader = new PluginLoader();
      const result = await loader.loadInstalled({ searchPaths: [searchPath] });

      expect(result.loaded).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.packageName).toBe('a16n-plugin-broken');
    });

    it('should return empty result when no plugins found', async () => {
      // Empty search path - no plugins
      const searchPath = path.join(tempDir, 'node_modules');
      await fs.mkdir(searchPath, { recursive: true });

      const loader = new PluginLoader();
      const result = await loader.loadInstalled({ searchPaths: [searchPath] });

      expect(result.loaded).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('resolveConflicts', () => {
    let registry: PluginRegistry;

    beforeEach(() => {
      registry = new PluginRegistry();
    });

    it('should pass through all candidates when no conflicts exist', () => {
      // Registry has plugin 'a', candidates have plugin 'b' — no conflict
      registry.register({ plugin: createFakePlugin({ id: 'a' }), source: 'bundled' });

      const candidates: PluginLoadResult = {
        loaded: [{ plugin: createFakePlugin({ id: 'b', name: 'B Plugin' }), source: 'installed' }],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader(PluginConflictStrategy.PREFER_BUNDLED);
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(1);
      expect(result.loaded[0]!.plugin.id).toBe('b');
      expect(result.skipped).toHaveLength(0);
    });

    it('should skip installed plugin when PREFER_BUNDLED and bundled exists', () => {
      // Registry has bundled 'cursor', candidate has installed 'cursor'
      registry.register({
        plugin: createFakePlugin({ id: 'cursor', name: 'Bundled Cursor' }),
        source: 'bundled',
      });

      const candidates: PluginLoadResult = {
        loaded: [
          {
            plugin: createFakePlugin({ id: 'cursor', name: 'Installed Cursor' }),
            source: 'installed',
          },
        ],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader(PluginConflictStrategy.PREFER_BUNDLED);
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]!.plugin.id).toBe('cursor');
      expect(result.skipped[0]!.reason).toContain('bundled');
      expect(result.skipped[0]!.conflictsWith).toBe('cursor');
    });

    it('should replace existing when PREFER_INSTALLED and conflict exists', () => {
      // Registry has bundled 'cursor', candidate has installed 'cursor'
      // With PREFER_INSTALLED, the installed one should be loaded
      registry.register({
        plugin: createFakePlugin({ id: 'cursor', name: 'Bundled Cursor' }),
        source: 'bundled',
      });

      const candidates: PluginLoadResult = {
        loaded: [
          {
            plugin: createFakePlugin({ id: 'cursor', name: 'Installed Cursor' }),
            source: 'installed',
          },
        ],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader(PluginConflictStrategy.PREFER_INSTALLED);
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(1);
      expect(result.loaded[0]!.plugin.name).toBe('Installed Cursor');
      expect(result.skipped).toHaveLength(0);
    });

    it('should throw when FAIL strategy and conflict exists', () => {
      // Registry has 'cursor', candidate has 'cursor' — should throw
      registry.register({
        plugin: createFakePlugin({ id: 'cursor' }),
        source: 'bundled',
      });

      const candidates: PluginLoadResult = {
        loaded: [
          { plugin: createFakePlugin({ id: 'cursor' }), source: 'installed' },
        ],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader(PluginConflictStrategy.FAIL);

      expect(() => loader.resolveConflicts(registry, candidates)).toThrow(
        /Plugin conflict.*cursor/,
      );
    });

    it('should handle mixed conflicts and non-conflicts', () => {
      // Registry has bundled 'cursor', candidates have 'cursor' (conflict) and 'new-plugin' (no conflict)
      registry.register({
        plugin: createFakePlugin({ id: 'cursor' }),
        source: 'bundled',
      });

      const candidates: PluginLoadResult = {
        loaded: [
          { plugin: createFakePlugin({ id: 'cursor', name: 'Installed Cursor' }), source: 'installed' },
          { plugin: createFakePlugin({ id: 'new-plugin', name: 'New Plugin' }), source: 'installed' },
        ],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader(PluginConflictStrategy.PREFER_BUNDLED);
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(1);
      expect(result.loaded[0]!.plugin.id).toBe('new-plugin');
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]!.plugin.id).toBe('cursor');
    });

    it('should preserve errors from candidates', () => {
      // Errors from discovery should pass through conflict resolution unchanged
      const candidates: PluginLoadResult = {
        loaded: [{ plugin: createFakePlugin({ id: 'good' }), source: 'installed' }],
        skipped: [],
        errors: [{ packageName: 'a16n-plugin-bad', error: 'Syntax error' }],
      };

      const loader = new PluginLoader();
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.packageName).toBe('a16n-plugin-bad');
    });

    it('should preserve existing skipped entries from candidates', () => {
      // If candidates already have skipped entries (e.g. from a previous resolution),
      // they should be preserved
      const candidates: PluginLoadResult = {
        loaded: [{ plugin: createFakePlugin({ id: 'good' }), source: 'installed' }],
        skipped: [
          {
            plugin: createFakePlugin({ id: 'prev-skipped' }),
            reason: 'Previously skipped',
            conflictsWith: 'something',
          },
        ],
        errors: [],
      };

      const loader = new PluginLoader();
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(1);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]!.plugin.id).toBe('prev-skipped');
    });

    it('should handle empty candidates', () => {
      // No candidates at all
      const candidates: PluginLoadResult = {
        loaded: [],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader();
      const result = loader.resolveConflicts(registry, candidates);

      expect(result.loaded).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip installed plugin when PREFER_BUNDLED and existing is also installed', () => {
      // Even when existing is 'installed', PREFER_BUNDLED means "prefer existing"
      registry.register({
        plugin: createFakePlugin({ id: 'dup', name: 'First Installed' }),
        source: 'installed',
      });

      const candidates: PluginLoadResult = {
        loaded: [
          { plugin: createFakePlugin({ id: 'dup', name: 'Second Installed' }), source: 'installed' },
        ],
        skipped: [],
        errors: [],
      };

      const loader = new PluginLoader(PluginConflictStrategy.PREFER_BUNDLED);
      const result = loader.resolveConflicts(registry, candidates);

      // PREFER_BUNDLED means "don't replace existing", regardless of existing source
      expect(result.loaded).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
    });
  });
});
