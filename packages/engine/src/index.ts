import type {
  A16nPlugin,
  AgentCustomization,
  DiscoveryResult,
  Warning,
  WrittenFile,
  CustomizationType,
} from '@a16njs/models';
import { type PluginDiscoveryOptions } from './plugin-discovery.js';
import { buildMapping, rewriteContent, detectOrphans } from './path-rewriter.js';
import { PluginRegistry } from './plugin-registry.js';
import { PluginLoader, PluginConflictStrategy } from './plugin-loader.js';

/**
 * Options for a conversion operation.
 */
export interface ConversionOptions {
  /** Source plugin ID */
  source: string;
  /** Target plugin ID */
  target: string;
  /** Project root directory */
  root: string;
  /** If true, only discover without writing */
  dryRun?: boolean;
  /** Override root for discovery (source plugin) */
  sourceRoot?: string;
  /** Override root for emission (target plugin) */
  targetRoot?: string;
  /** If true, rewrite path references in content during conversion */
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
 * Result of discovering and registering plugins.
 */
export interface DiscoverAndRegisterResult {
  /** Plugin IDs that were successfully registered */
  registered: string[];
  /** Plugin IDs that were skipped (already registered) */
  skipped: string[];
  /** Errors encountered during discovery */
  errors: Array<{ packageName: string; error: string }>;
}

/**
 * The a16n conversion engine.
 * Orchestrates plugins to discover and emit agent customizations.
 */
export class A16nEngine {
  private registry: PluginRegistry = new PluginRegistry();
  private loader: PluginLoader;

  /**
   * Create a new engine with the given plugins.
   * @param plugins - Plugins to register (registered as 'bundled')
   */
  constructor(plugins: A16nPlugin[] = []) {
    this.loader = new PluginLoader(PluginConflictStrategy.PREFER_BUNDLED);
    for (const plugin of plugins) {
      this.registerPlugin(plugin, 'bundled');
    }
  }

  /**
   * Register a plugin with the engine.
   * @param plugin - The plugin to register
   * @param source - Whether the plugin is bundled or installed
   */
  registerPlugin(plugin: A16nPlugin, source: 'bundled' | 'installed' = 'bundled'): void {
    this.registry.register({ plugin, source });
  }

  /**
   * Discover and register installed plugins from node_modules.
   * @param options - Plugin discovery options
   * @returns Result with registered, skipped, and error info
   */
  async discoverAndRegisterPlugins(
    options?: PluginDiscoveryOptions,
  ): Promise<DiscoverAndRegisterResult> {
    const candidates = await this.loader.loadInstalled(options);
    const resolved = this.loader.resolveConflicts(this.registry, candidates);

    const registered: string[] = [];
    for (const reg of resolved.loaded) {
      this.registry.register(reg);
      registered.push(reg.plugin.id);
    }

    return {
      registered,
      skipped: resolved.skipped.map((s) => s.plugin.id),
      errors: resolved.errors,
    };
  }

  /**
   * List all registered plugins.
   * @returns Array of plugin info
   */
  listPlugins(): PluginInfo[] {
    return this.registry.list().map((r) => ({
      id: r.plugin.id,
      name: r.plugin.name,
      supports: r.plugin.supports,
      source: r.source,
    }));
  }

  /**
   * Get a plugin by its ID.
   * @param id - The plugin ID
   * @returns The plugin or undefined if not found
   */
  getPlugin(id: string): A16nPlugin | undefined {
    return this.registry.getPlugin(id);
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

    // Use sourceRoot for discovery if provided, otherwise use root
    const discoverRoot = options.sourceRoot ?? options.root;
    // Use targetRoot for emission if provided, otherwise use root
    const emitRoot = options.targetRoot ?? options.root;

    // Discover from source
    const discovery = await sourcePlugin.discover(discoverRoot);

    // Collect warnings
    const warnings: Warning[] = [...discovery.warnings];

    // Determine items to emit (may be rewritten if rewritePathRefs is true)
    let itemsToEmit = discovery.items;

    // Emit to target (pass dryRun to calculate what would be written)
    const emission = await targetPlugin.emit(itemsToEmit, emitRoot, {
      dryRun: options.dryRun,
    });

    warnings.push(...emission.warnings);

    // If path rewriting is enabled, rewrite paths in the content
    if (options.rewritePathRefs && emission.written.length > 0) {
      // Build mapping from source paths to target paths
      const mapping = buildMapping(
        discovery.items,
        emission.written,
        discoverRoot,
        emitRoot,
      );

      // Rewrite content using the mapping
      const rewriteResult = rewriteContent(discovery.items, mapping);
      itemsToEmit = rewriteResult.items;

      // Detect orphan path references (paths that weren't converted)
      // For cursor plugin, we look for .cursor/rules/ and .cursor/skills/ paths
      // For claude plugin, we look for .claude/rules/ and .claude/skills/ paths
      let sourcePluginPrefixes: string[] = [];
      let sourceExtensions: string[] = [];

      if (options.source === 'cursor') {
        sourcePluginPrefixes = ['.cursor/rules/', '.cursor/skills/'];
        sourceExtensions = ['.mdc', '.md'];
      } else if (options.source === 'claude') {
        sourcePluginPrefixes = ['.claude/rules/', '.claude/skills/'];
        sourceExtensions = ['.md'];
      }

      const orphanWarnings = detectOrphans(
        itemsToEmit,
        mapping,
        sourcePluginPrefixes,
        sourceExtensions,
      );
      warnings.push(...orphanWarnings);

      // Re-emit with rewritten content
      const rewrittenEmission = await targetPlugin.emit(itemsToEmit, emitRoot, {
        dryRun: options.dryRun,
      });

      return {
        discovered: discovery.items,
        written: rewrittenEmission.written,
        warnings,
        unsupported: rewrittenEmission.unsupported,
      };
    }

    return {
      discovered: discovery.items,
      written: emission.written,
      warnings,
      unsupported: emission.unsupported,
    };
  }
}
