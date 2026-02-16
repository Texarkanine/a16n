import { describe, it, expect } from 'vitest';
import { resolveRoot, toWorkspace, LocalWorkspace, type Workspace } from '../src/workspace.js';

describe('resolveRoot', () => {
  it('should return the string directly when given a string', () => {
    expect(resolveRoot('/project/root')).toBe('/project/root');
  });

  it('should return workspace.root when given a Workspace', () => {
    const mockWorkspace: Workspace = {
      id: 'test',
      root: '/workspace/root',
      resolve: () => '',
      exists: async () => false,
      read: async () => '',
      write: async () => {},
      readdir: async () => [],
      mkdir: async () => {},
    };
    expect(resolveRoot(mockWorkspace)).toBe('/workspace/root');
  });
});

describe('toWorkspace', () => {
  it('should wrap a string in a LocalWorkspace', () => {
    const ws = toWorkspace('/project/root');
    expect(ws).toBeInstanceOf(LocalWorkspace);
    expect(ws.root).toBe('/project/root');
    expect(ws.id).toBe('default');
  });

  it('should use the provided id when wrapping a string', () => {
    const ws = toWorkspace('/project/root', 'source');
    expect(ws).toBeInstanceOf(LocalWorkspace);
    expect(ws.id).toBe('source');
  });

  it('should return the workspace unchanged when given a Workspace', () => {
    const original = new LocalWorkspace('test', '/workspace/root');
    const ws = toWorkspace(original);
    expect(ws).toBe(original);
  });
});
