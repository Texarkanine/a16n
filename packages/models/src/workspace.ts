/**
 * A directory entry returned by workspace readdir.
 */
export interface WorkspaceEntry {
  /** The entry name (not full path) */
  name: string;
  /** Whether this entry is a file */
  isFile: boolean;
  /** Whether this entry is a directory */
  isDirectory: boolean;
}

/**
 * Abstraction over file operations, enabling local filesystem,
 * read-only (dry-run), and in-memory (testing) workspaces.
 *
 * All paths passed to workspace methods are relative to the workspace root.
 * Implementations must handle path resolution internally.
 *
 * @example
 * ```typescript
 * // Local filesystem workspace
 * const ws = new LocalWorkspace('source', '/project');
 * const content = await ws.read('.cursor/rules/my-rule.mdc');
 *
 * // In-memory workspace for testing
 * const mem = new MemoryWorkspace('test');
 * await mem.write('file.md', '# Hello');
 * const exists = await mem.exists('file.md'); // true
 *
 * // Read-only wrapper for dry-run
 * const readOnly = new ReadOnlyWorkspace(ws);
 * await readOnly.write('file.md', 'content'); // throws!
 * ```
 */
export interface Workspace {
  /** Unique identifier for this workspace */
  readonly id: string;

  /** The root path of the workspace (for path resolution and display) */
  readonly root: string;

  /**
   * Resolve a relative path within this workspace to an absolute path.
   * @param relativePath - Path relative to workspace root
   * @returns Absolute path
   */
  resolve(relativePath: string): string;

  /**
   * Check if a path exists in this workspace.
   * @param relativePath - Path relative to workspace root
   * @returns true if the path exists
   */
  exists(relativePath: string): Promise<boolean>;

  /**
   * Read a file from this workspace.
   * @param relativePath - Path relative to workspace root
   * @returns File content as UTF-8 string
   * @throws If the file does not exist
   */
  read(relativePath: string): Promise<string>;

  /**
   * Write a file to this workspace.
   * Creates parent directories as needed.
   * @param relativePath - Path relative to workspace root
   * @param content - File content as UTF-8 string
   * @throws If the workspace is read-only
   */
  write(relativePath: string, content: string): Promise<void>;

  /**
   * List entries in a directory.
   * @param relativePath - Path relative to workspace root
   * @returns Array of directory entries
   * @throws If the directory does not exist
   */
  readdir(relativePath: string): Promise<WorkspaceEntry[]>;

  /**
   * Create a directory (and any missing parents).
   * @param relativePath - Path relative to workspace root
   */
  mkdir(relativePath: string): Promise<void>;
}

/**
 * Helper to extract the root path from a string or Workspace argument.
 * Useful for plugins migrating to Workspace support.
 *
 * @param rootOrWorkspace - A string root path or Workspace instance
 * @returns The root path string
 */
export function resolveRoot(rootOrWorkspace: string | Workspace): string {
  return typeof rootOrWorkspace === 'string' ? rootOrWorkspace : rootOrWorkspace.root;
}
