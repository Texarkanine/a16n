# Contributing to a16n

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- **Node.js**: Version specified in `.nvmrc` (use `nvm use` to switch)
- **pnpm**: Version specified in root `package.json` `packageManager` field

## Getting Started

```bash
git clone https://github.com/Texarkanine/a16n.git
cd a16n
pnpm install
pnpm build
pnpm test
```

## Project Structure

This is a pnpm monorepo managed with Turborepo. Packages live under `packages/`:

| Package | Description |
|---------|-------------|
| `cli` | The `a16n` CLI (published as `a16n` on npm) |
| `engine` | Core conversion engine — resolves plugins, runs discover/emit |
| `models` | Shared IR types, type guards, and utilities |
| `plugin-cursor` | Cursor plugin (discover + emit) |
| `plugin-claude` | Claude Code plugin (discover + emit) |
| `plugin-a16n` | a16n IR format plugin (discover + emit) |
| `plugin-agentsmd` | AGENTS.md standard plugin (discover + emit) |
| `glob-hook` | Standalone utility for Claude Code hooks (not part of the conversion pipeline) |
| `docs` | Documentation site (Docusaurus) |

## Releases

Releases are automated with [Release-Please](https://github.com/googleapis/release-please) (`release-please-config.json`). It opens a release PR per package; merging that PR tags the release and triggers publishing. The pipeline publishes via `pnpm --filter publish` using npm **OIDC trusted publishing** (no long-lived tokens), and pnpm rewrites each `workspace:*` dependency to the concrete published version at pack time.

Two non-obvious rules govern every release:

- **A release only happens when a commit touches the package's path.** A `release-as` entry in `release-please-config.json` overrides the *version* when a release is cut, but it does **not** force one. A `release-as` with no path-touching commit is inert.
- **Source dependencies stay `workspace:*`.** Never hand-pin a sibling version in a package's `package.json`. The concrete version is produced only by pnpm's publish-time rewrite; a hand-pinned version can silently drift from what actually publishes. This is enforced by `packages/cli/test/workspace-publish-invariant.test.ts`.

### Adding a publishable package

Adding a new published `@a16njs/*` package has four traps that have each broken a real release. Do every step, in order.

1. **Set `publishConfig.access` to `"public"`** in the new package's `package.json`. Scoped packages (`@a16njs/*`) default to *restricted*; without this, the very first publish fails. (Caught the first agentsmd publish.)

2. **Keep internal deps as `workspace:*`, and make the FIRST publish a `pnpm publish`.** Reference siblings as `"@a16njs/foo": "workspace:*"`. The first time the package goes to npm it MUST be published through the pnpm path (`pnpm --filter <pkg> publish`, which the release pipeline runs) — **never** a manual `npm publish`. Plain `npm publish` does not understand the `workspace:` protocol and leaks the literal `workspace:*` string into the published tarball, poisoning every consumer that pins it. (This is the manual-recovery mistake that poisoned `agentsmd@1.0.1`/`1.0.2` and dragged `a16n@0.15.2`/`0.15.3` down with it.)

3. **Cut the release with a real, path-touching conventional commit.** Add the package to `release-please-config.json`, then land a `feat:`/`fix:` commit that *touches a file under the package's path* (a README note is enough). `release-as` alone will not include the package in a release — see the rule above. Remove any `release-as` key once it has served its purpose; a stale forced version silently pins all future releases of that package to it.

4. **Configure a per-package trusted publisher (OIDC) on npmjs.com.** Each package needs its own trusted-publisher entry (repo + workflow) under its npm settings, or the pipeline publish fails with a 404. This is a per-package, one-time setup.

#### First-publish bootstrap (the OIDC chicken-and-egg)

A trusted publisher can only be configured for a package that **already exists** on npm, but the package can't be published without a trusted publisher. Break the cycle with a one-time manual bootstrap **that still goes through pnpm**:

1. Locally, `pnpm --filter <pkg> publish` once (this performs the correct `workspace:` rewrite — do **not** fall back to `npm publish`). Use a granular automation token scoped to that package for this single bootstrap publish.
2. On npmjs.com, add the GitHub Actions trusted publisher for the now-existing package.
3. From then on, all releases publish automatically through the pipeline's OIDC; the bootstrap token can be revoked.

#### Post-publish verification

The release pipeline already publishes correctly; because pnpm's `workspace:` rewrite is non-standard, the real safety net is verifying the **published tarball** after the fact — not any in-pipeline guard:

```bash
# No workspace: specifiers leaked into the published deps:
npm view <pkg>@<version> dependencies

# Provenance/attestation present (OIDC trusted publishing):
npm view <pkg>@<version> --json | grep -i provenance
```

If `npm view ... dependencies` shows any `workspace:` string, the tarball is poisoned (a manual `npm publish` slipped in) — deprecate that version and republish through the pnpm path.

## Running Tests

```bash
pnpm test              # Run all tests (canonical — always correct)
pnpm --filter @a16njs/glob-hook test   # Run a single package's full suite
pnpm typecheck         # Check types across all packages
```

`pnpm test` uses Turborepo and always runs Vitest inside each package directory, which ensures per-package config (timeouts, include patterns) and package-local binaries (e.g. `tsx`) resolve correctly.

### Running a single test file or test case

From within the package directory:

```bash
cd packages/glob-hook
pnpm exec vitest run test/cli.test.ts                        # single file
pnpm exec vitest run test/cli.test.ts -t "handles dotfiles"  # single test by name
```

> **Note:** `npx vitest run packages/<package>/test/<file>.test.ts` from the monorepo root works for all packages. For the most reliable experience (correct per-package timeout config, guaranteed binary resolution), prefer `pnpm exec vitest` from within the package directory or the `pnpm --filter` pattern above.

Tests use Vitest. Each package has its own `test/` directory; the layout depends on what the package does.

**Plugin packages** (`plugin-cursor`, `plugin-claude`, `plugin-a16n`, `plugin-agentsmd`) use a flat `test/` layout with one file per behavior domain:

```
test/
├── fixtures/                   # Static fixture directories for discovery/emission tests
├── test-support/               # Shared helpers (suiteTempDir, discoverFixturesDir)
├── discover-<domain>.test.ts   # One file per top-level discovery concern
└── emit-<domain>.test.ts       # One file per top-level emission concern
```

Emit tests use a per-suite temp directory (`suiteTempDir(import.meta.url, slug)`) so parallel Vitest execution doesn't cause filesystem races. Discover tests resolve fixtures via `discoverFixturesDir(import.meta.url)` for portability. See the [Plugin Development Guide](https://texarkanine.github.io/a16n/plugin-development) for helper patterns.

**The CLI package** (`cli`) uses a tiered `test/` layout:

```
test/
├── e2e/                # Subprocess tests — invoke the compiled CLI binary
├── integration/        # Fixture-based engine tests — exercise the engine via fixtures
├── commands/           # Unit tests — mirror src/commands/ one-to-one
└── *.test.ts           # Unit tests — mirror top-level src/ files one-to-one
```

Unit tests shadow the `src/` directory structure directly under `test/` (no `test/unit/` prefix). All FS-touching tests use `fs.mkdtemp()` per `describe` block (or `suiteTempDir` per suite) to prevent cross-test filesystem interference.

## Pull Request Expectations

- All tests pass (`pnpm test`)
- Type-check passes (`pnpm typecheck`)
- Builds succeed (`pnpm build`)
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (`feat:`, `fix:`, `chore:`, etc.)

## Plugin Development

Want to add support for a new AI coding tool? See the [Plugin Development Guide](https://texarkanine.github.io/a16n/plugin-development) on the docs site.

## Finding Work

Check the [GitHub issues](https://github.com/Texarkanine/a16n/issues) for open tasks. Issues labeled `good first issue` are a great starting point.
