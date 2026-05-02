/**
 * Shared helpers for Claude plugin emit tests.
 *
 * Keeps per-suite temp directories isolated so the emit suite can be split
 * into domain files that Vitest runs in parallel without clobbering each
 * other's workspaces.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Per-suite temp root under `packages/plugin-claude/test/.temp-emit/<slug>/`
 * so parallel Vitest files do not share filesystem state.
 */
export function suiteTempDir(importMetaUrl: string | URL, slug: string): string {
  const url = typeof importMetaUrl === 'string' ? importMetaUrl : importMetaUrl.href;
  const testDir = path.dirname(fileURLToPath(url));
  return path.join(testDir, '.temp-emit', slug);
}
