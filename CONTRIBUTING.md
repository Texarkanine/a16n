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
| `glob-hook` | Standalone utility for Claude Code hooks (not part of the conversion pipeline) |
| `docs` | Documentation site (Docusaurus) |

## Running Tests

```bash
pnpm test              # Run all tests
pnpm --filter a16n test   # Run CLI tests only
pnpm typecheck         # Check types across all packages
```

Tests use Vitest with fixture-based integration tests. See `test/` directories in each package.

## Pull Request Expectations

- All tests pass (`pnpm test`)
- Type-check passes (`pnpm typecheck`)
- Builds succeed (`pnpm build`)
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (`feat:`, `fix:`, `chore:`, etc.)

## Plugin Development

Want to add support for a new AI coding tool? See the [Plugin Development Guide](https://texarkanine.github.io/a16n/plugin-development) on the docs site.

## Finding Work

Check the [GitHub issues](https://github.com/Texarkanine/a16n/issues) for open tasks. Issues labeled `good first issue` are a great starting point.
