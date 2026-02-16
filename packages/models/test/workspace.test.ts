import { describe, it, expect } from 'vitest';
import { resolveRoot, type Workspace } from '../src/workspace.js';

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
