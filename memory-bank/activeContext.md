# Memory Bank: Active Context

## Current Focus

Level 3 Feature: Split Read/Write Directories & Path Reference Rewriting

## Phase

PLAN mode complete → Ready for BUILD mode

## Key Decisions Made

1. **Split roots at engine level**: `ConversionOptions` gets `sourceRoot?` / `targetRoot?` falling back to `root`
2. **Path rewriting via two-pass emit**: Dry-run emit → build mapping → rewrite content → real emit
3. **Strict rewriting only**: Only rewrite paths to files being converted; warn about orphans
4. **New module**: `packages/engine/src/path-rewriter.ts` for all rewriting logic
5. **No plugin changes**: Plugins already accept `root` parameter; split is handled by engine
6. **Clone items before rewriting**: Prevent mutation side effects

## Affected Packages

- `@a16njs/models` — New warning code
- `@a16njs/engine` — Split roots, path rewriter module
- `a16n` CLI — New flags, directory resolution logic

## Latest Changes

- Comprehensive plan created in `memory-bank/tasks.md`
- All test behaviors identified (13 unit tests, 4 engine integration, 12 CLI/integration tests)
- No creative phases remaining — design is complete
