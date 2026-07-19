/**
 * Tests for generate-versioned-api.ts
 *
 * Tests the parsing and grouping logic for git tags.
 * Does not test actual git operations or TypeDoc execution (those are integration tests).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseTag,
  groupTagsByPackage,
  getLatestVersion,
  selectVersionsForRetention,
  writeVersionsManifestFile,
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

  it('handles prerelease versions (does not crash)', () => {
    // Note: localeCompare with numeric: true may not handle prereleases "correctly"
    // but for our use case, we just need consistent ordering
    const versions = ['1.0.0', '1.0.0-beta.1', '0.9.0'];
    const result = getLatestVersion(versions);
    // 1.0.0-beta.1 > 1.0.0 in string comparison, which is fine for display
    expect(['1.0.0', '1.0.0-beta.1']).toContain(result);
  });
});

describe('selectVersionsForRetention', () => {
  /**
   * Keeps all versions in the current major plus the newest version of each of
   * the previous N majors. Default N is 2.
   */

  it('retains all current-major versions and latest of previous majors (N=2)', () => {
    const versions = ['0.1.0', '0.8.1', '1.0.0', '1.0.1'];
    expect(selectVersionsForRetention(versions, 2)).toEqual([
      '1.0.1',
      '1.0.0',
      '0.8.1',
    ]);
  });

  it('retains all current major plus latest of each of N previous majors at major 4', () => {
    const versions = [
      '0.9.0',
      '1.2.0',
      '2.0.0',
      '2.1.0',
      '3.0.0',
      '4.0.0',
      '4.5.6',
    ];
    expect(selectVersionsForRetention(versions, 2)).toEqual([
      '4.5.6',
      '4.0.0',
      '3.0.0',
      '2.1.0',
    ]);
  });

  it('retains all versions when only major 0 exists', () => {
    const versions = ['0.1.0', '0.5.0', '0.9.0'];
    expect(selectVersionsForRetention(versions, 2)).toEqual([
      '0.9.0',
      '0.5.0',
      '0.1.0',
    ]);
  });

  it('retains only current major when N=0', () => {
    const versions = ['0.1.0', '0.8.1', '1.0.0', '1.0.1'];
    expect(selectVersionsForRetention(versions, 0)).toEqual([
      '1.0.1',
      '1.0.0',
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(selectVersionsForRetention([])).toEqual([]);
  });
});

describe('writeVersionsManifestFile', () => {
  /**
   * Persists VersionPicker's versions.json under static/. An empty manifest
   * clears the dropdown so prose-only sync cannot advertise missing API trees.
   */
  let docsDir: string;

  beforeEach(() => {
    docsDir = mkdtempSync(join(tmpdir(), 'versions-manifest-'));
    mkdirSync(join(docsDir, 'static'), { recursive: true });
  });

  afterEach(() => {
    rmSync(docsDir, { recursive: true, force: true });
  });

  it('writes an empty object when given an empty manifest', () => {
    writeVersionsManifestFile(docsDir, {});
    const raw = readFileSync(join(docsDir, 'static', 'versions.json'), 'utf-8');
    expect(JSON.parse(raw)).toEqual({});
  });

  it('writes package version lists for a non-empty manifest', () => {
    writeVersionsManifestFile(docsDir, {
      'plugin-cursor': ['1.0.0', '0.14.1'],
    });
    const raw = readFileSync(join(docsDir, 'static', 'versions.json'), 'utf-8');
    expect(JSON.parse(raw)).toEqual({
      'plugin-cursor': ['1.0.0', '0.14.1'],
    });
  });
});
