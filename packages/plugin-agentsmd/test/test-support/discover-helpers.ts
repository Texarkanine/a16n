/**
 * Shared helpers for AGENTS.md plugin discover tests.
 *
 * Resolves the package-local `fixtures/` directory relative to each split test file.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Absolute path to `packages/plugin-agentsmd/test/fixtures` from a split test file under `test/`.
 */
export function discoverFixturesDir(importMetaUrl: string | URL): string {
  const url = typeof importMetaUrl === 'string' ? importMetaUrl : importMetaUrl.href;
  return path.join(path.dirname(fileURLToPath(url)), 'fixtures');
}
