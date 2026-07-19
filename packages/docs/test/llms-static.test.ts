/**
 * Tests for llms-static.ts — clear/generate helpers for local LLM artifact serving.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  listStaticLlmsArtifacts,
  clearStaticLlmsArtifacts,
  generateLlmsIntoStatic,
} from '../scripts/llms-static.js';

describe('listStaticLlmsArtifacts / clearStaticLlmsArtifacts', () => {
  let staticRoot: string;

  beforeEach(() => {
    staticRoot = mkdtempSync(join(tmpdir(), 'llms-static-clear-'));
  });

  afterEach(() => {
    rmSync(staticRoot, { recursive: true, force: true });
  });

  it('returns empty when static has no LLM artifacts', () => {
    mkdirSync(join(staticRoot, 'img'), { recursive: true });
    writeFileSync(join(staticRoot, 'img', '.gitkeep'), '');
    writeFileSync(join(staticRoot, 'versions.json'), '{}');
    expect(listStaticLlmsArtifacts(staticRoot)).toEqual([]);
  });

  it('lists root and nested llms txt files and generated md mirrors', () => {
    writeFileSync(join(staticRoot, 'llms.txt'), 'index');
    writeFileSync(join(staticRoot, 'llms-full.txt'), 'full');
    mkdirSync(join(staticRoot, 'engine', 'api', '1.0.0'), { recursive: true });
    writeFileSync(join(staticRoot, 'engine', 'api', '1.0.0', 'llms.txt'), 'api');
    writeFileSync(join(staticRoot, 'getting-started.md'), '# Hello');

    const listed = listStaticLlmsArtifacts(staticRoot).sort();
    expect(listed).toEqual(
      [
        'engine/api/1.0.0/llms.txt',
        'getting-started.md',
        'llms-full.txt',
        'llms.txt',
      ].sort()
    );
  });

  it('clears listed artifacts and leaves unrelated static files', () => {
    mkdirSync(join(staticRoot, 'img'), { recursive: true });
    writeFileSync(join(staticRoot, 'img', '.gitkeep'), '');
    writeFileSync(join(staticRoot, 'versions.json'), '{}');
    writeFileSync(join(staticRoot, 'llms.txt'), 'index');
    writeFileSync(join(staticRoot, 'intro.md'), '# Intro');

    const removed = clearStaticLlmsArtifacts(staticRoot).sort();
    expect(removed).toEqual(['intro.md', 'llms.txt'].sort());
    expect(existsSync(join(staticRoot, 'llms.txt'))).toBe(false);
    expect(existsSync(join(staticRoot, 'intro.md'))).toBe(false);
    expect(existsSync(join(staticRoot, 'versions.json'))).toBe(true);
    expect(existsSync(join(staticRoot, 'img', '.gitkeep'))).toBe(true);
  });
});

describe('generateLlmsIntoStatic', () => {
  let docsDir: string;

  beforeEach(() => {
    docsDir = mkdtempSync(join(tmpdir(), 'llms-static-gen-'));
    mkdirSync(join(docsDir, 'static'), { recursive: true });
    mkdirSync(join(docsDir, '.generated'), { recursive: true });
  });

  afterEach(() => {
    rmSync(docsDir, { recursive: true, force: true });
  });

  it('writes root llms.txt into static/ from .generated markdown', async () => {
    writeFileSync(
      join(docsDir, '.generated', 'index.md'),
      '---\ntitle: Home\n---\n\n# Home\n'
    );

    await generateLlmsIntoStatic(docsDir);

    const llmsPath = join(docsDir, 'static', 'llms.txt');
    expect(existsSync(llmsPath)).toBe(true);
    const body = readFileSync(llmsPath, 'utf-8');
    expect(body).toMatch(/llms\.txt|# |Home/i);
  });

  it('writes nested API custom llms files when version trees exist', async () => {
    writeFileSync(
      join(docsDir, '.generated', 'index.md'),
      '---\ntitle: Home\n---\n\n# Home\n'
    );
    const apiDir = join(docsDir, '.generated', 'engine', 'api', '1.0.0');
    mkdirSync(apiDir, { recursive: true });
    writeFileSync(
      join(apiDir, 'index.md'),
      '---\ntitle: Engine API\n---\n\n# Engine\n'
    );

    await generateLlmsIntoStatic(docsDir);

    expect(
      existsSync(join(docsDir, 'static', 'engine', 'api', '1.0.0', 'llms.txt'))
    ).toBe(true);
    expect(
      existsSync(
        join(docsDir, 'static', 'engine', 'api', '1.0.0', 'llms-full.txt')
      )
    ).toBe(true);
  });
});
