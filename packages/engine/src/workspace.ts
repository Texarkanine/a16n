import * as fs from 'fs/promises';
import * as path from 'path';

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
 * Read-only wrapper around another workspace.
 * Allows read operations but throws on any write operation.
 * Useful for dry-run scenarios.
 *
 * @example
 * ```typescript
 * const ws = new LocalWorkspace('source', '/project');
 * const readOnly = new ReadOnlyWorkspace(ws);
 * await readOnly.read('file.md'); // works
 * await readOnly.write('file.md', 'content'); // throws!
 * ```
 */
export class ReadOnlyWorkspace implements Workspace {
  /**
   * Create a new ReadOnlyWorkspace wrapping another workspace.
   * @param underlying - The workspace to wrap
   */
  constructor(private readonly underlying: Workspace) {}

  get id(): string {
    return this.underlying.id;
  }

  get root(): string {
    return this.underlying.root;
  }

  resolve(relativePath: string): string {
    return this.underlying.resolve(relativePath);
  }

  exists(relativePath: string): Promise<boolean> {
    return this.underlying.exists(relativePath);
  }

  read(relativePath: string): Promise<string> {
    return this.underlying.read(relativePath);
  }

  async write(_relativePath: string, _content: string): Promise<void> {
    throw new Error('Cannot write to read-only workspace');
  }

  readdir(relativePath: string): Promise<WorkspaceEntry[]> {
    return this.underlying.readdir(relativePath);
  }

  async mkdir(_relativePath: string): Promise<void> {
    throw new Error('Cannot mkdir in read-only workspace');
  }
}

/**
 * In-memory workspace for testing.
 * Stores files in a Map, no filesystem access.
 *
 * @example
 * ```typescript
 * const ws = new MemoryWorkspace('test');
 * await ws.write('rules/my-rule.md', '# Rule');
 * const content = await ws.read('rules/my-rule.md');
 * const entries = await ws.readdir('rules');
 * // entries: [{ name: 'my-rule.md', isFile: true, isDirectory: false }]
 * ```
 */
export class MemoryWorkspace implements Workspace {
  public readonly root: string = '/memory';
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  /**
   * Create a new MemoryWorkspace.
   * @param id - Unique identifier for this workspace
   * @param initialFiles - Optional map of relative paths to file contents
   */
  constructor(
    public readonly id: string,
    initialFiles?: Record<string, string>,
  ) {
    if (initialFiles) {
      for (const [filePath, content] of Object.entries(initialFiles)) {
        this.files.set(this.normalizePath(filePath), content);
      }
    }
  }

  resolve(relativePath: string): string {
    const normalized = this.normalizePath(relativePath);
    if (normalized === '') return this.root;
    return this.root + '/' + normalized;
  }

  async exists(relativePath: string): Promise<boolean> {
    const normalized = this.normalizePath(relativePath);
    // Check if it's a file
    if (this.files.has(normalized)) return true;
    // Check if it's an explicit directory
    if (this.directories.has(normalized)) return true;
    // Check if it's an implicit directory (some file has this as a prefix)
    if (normalized === '') return true;
    const prefix = normalized + '/';
    for (const key of this.files.keys()) {
      if (key.startsWith(prefix)) return true;
    }
    return false;
  }

  async read(relativePath: string): Promise<string> {
    const normalized = this.normalizePath(relativePath);
    const content = this.files.get(normalized);
    if (content === undefined) {
      throw new Error(`File not found: ${relativePath} in workspace ${this.id}`);
    }
    return content;
  }

  async write(relativePath: string, content: string): Promise<void> {
    const normalized = this.normalizePath(relativePath);
    this.files.set(normalized, content);
  }

  async readdir(relativePath: string): Promise<WorkspaceEntry[]> {
    const normalized = this.normalizePath(relativePath);

    // Check directory exists
    if (!(await this.exists(normalized))) {
      throw new Error(`Directory not found: ${relativePath} in workspace ${this.id}`);
    }

    const prefix = normalized === '' ? '' : normalized + '/';
    const entries = new Map<string, WorkspaceEntry>();

    // Scan files for entries under this directory
    for (const key of this.files.keys()) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const slashIndex = rest.indexOf('/');

      if (slashIndex === -1) {
        // Direct child file
        entries.set(rest, { name: rest, isFile: true, isDirectory: false });
      } else {
        // Subdirectory (from file path)
        const dirName = rest.slice(0, slashIndex);
        if (!entries.has(dirName)) {
          entries.set(dirName, { name: dirName, isFile: false, isDirectory: true });
        }
      }
    }

    // Also scan explicit directories
    for (const dir of this.directories) {
      if (!dir.startsWith(prefix)) continue;
      const rest = dir.slice(prefix.length);
      if (rest === '') continue;
      const slashIndex = rest.indexOf('/');
      const dirName = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
      if (!entries.has(dirName)) {
        entries.set(dirName, { name: dirName, isFile: false, isDirectory: true });
      }
    }

    return Array.from(entries.values());
  }

  async mkdir(relativePath: string): Promise<void> {
    const normalized = this.normalizePath(relativePath);
    if (normalized !== '') {
      this.directories.add(normalized);
    }
  }

  /**
   * Get all file paths stored in this workspace (for test assertions).
   * @returns Array of normalized file paths
   */
  getAllPaths(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * Normalize a path to use forward slashes and strip leading slash.
   */
  private normalizePath(p: string): string {
    return p.split(path.sep).join('/').replace(/^\//, '');
  }
}
