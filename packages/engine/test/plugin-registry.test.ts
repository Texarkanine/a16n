import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '../src/plugin-registry.js';
import type { PluginRegistration } from '../src/plugin-registry.js';
import { CustomizationType } from '@a16njs/models';
import type { A16nPlugin } from '@a16njs/models';

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

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('should register a plugin with bundled source', () => {
      const plugin = createFakePlugin({ id: 'cursor', name: 'Cursor IDE' });
      registry.register({ plugin, source: 'bundled' });

      const registration = registry.get('cursor');
      expect(registration).toBeDefined();
      expect(registration!.plugin).toBe(plugin);
      expect(registration!.source).toBe('bundled');
    });

    it('should register a plugin with installed source', () => {
      const plugin = createFakePlugin({ id: 'external', name: 'External Plugin' });
      registry.register({ plugin, source: 'installed' });

      const registration = registry.get('external');
      expect(registration).toBeDefined();
      expect(registration!.source).toBe('installed');
    });

    it('should set registeredAt timestamp on registration', () => {
      const before = new Date();
      const plugin = createFakePlugin();
      registry.register({ plugin, source: 'bundled' });
      const after = new Date();

      const registration = registry.get('test-plugin');
      expect(registration).toBeDefined();
      expect(registration!.registeredAt).toBeInstanceOf(Date);
      expect(registration!.registeredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(registration!.registeredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should store optional version metadata', () => {
      const plugin = createFakePlugin({ id: 'versioned' });
      registry.register({ plugin, source: 'installed', version: '2.1.0' });

      const registration = registry.get('versioned');
      expect(registration).toBeDefined();
      expect(registration!.version).toBe('2.1.0');
    });

    it('should store optional installPath metadata', () => {
      const plugin = createFakePlugin({ id: 'pathed' });
      registry.register({
        plugin,
        source: 'installed',
        installPath: '/node_modules/a16n-plugin-pathed',
      });

      const registration = registry.get('pathed');
      expect(registration).toBeDefined();
      expect(registration!.installPath).toBe('/node_modules/a16n-plugin-pathed');
    });

    it('should overwrite existing registration with same ID', () => {
      const pluginV1 = createFakePlugin({ id: 'overwrite-me', name: 'Version 1' });
      const pluginV2 = createFakePlugin({ id: 'overwrite-me', name: 'Version 2' });

      registry.register({ plugin: pluginV1, source: 'bundled' });
      registry.register({ plugin: pluginV2, source: 'installed' });

      const registration = registry.get('overwrite-me');
      expect(registration).toBeDefined();
      expect(registration!.plugin.name).toBe('Version 2');
      expect(registration!.source).toBe('installed');
      expect(registry.size).toBe(1);
    });
  });

  describe('get', () => {
    it('should return the full registration for a known ID', () => {
      const plugin = createFakePlugin({ id: 'known' });
      registry.register({ plugin, source: 'bundled', version: '1.0.0' });

      const registration = registry.get('known');
      expect(registration).toBeDefined();
      expect(registration!.plugin).toBe(plugin);
      expect(registration!.source).toBe('bundled');
      expect(registration!.version).toBe('1.0.0');
      expect(registration!.registeredAt).toBeInstanceOf(Date);
    });

    it('should return undefined for an unknown ID', () => {
      const result = registry.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getPlugin', () => {
    it('should return the plugin instance for a known ID', () => {
      const plugin = createFakePlugin({ id: 'direct' });
      registry.register({ plugin, source: 'bundled' });

      const result = registry.getPlugin('direct');
      expect(result).toBe(plugin);
    });

    it('should return undefined for an unknown ID', () => {
      const result = registry.getPlugin('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for a registered plugin ID', () => {
      const plugin = createFakePlugin({ id: 'present' });
      registry.register({ plugin, source: 'bundled' });

      expect(registry.has('present')).toBe(true);
    });

    it('should return false for an unregistered plugin ID', () => {
      expect(registry.has('absent')).toBe(false);
    });
  });

  describe('list', () => {
    it('should return an empty array when no plugins are registered', () => {
      expect(registry.list()).toEqual([]);
    });

    it('should return all registrations', () => {
      const pluginA = createFakePlugin({ id: 'a', name: 'Plugin A' });
      const pluginB = createFakePlugin({ id: 'b', name: 'Plugin B' });

      registry.register({ plugin: pluginA, source: 'bundled' });
      registry.register({ plugin: pluginB, source: 'installed' });

      const all = registry.list();
      expect(all).toHaveLength(2);
      expect(all.map((r) => r.plugin.id)).toContain('a');
      expect(all.map((r) => r.plugin.id)).toContain('b');
    });

    it('should return registrations in insertion order', () => {
      const pluginA = createFakePlugin({ id: 'first' });
      const pluginB = createFakePlugin({ id: 'second' });
      const pluginC = createFakePlugin({ id: 'third' });

      registry.register({ plugin: pluginA, source: 'bundled' });
      registry.register({ plugin: pluginB, source: 'bundled' });
      registry.register({ plugin: pluginC, source: 'bundled' });

      const ids = registry.list().map((r) => r.plugin.id);
      expect(ids).toEqual(['first', 'second', 'third']);
    });
  });

  describe('listBySource', () => {
    it('should return only bundled plugins when filtering by bundled', () => {
      const bundled = createFakePlugin({ id: 'bundled-one' });
      const installed = createFakePlugin({ id: 'installed-one' });

      registry.register({ plugin: bundled, source: 'bundled' });
      registry.register({ plugin: installed, source: 'installed' });

      const result = registry.listBySource('bundled');
      expect(result).toHaveLength(1);
      expect(result[0]!.plugin.id).toBe('bundled-one');
      expect(result[0]!.source).toBe('bundled');
    });

    it('should return only installed plugins when filtering by installed', () => {
      const bundled = createFakePlugin({ id: 'bundled-two' });
      const installed = createFakePlugin({ id: 'installed-two' });

      registry.register({ plugin: bundled, source: 'bundled' });
      registry.register({ plugin: installed, source: 'installed' });

      const result = registry.listBySource('installed');
      expect(result).toHaveLength(1);
      expect(result[0]!.plugin.id).toBe('installed-two');
      expect(result[0]!.source).toBe('installed');
    });

    it('should return empty array when no plugins match the source filter', () => {
      const plugin = createFakePlugin({ id: 'bundled-only' });
      registry.register({ plugin, source: 'bundled' });

      const result = registry.listBySource('installed');
      expect(result).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return 0 for an empty registry', () => {
      expect(registry.size).toBe(0);
    });

    it('should return the number of registered plugins', () => {
      registry.register({ plugin: createFakePlugin({ id: 'one' }), source: 'bundled' });
      registry.register({ plugin: createFakePlugin({ id: 'two' }), source: 'installed' });
      registry.register({ plugin: createFakePlugin({ id: 'three' }), source: 'bundled' });

      expect(registry.size).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all registrations', () => {
      registry.register({ plugin: createFakePlugin({ id: 'doomed-a' }), source: 'bundled' });
      registry.register({ plugin: createFakePlugin({ id: 'doomed-b' }), source: 'installed' });

      expect(registry.size).toBe(2);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.list()).toEqual([]);
      expect(registry.has('doomed-a')).toBe(false);
      expect(registry.has('doomed-b')).toBe(false);
      expect(registry.get('doomed-a')).toBeUndefined();
    });
  });
});
