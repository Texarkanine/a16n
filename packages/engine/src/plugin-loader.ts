import type { A16nPlugin } from '@a16njs/models';
import type { PluginRegistration, PluginRegistrationInput } from './plugin-registry.js';
import { PluginRegistry } from './plugin-registry.js';
import {
  discoverInstalledPlugins,
  type PluginDiscoveryOptions,
} from './plugin-discovery.js';

/**
 * Strategy for resolving conflicts when a discovered plugin has the
 * same ID as an already-registered plugin.
 */
export enum PluginConflictStrategy {
  /** Keep the existing (bundled) plugin, skip the discovered one. This is the default and matches current behavior. */
  PREFER_BUNDLED = 'prefer-bundled',
  /** Replace the existing plugin with the discovered (installed) one. */
  PREFER_INSTALLED = 'prefer-installed',
  /** Throw an error when a conflict is detected. */
  FAIL = 'fail',
}

/**
 * Information about a plugin that was skipped during conflict resolution.
 */
export interface SkippedPlugin {
  /** The plugin that was skipped */
  plugin: A16nPlugin;
  /** Human-readable reason for skipping */
  reason: string;
  /** ID of the plugin it conflicted with */
  conflictsWith: string;
}

/**
 * Result of loading and resolving plugins.
 */
export interface PluginLoadResult {
  /** Plugins that passed conflict resolution and are ready for registration */
  loaded: PluginRegistrationInput[];
  /** Plugins that were skipped due to conflicts */
  skipped: SkippedPlugin[];
  /** Errors encountered during discovery */
  errors: Array<{ packageName: string; error: string }>;
}

/**
 * Orchestrates plugin loading by coordinating discovery and conflict
 * resolution as separate, testable phases.
 *
 * Separates three distinct concerns:
 * 1. **Discovery** - Finding plugins in node_modules (delegated to discoverInstalledPlugins)
 * 2. **Conflict Resolution** - Deciding what to do when discovered plugins conflict with existing ones
 * 3. **Registration** - Adding resolved plugins to the registry (done by the caller)
 *
 * @example
 * ```typescript
 * const loader = new PluginLoader(PluginConflictStrategy.PREFER_BUNDLED);
 * const candidates = await loader.loadInstalled({ searchPaths: ['/path/to/node_modules'] });
 * const resolved = loader.resolveConflicts(registry, candidates);
 * for (const reg of resolved.loaded) {
 *   registry.register(reg);
 * }
 * ```
 */
export class PluginLoader {
  /**
   * Create a new PluginLoader with the given conflict resolution strategy.
   *
   * @param conflictStrategy - How to handle plugin ID conflicts (default: PREFER_BUNDLED)
   */
  constructor(
    private readonly _conflictStrategy: PluginConflictStrategy = PluginConflictStrategy.PREFER_BUNDLED,
  ) {}

  /**
   * The conflict resolution strategy in use.
   */
  get conflictStrategy(): PluginConflictStrategy {
    return this._conflictStrategy;
  }

  /**
   * Discover installed plugins from node_modules and wrap them
   * as PluginRegistrationInput candidates with source='installed'.
   *
   * This is Phase 1 (Discovery) of the loading pipeline.
   *
   * @param options - Plugin discovery options (search paths, etc.)
   * @returns Load result with candidates ready for conflict resolution
   */
  async loadInstalled(options?: PluginDiscoveryOptions): Promise<PluginLoadResult> {
    const discovered = await discoverInstalledPlugins(options);

    return {
      loaded: discovered.plugins.map((plugin) => ({
        plugin,
        source: 'installed' as const,
      })),
      skipped: [],
      errors: discovered.errors,
    };
  }

  /**
   * Resolve conflicts between discovered plugin candidates and
   * already-registered plugins using the configured strategy.
   *
   * This is Phase 2 (Conflict Resolution) of the loading pipeline.
   * Pure function: does not modify the registry.
   *
   * @param existing - The current plugin registry to check for conflicts
   * @param candidates - The load result from loadInstalled()
   * @returns Resolved load result with loaded (ready to register) and skipped plugins
   */
  resolveConflicts(existing: PluginRegistry, candidates: PluginLoadResult): PluginLoadResult {
    const loaded: PluginRegistrationInput[] = [];
    const skipped: SkippedPlugin[] = [...candidates.skipped];

    for (const candidate of candidates.loaded) {
      const existingReg = existing.get(candidate.plugin.id);

      if (!existingReg) {
        loaded.push(candidate);
        continue;
      }

      switch (this._conflictStrategy) {
        case PluginConflictStrategy.PREFER_BUNDLED:
          skipped.push({
            plugin: candidate.plugin,
            reason: `Conflict: ${existingReg.source} plugin '${existingReg.plugin.id}' already registered`,
            conflictsWith: candidate.plugin.id,
          });
          break;

        case PluginConflictStrategy.PREFER_INSTALLED:
          loaded.push(candidate);
          break;

        case PluginConflictStrategy.FAIL:
          throw new Error(`Plugin conflict: '${candidate.plugin.id}' is already registered`);
      }
    }

    return {
      loaded,
      skipped,
      errors: candidates.errors,
    };
  }
}
