import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('MDC Parsing', () => {
  it('should parse frontmatter correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    expect(item?.metadata).toHaveProperty('alwaysApply', true);
  });

  it('should extract body content without frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    // Content should not include the frontmatter delimiters
    expect(item?.content).not.toContain('---');
    expect(item?.content).not.toContain('alwaysApply');
  });
});
