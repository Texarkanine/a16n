/**
 * Shared filesystem helpers and engine factory for CLI integration tests.
 *
 * Keeps fixture layout (`fixtures/<name>/from-*`, `to-*`) and conversion
 * assertions colocated while integration specs stay split by domain.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'vitest';
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';
import a16nPlugin from '@a16njs/plugin-a16n';

/** Same plugin stack as legacy monolithic integration tests. */
export function createIntegrationEngine(): A16nEngine {
  return new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin]);
}

/** Directory containing `fixtures/` next to the calling integration test file. */
export function fixturesDirFor(importMetaUrl: string | URL): string {
  const url = typeof importMetaUrl === 'string' ? importMetaUrl : importMetaUrl.href;
  return path.join(path.dirname(fileURLToPath(url)), 'fixtures');
}

/**
 * Per-suite temp root under `integration/.temp-integration/<slug>/` so parallel
 * Vitest files do not clobber each other's workspaces.
 */
export function suiteTempDir(importMetaUrl: string | URL, slug: string): string {
  const url = typeof importMetaUrl === 'string' ? importMetaUrl : importMetaUrl.href;
  const integrationDir = path.dirname(fileURLToPath(url));
  return path.join(integrationDir, '.temp-integration', slug);
}

/** Recursively copy a directory tree. */
export async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/** Recursively read all files under `dir` into a relative-path → content map. */
export async function readDirFiles(dir: string, base: string = ''): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = base ? `${base}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await readDirFiles(fullPath, relativePath);
        for (const [k, v] of subFiles) {
          files.set(k, v);
        }
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        files.set(relativePath, content);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

/** Assert every expected file exists under `actual` with matching trimmed content. */
export function compareOutputs(actual: Map<string, string>, expected: Map<string, string>): void {
  for (const [relPath, expectedContent] of expected) {
    const actualContent = actual.get(relPath);
    expect(actualContent, `Expected file ${relPath} to exist`).toBeDefined();
    expect(actualContent?.trim(), `Content mismatch in ${relPath}`).toBe(expectedContent.trim());
  }
}
