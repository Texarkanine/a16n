import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * Package-scoped guard for the two failure modes that have specifically bitten
 * @a16njs/plugin-agentsmd at publish time:
 *
 *  1. Missing `publishConfig.access: "public"` — a scoped package without it
 *     cannot be published publicly on a first publish.
 *  2. A leaked `workspace:` specifier for a sibling — the source MUST keep
 *     `workspace:` (pnpm rewrites it to an exact version only at publish time);
 *     a hand-pinned sibling in source is the bug that produced the original
 *     poisoned `1.0.1`/`1.0.2` tarballs.
 *
 * This file lives in the agentsmd package on purpose: Release-Please only cuts
 * a release for a package when a commit touches that package's path. A repo-wide
 * test in another package cannot trigger an agentsmd release, which is exactly
 * why the first M1 attempt silently shipped without republishing agentsmd.
 */

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

interface PackageManifest {
  name?: string;
  publishConfig?: { access?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

const DEPENDENCY_BUCKETS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

const manifest = JSON.parse(
  readFileSync(join(packageRoot, 'package.json'), 'utf8')
) as PackageManifest;

describe('@a16njs/plugin-agentsmd published package shape', () => {
  it('declares public access so a scoped publish succeeds', () => {
    expect(manifest.publishConfig?.access).toBe('public');
  });

  it('keeps every @a16njs/* sibling dependency on the workspace: protocol in source', () => {
    for (const bucket of DEPENDENCY_BUCKETS) {
      const deps = manifest[bucket];
      if (!deps) {
        continue;
      }
      for (const [depName, spec] of Object.entries(deps)) {
        if (depName.startsWith('@a16njs/')) {
          expect(spec, `${depName} in ${bucket}`).toMatch(/^workspace:/);
        }
      }
    }
  });
});
