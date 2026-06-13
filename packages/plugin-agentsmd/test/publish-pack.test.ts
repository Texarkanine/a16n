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
  it('keeps workspace:* in source package.json', () => {
    const source = readSourcePackageJson(packageDir);
    const deps = source.dependencies as Record<string, string>;
    expect(deps['@a16njs/models']).toBe('workspace:*');
  });

  it(
    'rewrites @a16njs/models to an exact semver in the packed tarball',
    () => {
      const packed = readPackedPackageJson(packageDir);
      const deps = packed.dependencies as Record<string, string>;
      assertDependenciesHaveNoWorkspaceProtocol(deps);
      expect(deps['@a16njs/models']).toMatch(/^\d+\.\d+\.\d+/);
    },
    15_000
  );
});
