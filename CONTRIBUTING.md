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
