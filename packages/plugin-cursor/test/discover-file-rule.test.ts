import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('FileRule Discovery', () => {
  it('should discover FileRule items from rules with globs: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);

    // All should be FileRule
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.FileRule);
    }
  });

  it('should parse single glob pattern correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const tsRule = result.items.find(i => i.sourcePath.includes('typescript'));
    expect(tsRule).toBeDefined();
    expect(tsRule?.type).toBe(CustomizationType.FileRule);
    expect((tsRule as import('@a16njs/models').FileRule).globs).toEqual(['**/*.ts']);
  });

  it('should parse comma-separated glob patterns into array', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const reactRule = result.items.find(i => i.sourcePath.includes('react'));
    expect(reactRule).toBeDefined();
    expect(reactRule?.type).toBe(CustomizationType.FileRule);
    expect((reactRule as import('@a16njs/models').FileRule).globs).toEqual(['**/*.tsx', '**/*.jsx']);
  });

  it('should include rule content in FileRule items', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const reactRule = result.items.find(i => i.sourcePath.includes('react'));
    expect(reactRule?.content).toContain('Use React best practices');
  });
});
