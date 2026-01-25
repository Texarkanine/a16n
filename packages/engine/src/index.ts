import type {
  A16nPlugin,
  AgentCustomization,
  DiscoveryResult,
  Warning,
  WrittenFile,
  CustomizationType,
} from '@a16njs/models';

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
export class A16nEngine {
  private plugins: Map<string, A16nPlugin> = new Map();

  /**
   * Create a new engine with the given plugins.
   * @param plugins - Plugins to register
   */
  constructor(plugins: A16nPlugin[] = []) {
    for (const plugin of plugins) {
      this.registerPlugin(plugin);
    }
  }

  /**
   * Register a plugin with the engine.
   * @param plugin - The plugin to register
   */
  registerPlugin(plugin: A16nPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * List all registered plugins.
   * @returns Array of plugin info
   */
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      name: p.name,
      supports: p.supports,
      source: 'bundled' as const,
    }));
  }

  /**
   * Get a plugin by its ID.
   * @param id - The plugin ID
   * @returns The plugin or undefined if not found
   */
  getPlugin(id: string): A16nPlugin | undefined {
    return this.plugins.get(id);
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

    // Discover from source
    const discovery = await sourcePlugin.discover(options.root);

    if (options.dryRun) {
      return {
        discovered: discovery.items,
        written: [],
        warnings: discovery.warnings,
        unsupported: [],
      };
    }

    // Emit to target
    const emission = await targetPlugin.emit(discovery.items, options.root);

    return {
      discovered: discovery.items,
      written: emission.written,
      warnings: [...discovery.warnings, ...emission.warnings],
      unsupported: emission.unsupported,
    };
  }
}
