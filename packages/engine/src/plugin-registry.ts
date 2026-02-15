import type { A16nPlugin } from '@a16njs/models';

/**
 * Full metadata for a registered plugin.
 * Wraps the plugin instance with registration metadata such as
 * source (bundled vs installed), registration timestamp, and
 * optional diagnostic information.
 */
export interface PluginRegistration {
  /** The plugin instance */
  plugin: A16nPlugin;
  /** Whether this plugin was bundled with the engine or installed from node_modules */
  source: 'bundled' | 'installed';
  /** When this plugin was registered */
  registeredAt: Date;
  /** Semantic version of the installed plugin (for installed plugins) */
  version?: string;
  /** Filesystem path where the plugin was installed from (for diagnostics) */
  installPath?: string;
}

/**
 * Input for registering a plugin. Omits `registeredAt` which is
 * automatically set by the registry.
 */
export type PluginRegistrationInput = Omit<PluginRegistration, 'registeredAt'>;

/**
 * Unified plugin registry that serves as the single source of truth
 * for all plugin metadata. Replaces the dual-Map pattern
 * (plugins Map + pluginSources Map) with a single registry that
 * tracks all plugin information in one place.
 *
 * @example
 * ```typescript
 * const registry = new PluginRegistry();
 * registry.register({ plugin: cursorPlugin, source: 'bundled' });
 * registry.register({ plugin: claudePlugin, source: 'installed', version: '1.0.0' });
 *
 * const cursor = registry.getPlugin('cursor');
 * const installed = registry.listBySource('installed');
 * ```
 */
export class PluginRegistry {
  private registrations: Map<string, PluginRegistration> = new Map();

  /**
   * Register a plugin with the registry.
   * If a plugin with the same ID is already registered, it will be overwritten.
   *
   * @param input - Plugin and metadata to register (registeredAt is set automatically)
   */
  register(input: PluginRegistrationInput): void {
    this.registrations.set(input.plugin.id, {
      ...input,
      registeredAt: new Date(),
    });
  }

  /**
   * Get the full registration for a plugin by its ID.
   *
   * @param id - The plugin ID to look up
   * @returns The full PluginRegistration, or undefined if not found
   */
  get(id: string): PluginRegistration | undefined {
    return this.registrations.get(id);
  }

  /**
   * Get just the plugin instance by its ID.
   * Convenience method equivalent to `registry.get(id)?.plugin`.
   *
   * @param id - The plugin ID to look up
   * @returns The A16nPlugin instance, or undefined if not found
   */
  getPlugin(id: string): A16nPlugin | undefined {
    return this.registrations.get(id)?.plugin;
  }

  /**
   * Check whether a plugin with the given ID is registered.
   *
   * @param id - The plugin ID to check
   * @returns true if the plugin is registered, false otherwise
   */
  has(id: string): boolean {
    return this.registrations.has(id);
  }

  /**
   * List all plugin registrations.
   *
   * @returns Array of all PluginRegistration objects in insertion order
   */
  list(): PluginRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * List plugin registrations filtered by source.
   *
   * @param source - The source to filter by ('bundled' or 'installed')
   * @returns Array of matching PluginRegistration objects
   */
  listBySource(source: 'bundled' | 'installed'): PluginRegistration[] {
    return this.list().filter((r) => r.source === source);
  }

  /**
   * The number of registered plugins.
   */
  get size(): number {
    return this.registrations.size;
  }

  /**
   * Remove all plugin registrations.
   */
  clear(): void {
    this.registrations.clear();
  }
}
