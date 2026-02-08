# Memory Bank: Active Context

## Current Focus

Level 3 Feature: Split Read/Write Directories & Path Reference Rewriting

## Phase

BUILD mode complete → Ready for REFLECT mode

## Key Decisions Made

1. **Split roots at engine level**: `ConversionOptions` gets `sourceRoot?` / `targetRoot?` falling back to `root`
2. **Path rewriting via two-pass emit**: Dry-run emit → build mapping → rewrite content → real emit
3. **Strict rewriting only**: Only rewrite paths to files being converted; warn about orphans
4. **New module**: `packages/engine/src/path-rewriter.ts` for all rewriting logic
5. **No plugin changes**: Plugins already accept `root` parameter; split is handled by engine
6. **Clone items before rewriting**: Prevent mutation side effects
7. **Well-known plugin patterns**: `PLUGIN_PATH_PATTERNS` map in engine for orphan detection

## Implementation Summary

### Files Modified
- `packages/models/src/warnings.ts` — Added `OrphanPathRef` warning code
- `packages/engine/src/index.ts` — Added `sourceRoot`, `targetRoot`, `rewritePathRefs` to `ConversionOptions`; two-pass emit logic; `PLUGIN_PATH_PATTERNS`
- `packages/engine/src/path-rewriter.ts` — **NEW** — `buildMapping()`, `rewriteContent()`, `detectOrphans()`
- `packages/cli/src/index.ts` — Added `--from-dir`, `--to-dir`, `--rewrite-path-refs` flags; directory validation; split root resolution
- `packages/cli/src/output.ts` — Added `OrphanPathRef` icon and hint

### Files Added (Tests)
- `packages/engine/test/path-rewriter.test.ts` — **NEW** — 13 unit tests (P1-P13)
- `packages/engine/test/engine.test.ts` — 4 new tests (EP1-EP4)
- `packages/cli/test/cli.test.ts` — 10 new tests (C1-C8, rewrite-path-refs)
- `packages/cli/test/integration/integration.test.ts` — 6 new integration tests (I1-I3, CI1-CI3)

### Test Results
- **All 126 CLI tests pass** (53 cli.test.ts + 32 integration + 41 git-ignore)
- **All 33 engine tests pass** (20 engine.test.ts + 13 path-rewriter.test.ts)
- **Full monorepo: 15/15 turbo tasks successful**
