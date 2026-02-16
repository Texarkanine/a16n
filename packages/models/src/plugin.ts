import type { AgentCustomization, CustomizationType } from './types.js';
import type { Warning } from './warnings.js';
import type { Workspace } from './workspace.js';

/**
 * Result of discovering customizations from a project.
 */
export interface DiscoveryResult {
  /** All customization items found */
  items: AgentCustomization[];
  /** Any warnings encountered during discovery */
  warnings: Warning[];
}

/**
 * Information about a file that was written.
 */
export interface WrittenFile {
  /** Path to the written file */
  path: string;
  /** Type of customization written */
  type: CustomizationType;
  /** How many models went into this file (1 for 1:1, more if merged) */
  itemCount: number;
  /** True if this file was created fresh; false if merged/edited existing */
  isNewFile: boolean;
  /**
   * Which source AgentCustomizations contributed to this output file.
   * Optional for backwards compatibility.
   * Enables accurate git-ignore conflict detection in match mode.
   */
  sourceItems?: AgentCustomization[];
}

/**
 * Result of emitting customizations to a project.
 */
export interface EmitResult {
  /** Files that were written (or would be written in dry-run) */
  written: WrittenFile[];
  /** Any warnings encountered during emission */
  warnings: Warning[];
  /** Items that could not be represented by this plugin */
  unsupported: AgentCustomization[];
}

/**
 * Options for emitting customizations.
 */
export interface EmitOptions {
  /** If true, calculate what would be written without actually writing */
  dryRun?: boolean;
}

/**
 * Path patterns for a plugin, used by transformations like path rewriting
 * to identify and handle file references specific to this plugin's format.
 */
export interface PluginPathPatterns {
  /** Directory prefixes used by this plugin (e.g., ['.cursor/rules/', '.cursor/skills/']) */
  prefixes: string[];
  /** File extensions used by this plugin (e.g., ['.mdc', '.md']) */
  extensions: string[];
}

/**
 * The plugin interface that all a16n plugins must implement.
 * Plugins bridge between a16n's internal model and a specific tool's format.
 */
export interface A16nPlugin {
  /** Unique identifier, e.g., 'cursor', 'claude', 'codex' */
  id: string;
  /** Human-readable name */
  name: string;
  /** Which customization types this plugin supports */
  supports: CustomizationType[];
  /** Path patterns for this plugin's file format (used by transformations) */
  pathPatterns?: PluginPathPatterns;

  /**
   * Discover all agent customizations in a directory tree.
   * @param rootOrWorkspace - The root directory path or Workspace to search
   * @returns All customizations found and any warnings
   */
  discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult>;

  /**
   * Emit customization models to disk in this plugin's format.
   * @param models - The customizations to emit
   * @param rootOrWorkspace - The root directory path or Workspace to write to
   * @param options - Optional emit options (e.g., dryRun)
   * @returns Info about what was written (or would be written) and any issues
   */
  emit(models: AgentCustomization[], rootOrWorkspace: string | Workspace, options?: EmitOptions): Promise<EmitResult>;
}
