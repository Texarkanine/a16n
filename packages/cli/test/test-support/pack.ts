import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Run `pnpm pack` in a package directory and return the parsed `package.json` from the tarball.
 */
export function readPackedPackageJson(packageDir: string): Record<string, unknown> {
  const outDir = mkdtempSync(join(tmpdir(), 'a16n-pack-'));
  try {
    execSync(`pnpm pack --pack-destination ${JSON.stringify(outDir)}`, {
      cwd: packageDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const tarball = readdirSync(outDir).find((name) => name.endsWith('.tgz'));
    if (!tarball) {
      throw new Error(`pnpm pack produced no tarball in ${outDir}`);
    }
    const pkgJsonRaw = execSync(
      `tar -xOf ${JSON.stringify(join(outDir, tarball))} package/package.json`,
      { encoding: 'utf8' }
    );
    return JSON.parse(pkgJsonRaw) as Record<string, unknown>;
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

/** Fail when any dependency still uses the pnpm workspace protocol. */
export function assertDependenciesHaveNoWorkspaceProtocol(
  dependencies: Record<string, string> | undefined
): void {
  if (!dependencies) {
    return;
  }
  for (const [name, spec] of Object.entries(dependencies)) {
    if (spec.startsWith('workspace:')) {
      throw new Error(`${name} still uses workspace protocol: ${spec}`);
    }
  }
}

/** Read source package.json from disk. */
export function readSourcePackageJson(packageDir: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(packageDir, 'package.json'), 'utf8')
  ) as Record<string, unknown>;
}
