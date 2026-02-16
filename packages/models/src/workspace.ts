import * as fs from 'node:fs/promises';
import * as path from 'node:path';

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

/**
 * Workspace backed by the local filesystem.
 *
 * All operations delegate to Node.js fs/promises.
 *
 * @example
 * ```typescript
 * const ws = new LocalWorkspace('source', '/project');
 * const content = await ws.read('.cursor/rules/my-rule.mdc');
 * await ws.write('.claude/rules/my-rule.md', content);
 * ```
 */
export class LocalWorkspace implements Workspace {
  /**
   * Create a new LocalWorkspace.
   * @param id - Unique identifier for this workspace
   * @param root - Absolute path to the workspace root directory
   */
  constructor(
    public readonly id: string,
    public readonly root: string,
  ) {}

  resolve(relativePath: string): string {
    if (relativePath === '') return this.root;
    return path.join(this.root, relativePath);
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async read(relativePath: string): Promise<string> {
    return fs.readFile(this.resolve(relativePath), 'utf-8');
  }

  async write(relativePath: string, content: string): Promise<void> {
    const fullPath = this.resolve(relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async readdir(relativePath: string): Promise<WorkspaceEntry[]> {
    const dirents = await fs.readdir(this.resolve(relativePath), { withFileTypes: true });
    return dirents.map((d) => ({
      name: d.name,
      isFile: d.isFile(),
      isDirectory: d.isDirectory(),
    }));
  }

  async mkdir(relativePath: string): Promise<void> {
    await fs.mkdir(this.resolve(relativePath), { recursive: true });
  }
}

/**
 * Convert a string root path or Workspace instance to a Workspace.
 * If given a string, wraps it in a LocalWorkspace with the given id.
 * If given a Workspace, returns it unchanged.
 *
 * @param rootOrWorkspace - A string root path or Workspace instance
 * @param id - Workspace id to use when wrapping a string (default: 'default')
 * @returns A Workspace instance
 */
export function toWorkspace(rootOrWorkspace: string | Workspace, id: string = 'default'): Workspace {
  if (typeof rootOrWorkspace === 'string') {
    return new LocalWorkspace(id, rootOrWorkspace);
  }
  return rootOrWorkspace;
}
