import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  assertDependenciesHaveNoWorkspaceProtocol,
  readPackedPackageJson,
  readSourcePackageJson,
} from './test-support/pack.js';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('publish pack', () => {
  it('keeps workspace:* for internal deps in source package.json', () => {
    const source = readSourcePackageJson(packageDir);
    const deps = source.dependencies as Record<string, string>;
    for (const [name, spec] of Object.entries(deps)) {
      if (name.startsWith('@a16njs/')) {
        expect(spec).toBe('workspace:*');
      }
    }
  });

  it(
    'rewrites all @a16njs/* deps to exact semver in the packed tarball',
    () => {
      const packed = readPackedPackageJson(packageDir);
      const deps = packed.dependencies as Record<string, string>;
      assertDependenciesHaveNoWorkspaceProtocol(deps);
      for (const [name, spec] of Object.entries(deps)) {
        if (name.startsWith('@a16njs/')) {
          expect(spec).toMatch(/^\d+\.\d+\.\d+/);
        }
      }
    },
    15_000
  );
});
