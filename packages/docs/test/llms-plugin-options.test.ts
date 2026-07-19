/**
 * Tests for llms-plugin-options.ts
 *
 * Covers discovery of per-API-version customLLMFiles from `.generated`
 * and assembly of root docusaurus-plugin-llms options (prose-only full file).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  discoverApiLlmCustomFiles,
  buildLlmsPluginOptions,
} from '../scripts/llms-plugin-options.js';

function writeMd(dir: string, name = 'index.md'): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), '# Doc\n');
}

describe('discoverApiLlmCustomFiles', () => {
  let generatedRoot: string;

  beforeEach(() => {
    generatedRoot = mkdtempSync(join(tmpdir(), 'llms-plugin-options-'));
  });

  afterEach(() => {
    rmSync(generatedRoot, { recursive: true, force: true });
  });

  it('returns empty array when .generated has no API version trees', () => {
    writeMd(join(generatedRoot, 'getting-started'));
    expect(discoverApiLlmCustomFiles(generatedRoot)).toEqual([]);
  });

  it('emits nested llms.txt and llms-full.txt for each API version directory', () => {
    writeMd(join(generatedRoot, 'engine', 'api', '1.0.0'));

    const files = discoverApiLlmCustomFiles(generatedRoot);

    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: 'engine/api/1.0.0/llms.txt',
          includePatterns: ['engine/api/1.0.0/**/*.md'],
          fullContent: false,
        }),
        expect.objectContaining({
          filename: 'engine/api/1.0.0/llms-full.txt',
          includePatterns: ['engine/api/1.0.0/**/*.md'],
          fullContent: true,
        }),
      ])
    );
    expect(files).toHaveLength(2);
  });

  it('includes current and CLI reference version directories when present', () => {
    writeMd(join(generatedRoot, 'engine', 'api', 'current'));
    writeMd(join(generatedRoot, 'cli', 'reference', '0.12.0'));

    const files = discoverApiLlmCustomFiles(generatedRoot);
    const filenames = files.map((f) => f.filename);

    expect(filenames).toEqual(
      expect.arrayContaining([
        'engine/api/current/llms.txt',
        'engine/api/current/llms-full.txt',
        'cli/reference/0.12.0/llms.txt',
        'cli/reference/0.12.0/llms-full.txt',
      ])
    );
  });
});

describe('buildLlmsPluginOptions', () => {
  let generatedRoot: string;

  beforeEach(() => {
    generatedRoot = mkdtempSync(join(tmpdir(), 'llms-plugin-options-'));
  });

  afterEach(() => {
    rmSync(generatedRoot, { recursive: true, force: true });
  });

  it('configures root plugin options with prose-only custom llms-full.txt', () => {
    const options = buildLlmsPluginOptions(generatedRoot);

    expect(options.docsDir).toBe('.generated');
    expect(options.generateMarkdownFiles).toBe(true);
    expect(options.generateLLMsFullTxt).toBe(false);
    expect(options.generateLLMsTxt).toBe(true);

    const rootFull = options.customLLMFiles.find(
      (f) => f.filename === 'llms-full.txt'
    );
    expect(rootFull).toMatchObject({
      filename: 'llms-full.txt',
      fullContent: true,
      includePatterns: ['**/*.md'],
    });
    expect(rootFull?.ignorePatterns).toEqual(
      expect.arrayContaining([
        '**/api/current/**',
        '**/api/[0-9]*/**',
        '**/reference/**',
      ])
    );
  });

  it('merges discovered API customLLMFiles into options', () => {
    writeMd(join(generatedRoot, 'models', 'api', '0.5.0'));

    const options = buildLlmsPluginOptions(generatedRoot);
    const filenames = options.customLLMFiles.map((f) => f.filename);

    expect(filenames).toContain('llms-full.txt');
    expect(filenames).toContain('models/api/0.5.0/llms.txt');
    expect(filenames).toContain('models/api/0.5.0/llms-full.txt');
  });
});
