import type { AgentCustomization, CustomizationType } from './types.js';
import type { Warning } from './warnings.js';

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
}

/**
 * Result of emitting customizations to a project.
 */
export interface EmitResult {
  /** Files that were written */
  written: WrittenFile[];
  /** Any warnings encountered during emission */
  warnings: Warning[];
  /** Items that could not be represented by this plugin */
  unsupported: AgentCustomization[];
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

  /**
   * Discover all agent customizations in a directory tree.
   * @param root - The root directory to search
   * @returns All customizations found and any warnings
   */
  discover(root: string): Promise<DiscoveryResult>;

  /**
   * Emit customization models to disk in this plugin's format.
   * @param models - The customizations to emit
   * @param root - The root directory to write to
   * @returns Info about what was written and any issues
   */
  emit(models: AgentCustomization[], root: string): Promise<EmitResult>;
}
