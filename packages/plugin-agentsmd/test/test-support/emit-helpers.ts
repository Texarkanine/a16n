/**
 * Shared temp-directory helpers for AGENTS.md plugin tests that write to disk
 * (emit suites and programmatically-built discovery trees).
 *
 * Keeps per-suite temp directories isolated so test files that Vitest runs in
 * parallel cannot clobber each other's workspaces.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Per-suite temp root under `packages/plugin-agentsmd/test/.temp-emit/<slug>/`
 * so parallel Vitest files do not share filesystem state.
 */
export function suiteTempDir(importMetaUrl: string | URL, slug: string): string {
  const url = typeof importMetaUrl === 'string' ? importMetaUrl : importMetaUrl.href;
  const testDir = path.dirname(fileURLToPath(url));
  return path.join(testDir, '.temp-emit', slug);
}
