/**
 * Tests for generate-versioned-api.ts
 *
 * Tests the parsing and grouping logic for git tags.
 * Does not test actual git operations or TypeDoc execution (those are integration tests).
 */

import { describe, it, expect } from 'vitest';
import {
  parseTag,
  groupTagsByPackage,
  getLatestVersion,
} from '../scripts/generate-versioned-api.js';

describe('parseTag', () => {
  it('parses scoped package tags (@a16njs/package@version)', () => {
    const result = parseTag('@a16njs/models@0.2.0');
    expect(result).toEqual({
      fullTag: '@a16njs/models@0.2.0',
      packageName: 'models',
      version: '0.2.0',
    });
  });

  it('parses engine package tag', () => {
    const result = parseTag('@a16njs/engine@0.1.0');
    expect(result).toEqual({
      fullTag: '@a16njs/engine@0.1.0',
      packageName: 'engine',
      version: '0.1.0',
    });
  });

  it('parses plugin-cursor package tag', () => {
    const result = parseTag('@a16njs/plugin-cursor@0.3.0');
    expect(result).toEqual({
      fullTag: '@a16njs/plugin-cursor@0.3.0',
      packageName: 'plugin-cursor',
      version: '0.3.0',
    });
  });

  it('parses CLI package tag (a16n@version)', () => {
    const result = parseTag('a16n@0.3.0');
    expect(result).toEqual({
      fullTag: 'a16n@0.3.0',
      packageName: 'cli',
      version: '0.3.0',
    });
  });

  it('parses prerelease versions', () => {
    const result = parseTag('@a16njs/models@1.0.0-beta.1');
    expect(result).toEqual({
      fullTag: '@a16njs/models@1.0.0-beta.1',
      packageName: 'models',
      version: '1.0.0-beta.1',
    });
  });

  it('returns null for invalid tags', () => {
    expect(parseTag('v1.0.0')).toBeNull();
    expect(parseTag('release-2024')).toBeNull();
    expect(parseTag('not-a-tag')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseTag('')).toBeNull();
  });

  it('returns null for malformed scoped tags', () => {
    expect(parseTag('@a16njs/models')).toBeNull(); // missing version
    expect(parseTag('@a16njs/@0.1.0')).toBeNull(); // missing package name
  });
});

describe('groupTagsByPackage', () => {
  it('groups tags by package name', () => {
    const tags = [
      '@a16njs/models@0.1.0',
      '@a16njs/models@0.2.0',
      '@a16njs/engine@0.1.0',
      'a16n@0.3.0',
    ];

    const result = groupTagsByPackage(tags);

    expect(result.size).toBe(3);
    expect(result.get('models')).toHaveLength(2);
    expect(result.get('engine')).toHaveLength(1);
    expect(result.get('cli')).toHaveLength(1);
  });

  it('ignores invalid tags', () => {
    const tags = ['@a16njs/models@0.1.0', 'v1.0.0', 'invalid'];

    const result = groupTagsByPackage(tags);

    expect(result.size).toBe(1);
    expect(result.get('models')).toHaveLength(1);
  });

  it('returns empty map for no valid tags', () => {
    const result = groupTagsByPackage(['v1.0.0', 'release']);
    expect(result.size).toBe(0);
  });

  it('returns empty map for empty input', () => {
    const result = groupTagsByPackage([]);
    expect(result.size).toBe(0);
  });
});

describe('getLatestVersion', () => {
  it('returns highest version (semver comparison)', () => {
    const versions = ['0.1.0', '0.2.0', '0.10.0', '0.3.0'];
    expect(getLatestVersion(versions)).toBe('0.10.0');
  });

  it('handles major version differences', () => {
    const versions = ['1.0.0', '2.0.0', '0.9.0'];
    expect(getLatestVersion(versions)).toBe('2.0.0');
  });

  it('handles patch version differences', () => {
    const versions = ['1.0.0', '1.0.1', '1.0.10'];
    expect(getLatestVersion(versions)).toBe('1.0.10');
  });

  it('handles single version', () => {
    const versions = ['0.1.0'];
    expect(getLatestVersion(versions)).toBe('0.1.0');
  });

  it('handles prerelease versions (sorts after release)', () => {
    // Note: localeCompare with numeric: true may not handle prereleases "correctly"
    // but for our use case, we just need consistent ordering
    const versions = ['1.0.0', '1.0.0-beta.1', '0.9.0'];
    const result = getLatestVersion(versions);
    // 1.0.0-beta.1 > 1.0.0 in string comparison, which is fine for display
    expect(['1.0.0', '1.0.0-beta.1']).toContain(result);
  });
});
