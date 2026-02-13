import type {
  A16nPlugin,
  AgentCustomization,
  DiscoveryResult,
  Warning,
  WrittenFile,
  CustomizationType,
} from '@a16njs/models';
import { buildMapping, rewriteContent, detectOrphans } from './path-rewriter.js';
import {
  discoverInstalledPlugins,
  type PluginDiscoveryOptions,
  type PluginLoadError,
} from './plugin-discovery.js';

/**
 * Well-known directory prefixes and file extensions for each plugin.
 * Used by detectOrphans() to identify source-format path references.
 */
const PLUGIN_PATH_PATTERNS: Record<string, { prefixes: string[]; extensions: string[] }> = {
  cursor: {
    prefixes: ['.cursor/rules/', '.cursor/skills/', '.cursor/commands/'],
    extensions: ['.mdc', '.md'],
  },
  claude: {
    prefixes: ['.claude/rules/', '.claude/skills/'],
    extensions: ['.md'],
  },
  a16n: {
    prefixes: ['.a16n/'],
    extensions: ['.md', '.json'],
  },
};

/**
 * Options for a conversion operation.
 */
export interface ConversionOptions {
  /** Source plugin ID */
  source: string;
  /** Target plugin ID */
  target: string;
  /** Project root directory (used as default for both source and target) */
  root: string;
  /** If true, only discover without writing */
  dryRun?: boolean;
  /**
   * Override root directory for discovery (reading).
   * When set, discover() uses this instead of `root`.
   */
  sourceRoot?: string;
  /**
   * Override root directory for emission (writing).
   * When set, emit() uses this instead of `root`.
   */
  targetRoot?: string;
  /**
   * If true, rewrite file path references in content so they point
   * to the target-format paths instead of source-format paths.
   */
  rewritePathRefs?: boolean;
}

/**
 * Git-ignore change information.
 */
export interface GitIgnoreResult {
  /** The file that was modified */
  file: string;
  /** Entries that were added */
  added: string[];
}

/**
 * Result of a conversion operation.
 */
export interface ConversionResult {
  /** Items discovered from source */
  discovered: AgentCustomization[];
  /** Files written to target */
  written: WrittenFile[];
  /** Warnings from discovery and emission */
  warnings: Warning[];
  /** Items that couldn't be represented by target */
  unsupported: AgentCustomization[];
  /** Git-ignore changes made (if --gitignore-output-with was used) */
  gitIgnoreChanges?: GitIgnoreResult[];
  /** Source files that were deleted (if --delete-source was used) */
  deletedSources?: string[];
}

/**
 * Information about a registered plugin.
 */
export interface PluginInfo {
  id: string;
  name: string;
  supports: CustomizationType[];
  source: 'bundled' | 'installed';
}

/**
 * The a16n conversion engine.
 * Orchestrates plugins to discover and emit agent customizations.
 */
/**
 * Result of a plugin auto-discovery operation.
 */
export interface DiscoverAndRegisterResult {
  /** IDs of plugins that were successfully registered. */
  registered: string[];
  /** IDs of plugins that were skipped because a bundled plugin with the same ID exists. */
  skipped: string[];
  /** Packages that were found but failed to load or validate. */
  errors: PluginLoadError[];
}

export class A16nEngine {
  private plugins: Map<string, { plugin: A16nPlugin; source: 'bundled' | 'installed' }> =
    new Map();

  /**
   * Create a new engine with the given plugins.
   * @param plugins - Plugins to register (source defaults to 'bundled')
   */
  constructor(plugins: A16nPlugin[] = []) {
    for (const plugin of plugins) {
      this.registerPlugin(plugin);
    }
  }

  /**
   * Register a plugin with the engine.
   * @param plugin - The plugin to register
   * @param source - Where the plugin came from (defaults to 'bundled')
   */
  registerPlugin(plugin: A16nPlugin, source: 'bundled' | 'installed' = 'bundled'): void {
    this.plugins.set(plugin.id, { plugin, source });
  }

  /**
   * List all registered plugins.
   * @returns Array of plugin info
   */
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map((entry) => ({
      id: entry.plugin.id,
      name: entry.plugin.name,
      supports: entry.plugin.supports,
      source: entry.source,
    }));
  }

  /**
   * Get a plugin by its ID.
   * @param id - The plugin ID
   * @returns The plugin or undefined if not found
   */
  getPlugin(id: string): A16nPlugin | undefined {
    return this.plugins.get(id)?.plugin;
  }

  /**
   * Scan for installed `a16n-plugin-*` packages and register any that don't
   * conflict with already-registered (bundled) plugins.
   *
   * @param options - Optional search path overrides
   * @returns Summary of registered, skipped, and errored plugins
   */
  async discoverAndRegisterPlugins(
    options?: PluginDiscoveryOptions,
  ): Promise<DiscoverAndRegisterResult> {
    const result = await discoverInstalledPlugins(options);
    const registered: string[] = [];
    const skipped: string[] = [];

    for (const plugin of result.plugins) {
      if (this.plugins.has(plugin.id)) {
        skipped.push(plugin.id);
      } else {
        this.registerPlugin(plugin, 'installed');
        registered.push(plugin.id);
      }
    }

    return { registered, skipped, errors: result.errors };
  }

  /**
   * Discover customizations using a specific plugin.
   * @param pluginId - The plugin to use for discovery
   * @param root - The project root to scan
   * @returns Discovery result with items and warnings
   */
  async discover(pluginId: string, root: string): Promise<DiscoveryResult> {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginId}`);
    }
    return plugin.discover(root);
  }

  /**
   * Convert customizations from one format to another.
   * @param options - Conversion options
   * @returns Conversion result with discovered items, written files, and warnings
   */
  async convert(options: ConversionOptions): Promise<ConversionResult> {
    const sourcePlugin = this.getPlugin(options.source);
    const targetPlugin = this.getPlugin(options.target);

    if (!sourcePlugin) {
      throw new Error(`Unknown source: ${options.source}`);
    }
    if (!targetPlugin) {
      throw new Error(`Unknown target: ${options.target}`);
    }

    // Resolve split roots: sourceRoot for discover, targetRoot for emit
    const effectiveSourceRoot = options.sourceRoot ?? options.root;
    const effectiveTargetRoot = options.targetRoot ?? options.root;

    // Discover from source
    const discovery = await sourcePlugin.discover(effectiveSourceRoot);

    const allWarnings: Warning[] = [...discovery.warnings];

    if (options.rewritePathRefs && discovery.items.length > 0) {
      // Two-pass emit approach:
      // Pass 1: Dry-run emit to get target paths for building the mapping
      const dryEmission = await targetPlugin.emit(discovery.items, effectiveTargetRoot, {
        dryRun: true,
      });
      allWarnings.push(...dryEmission.warnings);

      // Build source→target path mapping from the dry-run results
      const mapping = buildMapping(
        discovery.items,
        dryEmission.written,
        effectiveSourceRoot,
        effectiveTargetRoot,
      );

      // Rewrite content in discovered items
      const rewriteResult = rewriteContent(discovery.items, mapping);

      // Detect orphan references
      const sourcePatterns = PLUGIN_PATH_PATTERNS[options.source];
      if (sourcePatterns) {
        const orphanWarnings = detectOrphans(
          rewriteResult.items,
          mapping,
          sourcePatterns.prefixes,
          sourcePatterns.extensions,
        );
        allWarnings.push(...orphanWarnings);
      }

      // Pass 2: Real emit with rewritten items
      const emission = await targetPlugin.emit(rewriteResult.items, effectiveTargetRoot, {
        dryRun: options.dryRun,
      });
      // Deduplicate: add only emission warnings not already present from dry-run
      const existingMessages = new Set(allWarnings.map((w) => w.message));
      for (const w of emission.warnings) {
        if (!existingMessages.has(w.message)) {
          allWarnings.push(w);
        }
      }

      return {
        discovered: discovery.items,
        written: emission.written,
        warnings: allWarnings,
        unsupported: emission.unsupported,
      };
    }

    // Standard single-pass emit (no rewriting)
    const emission = await targetPlugin.emit(discovery.items, effectiveTargetRoot, {
      dryRun: options.dryRun,
    });

    return {
      discovered: discovery.items,
      written: emission.written,
      warnings: [...allWarnings, ...emission.warnings],
      unsupported: emission.unsupported,
    };
  }
}

// Re-export discovery types for consumers
export type { PluginDiscoveryOptions, PluginDiscoveryResult, PluginLoadError } from './plugin-discovery.js';
export { discoverInstalledPlugins, isValidPlugin, getDefaultSearchPaths } from './plugin-discovery.js';
