import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  LocalWorkspace,
  ReadOnlyWorkspace,
  MemoryWorkspace,
} from '../src/workspace.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '.temp-workspace-test');

describe('LocalWorkspace', () => {
  let workspace: LocalWorkspace;

  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    workspace = new LocalWorkspace('test-local', tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should expose id and root', () => {
      expect(workspace.id).toBe('test-local');
      expect(workspace.root).toBe(tempDir);
    });
  });

  describe('resolve', () => {
    it('should resolve a relative path to an absolute path under root', () => {
      const resolved = workspace.resolve('subdir/file.md');
      expect(resolved).toBe(path.join(tempDir, 'subdir/file.md'));
    });

    it('should handle empty string as current directory', () => {
      const resolved = workspace.resolve('');
      expect(resolved).toBe(tempDir);
    });
  });

  describe('exists', () => {
    it('should return true for an existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'test.md'), 'hello');
      expect(await workspace.exists('test.md')).toBe(true);
    });

    it('should return false for a non-existent file', async () => {
      expect(await workspace.exists('missing.md')).toBe(false);
    });

    it('should return true for an existing directory', async () => {
      await fs.mkdir(path.join(tempDir, 'subdir'), { recursive: true });
      expect(await workspace.exists('subdir')).toBe(true);
    });
  });

  describe('read', () => {
    it('should read file content as UTF-8', async () => {
      await fs.writeFile(path.join(tempDir, 'test.md'), 'hello world');
      const content = await workspace.read('test.md');
      expect(content).toBe('hello world');
    });

    it('should throw for a non-existent file', async () => {
      await expect(workspace.read('missing.md')).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('should write content to a file', async () => {
      await workspace.write('output.md', 'written content');
      const content = await fs.readFile(path.join(tempDir, 'output.md'), 'utf-8');
      expect(content).toBe('written content');
    });

    it('should create parent directories as needed', async () => {
      await workspace.write('deep/nested/dir/file.md', 'nested content');
      const content = await fs.readFile(
        path.join(tempDir, 'deep/nested/dir/file.md'),
        'utf-8',
      );
      expect(content).toBe('nested content');
    });

    it('should overwrite existing file content', async () => {
      await workspace.write('file.md', 'first');
      await workspace.write('file.md', 'second');
      const content = await fs.readFile(path.join(tempDir, 'file.md'), 'utf-8');
      expect(content).toBe('second');
    });
  });

  describe('readdir', () => {
    it('should list files and directories', async () => {
      await fs.writeFile(path.join(tempDir, 'file.md'), 'content');
      await fs.mkdir(path.join(tempDir, 'subdir'), { recursive: true });

      const entries = await workspace.readdir('');
      const names = entries.map((e) => e.name).sort();
      expect(names).toEqual(['file.md', 'subdir']);
    });

    it('should correctly identify files vs directories', async () => {
      await fs.writeFile(path.join(tempDir, 'file.md'), 'content');
      await fs.mkdir(path.join(tempDir, 'subdir'), { recursive: true });

      const entries = await workspace.readdir('');
      const file = entries.find((e) => e.name === 'file.md');
      const dir = entries.find((e) => e.name === 'subdir');

      expect(file?.isFile).toBe(true);
      expect(file?.isDirectory).toBe(false);
      expect(dir?.isFile).toBe(false);
      expect(dir?.isDirectory).toBe(true);
    });

    it('should throw for a non-existent directory', async () => {
      await expect(workspace.readdir('nonexistent')).rejects.toThrow();
    });

    it('should return empty array for empty directory', async () => {
      await fs.mkdir(path.join(tempDir, 'empty'), { recursive: true });
      const entries = await workspace.readdir('empty');
      expect(entries).toEqual([]);
    });
  });

  describe('mkdir', () => {
    it('should create a directory', async () => {
      await workspace.mkdir('newdir');
      const stat = await fs.stat(path.join(tempDir, 'newdir'));
      expect(stat.isDirectory()).toBe(true);
    });

    it('should create nested directories', async () => {
      await workspace.mkdir('a/b/c');
      const stat = await fs.stat(path.join(tempDir, 'a/b/c'));
      expect(stat.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      await workspace.mkdir('existing');
      await expect(workspace.mkdir('existing')).resolves.toBeUndefined();
    });
  });
});

describe('ReadOnlyWorkspace', () => {
  let underlying: MemoryWorkspace;
  let readOnly: ReadOnlyWorkspace;

  beforeEach(() => {
    underlying = new MemoryWorkspace('underlying', {
      'file.md': '# Hello',
      'dir/nested.md': 'Nested content',
    });
    readOnly = new ReadOnlyWorkspace(underlying);
  });

  describe('delegation', () => {
    it('should delegate id to underlying workspace', () => {
      expect(readOnly.id).toBe('underlying');
    });

    it('should delegate root to underlying workspace', () => {
      expect(readOnly.root).toBe(underlying.root);
    });

    it('should delegate resolve to underlying workspace', () => {
      expect(readOnly.resolve('file.md')).toBe(underlying.resolve('file.md'));
    });

    it('should delegate exists to underlying workspace', async () => {
      expect(await readOnly.exists('file.md')).toBe(true);
      expect(await readOnly.exists('missing.md')).toBe(false);
    });

    it('should delegate read to underlying workspace', async () => {
      const content = await readOnly.read('file.md');
      expect(content).toBe('# Hello');
    });

    it('should delegate readdir to underlying workspace', async () => {
      const entries = await readOnly.readdir('dir');
      expect(entries).toHaveLength(1);
      expect(entries[0]!.name).toBe('nested.md');
    });
  });

  describe('write protection', () => {
    it('should throw on write', async () => {
      await expect(readOnly.write('file.md', 'content')).rejects.toThrow(
        /read-only/i,
      );
    });

    it('should throw on mkdir', async () => {
      await expect(readOnly.mkdir('newdir')).rejects.toThrow(/read-only/i);
    });
  });
});

describe('MemoryWorkspace', () => {
  let workspace: MemoryWorkspace;

  beforeEach(() => {
    workspace = new MemoryWorkspace('test-memory');
  });

  describe('constructor', () => {
    it('should expose id and root', () => {
      expect(workspace.id).toBe('test-memory');
      expect(workspace.root).toBe('/memory');
    });

    it('should accept initial files', async () => {
      const ws = new MemoryWorkspace('init', {
        'a.md': 'content A',
        'dir/b.md': 'content B',
      });
      expect(await ws.exists('a.md')).toBe(true);
      expect(await ws.read('a.md')).toBe('content A');
      expect(await ws.exists('dir/b.md')).toBe(true);
      expect(await ws.read('dir/b.md')).toBe('content B');
    });
  });

  describe('resolve', () => {
    it('should resolve a relative path to a virtual absolute path', () => {
      const resolved = workspace.resolve('subdir/file.md');
      expect(resolved).toBe('/memory/subdir/file.md');
    });
  });

  describe('exists', () => {
    it('should return true for an existing file', async () => {
      await workspace.write('test.md', 'hello');
      expect(await workspace.exists('test.md')).toBe(true);
    });

    it('should return false for a non-existent file', async () => {
      expect(await workspace.exists('missing.md')).toBe(false);
    });

    it('should return true for a directory that contains files', async () => {
      await workspace.write('dir/file.md', 'content');
      expect(await workspace.exists('dir')).toBe(true);
    });
  });

  describe('read', () => {
    it('should read file content', async () => {
      await workspace.write('test.md', 'hello world');
      const content = await workspace.read('test.md');
      expect(content).toBe('hello world');
    });

    it('should throw for a non-existent file', async () => {
      await expect(workspace.read('missing.md')).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('should store file content', async () => {
      await workspace.write('file.md', 'content');
      expect(await workspace.read('file.md')).toBe('content');
    });

    it('should overwrite existing content', async () => {
      await workspace.write('file.md', 'first');
      await workspace.write('file.md', 'second');
      expect(await workspace.read('file.md')).toBe('second');
    });
  });

  describe('readdir', () => {
    it('should list files in a directory', async () => {
      await workspace.write('dir/a.md', 'A');
      await workspace.write('dir/b.md', 'B');

      const entries = await workspace.readdir('dir');
      const names = entries.map((e) => e.name).sort();
      expect(names).toEqual(['a.md', 'b.md']);
      expect(entries.every((e) => e.isFile)).toBe(true);
    });

    it('should list subdirectories', async () => {
      await workspace.write('parent/child/file.md', 'content');

      const entries = await workspace.readdir('parent');
      expect(entries).toHaveLength(1);
      expect(entries[0]!.name).toBe('child');
      expect(entries[0]!.isDirectory).toBe(true);
      expect(entries[0]!.isFile).toBe(false);
    });

    it('should only list immediate children', async () => {
      await workspace.write('dir/a.md', 'A');
      await workspace.write('dir/sub/b.md', 'B');

      const entries = await workspace.readdir('dir');
      const names = entries.map((e) => e.name).sort();
      // Should show 'a.md' (file) and 'sub' (directory), NOT 'b.md'
      expect(names).toEqual(['a.md', 'sub']);
    });

    it('should throw for a non-existent directory', async () => {
      await expect(workspace.readdir('nonexistent')).rejects.toThrow();
    });

    it('should return empty array for empty directory', async () => {
      await workspace.mkdir('emptydir');
      const entries = await workspace.readdir('emptydir');
      expect(entries).toEqual([]);
    });
  });

  describe('mkdir', () => {
    it('should create a directory (visible via readdir of parent)', async () => {
      await workspace.mkdir('newdir');
      // After mkdir, the directory should exist
      expect(await workspace.exists('newdir')).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      await workspace.mkdir('existing');
      await expect(workspace.mkdir('existing')).resolves.toBeUndefined();
    });
  });

  describe('getAllPaths', () => {
    it('should return all stored file paths', async () => {
      await workspace.write('a.md', 'A');
      await workspace.write('dir/b.md', 'B');

      const paths = workspace.getAllPaths().sort();
      expect(paths).toEqual(['a.md', 'dir/b.md']);
    });

    it('should return empty array when no files stored', () => {
      expect(workspace.getAllPaths()).toEqual([]);
    });
  });
});
