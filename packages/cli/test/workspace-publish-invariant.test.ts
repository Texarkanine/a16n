import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

/**
 * Repo-level guard for cross-milestone invariant #3 ("source stays workspace:*"):
 * every reference from one workspace package to another MUST use the pnpm
 * `workspace:` protocol in source. The concrete version is produced only by
 * pnpm's publish-time rewrite, so a hand-pinned sibling version in source is a
 * bug (it can silently drift from, or outright contradict, what gets published).
 *
 * Scope note: this does NOT protect against publishing with the wrong tool
 * (`npm publish` instead of `pnpm publish`), which is what produced the original
 * `@a16njs/plugin-agentsmd` breakage. A unit test that reads source manifests
 * cannot observe which command an operator runs. That failure mode is addressed
 * by the release-pipeline hardening in M2 (artifact inspection + removing the
 * need for manual recovery publishes).
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const packagesDir = join(repoRoot, 'packages');

const DEPENDENCY_BUCKETS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

function readWorkspaceManifests(): Map<string, PackageManifest> {
  const manifests = new Map<string, PackageManifest>();
  for (const entry of readdirSync(packagesDir)) {
    const dir = join(packagesDir, entry);
    const manifestPath = join(dir, 'package.json');
    if (!statSync(dir).isDirectory() || !existsSync(manifestPath)) {
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest;
    if (manifest.name) {
      manifests.set(manifest.name, manifest);
    }
  }
  return manifests;
}

const manifests = readWorkspaceManifests();
const workspaceNames = new Set(manifests.keys());

describe('workspace publish invariant', () => {
  it('discovers the workspace packages', () => {
    expect(workspaceNames.size).toBeGreaterThan(0);
  });

  it.each([...manifests.entries()])(
    '%s references internal siblings via the workspace: protocol in source',
    (_name, manifest) => {
      for (const bucket of DEPENDENCY_BUCKETS) {
        const deps = manifest[bucket];
        if (!deps) {
          continue;
        }
        for (const [depName, spec] of Object.entries(deps)) {
          if (workspaceNames.has(depName)) {
            expect(spec, `${depName} in ${bucket}`).toMatch(/^workspace:/);
          }
        }
      }
    }
  );
});
