import type {
  A16nPlugin,
  AgentCustomization,
  DiscoveryResult,
  Warning,
  WrittenFile,
  CustomizationType,
  Workspace,
} from '@a16njs/models';
import { type PluginDiscoveryOptions } from './plugin-discovery.js';
import { PluginRegistry } from './plugin-registry.js';
import { PluginLoader, PluginConflictStrategy } from './plugin-loader.js';
import { LocalWorkspace } from './workspace.js';
import {
  type ContentTransformation,
  type TransformationContext,
  PathRewritingTransformation,
} from './transformation.js';

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
  /** Workspace for source discovery (takes precedence over sourceRoot/root) */
  sourceWorkspace?: Workspace;
  /** Workspace for target emission (takes precedence over targetRoot/root) */
  targetWorkspace?: Workspace;
  /**
   * If true, rewrite path references in content during conversion.
   * @deprecated Use `transformations: [new PathRewritingTransformation()]` instead.
   */
  rewritePathRefs?: boolean;
  /** Content transformations to apply between discovery and emission */
  transformations?: ContentTransformation[];
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
   * @param rootOrWorkspace - The project root path or Workspace to scan
   * @returns Discovery result with items and warnings
   */
  async discover(pluginId: string, rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginId}`);
    }
    const workspace = typeof rootOrWorkspace === 'string'
      ? new LocalWorkspace('discover', rootOrWorkspace)
      : rootOrWorkspace;
    return plugin.discover(workspace);
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

    // Resolve source and target roots/workspaces
    // Priority: explicit workspace > explicit root override > default root
    const discoverRoot = options.sourceRoot ?? options.root;
    const emitRoot = options.targetRoot ?? options.root;

    const sourceWorkspace = options.sourceWorkspace
      ?? new LocalWorkspace('source', discoverRoot);
    const targetWorkspace = options.targetWorkspace
      ?? new LocalWorkspace('target', emitRoot);

    // Discover from source using workspace
    const discovery = await sourcePlugin.discover(sourceWorkspace);

    // Collect warnings
    const warnings: Warning[] = [...discovery.warnings];

    // Build transformations list
    const transformations: ContentTransformation[] = options.transformations
      ? [...options.transformations]
      : [];

    // Backward compatibility: rewritePathRefs maps to PathRewritingTransformation
    if (options.rewritePathRefs && !transformations.some((t) => t.id === 'path-rewriting')) {
      transformations.push(new PathRewritingTransformation());
    }

    // Apply transformation pipeline
    let itemsToEmit = discovery.items;

    if (transformations.length > 0) {
      for (const transformation of transformations) {
        const transformContext: TransformationContext = {
          items: itemsToEmit,
          sourcePlugin,
          targetPlugin,
          sourceRoot: sourceWorkspace.root,
          targetRoot: targetWorkspace.root,
          trialEmit: (items) =>
            targetPlugin.emit(items, targetWorkspace, { dryRun: true }),
        };

        const result = await transformation.transform(transformContext);
        itemsToEmit = result.items;
        warnings.push(...result.warnings);
      }
    }

    // Single emission at the end using workspace
    const emission = await targetPlugin.emit(itemsToEmit, targetWorkspace, {
      dryRun: options.dryRun,
    });

    warnings.push(...emission.warnings);

    return {
      discovered: discovery.items,
      written: emission.written,
      warnings,
      unsupported: emission.unsupported,
    };
  }
}
