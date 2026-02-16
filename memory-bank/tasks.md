# Current Task: Fix All CLI Test Failures Before PR

**Complexity Level:** 2 (Simple Feature — Regression Restoration + Command Handler Extraction)
**Status:** COMPLETE

## Task Lifecycle
- [x] Planning complete
- [x] Build errors fixed (io.ts, OrphanPathRef ICONS, LocalWorkspace/toWorkspace in models)
- [x] parseIRFile workspace migration (23 parse tests fixed)
- [x] --from-dir, --to-dir, --rewrite-path-refs flags restored (10 tests fixed)
- [x] Extract handleConvert into commands/convert.ts (14 tests fixed)
- [x] Extract handleDiscover into commands/discover.ts (7 tests fixed)
- [x] Export createProgram factory from index.ts (5 tests fixed)
- [x] All tests pass (0 failures across entire monorepo)
- [x] Memory bank updated
- [x] Reflection complete (`memory-bank/reflection/reflection-pr-bugfixes.md`)

## What Was Done

### Build Error Fixes
1. Created `packages/cli/src/commands/io.ts` — `CommandIO` interface for testable CLI handlers
2. Added `'orphan-path-ref': '⚠'` to output.ts ICONS record
3. Moved `LocalWorkspace` and `toWorkspace()` to `@a16njs/models` (Phase 0 of workspace migration)

### Workspace Migration
4. Updated `parseIRFile` in plugin-a16n to use Workspace API (4-arg signature)
5. Updated discover.ts call site to match

### CLI Flag Restoration
6. Ported --from-dir, --to-dir, --rewrite-path-refs flags from main into branch's restructured CLI

### Command Handler Extraction (Architecture Completion)
7. Created `packages/cli/src/commands/convert.ts` — extracted convert logic into testable `handleConvert(engine, path, options, io)` using `CommandIO`
8. Created `packages/cli/src/commands/discover.ts` — extracted discover logic into testable `handleDiscover(engine, path, options, io)` using `CommandIO`
9. Refactored `packages/cli/src/index.ts` — exports `createProgram(engine)` factory, guards `program.parse()` behind `isMainModule` check

## Final Test Results
- 15/15 turbo tasks successful, 0 failures
- cli: 155 tests passed (7 test files)
- Total across monorepo: 807 tests passed
