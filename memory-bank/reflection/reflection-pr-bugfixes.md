# Task Reflection: Fix All Bugs Before PR on plugin-cursorrules Branch

**Feature ID:** pr-bugfixes
**Date of Reflection:** 2026-02-15
**Complexity Level:** 2 (Simple Feature — Regression Restoration + Command Handler Extraction)

## Brief Summary

Fixed all build errors and test failures on the `plugin-cursorrules` branch to prepare it for PR. The work spanned four categories: build error fixes (3), workspace API migration for parseIRFile (23 tests), CLI flag restoration from main (10 tests), and command handler extraction to complete the architectural redesign (26 tests). Final result: 807 tests passing, 0 failures across the monorepo.

## 1. What Went Well

- **Tests as specification:** The existing tests were well-written and served as exact specifications for what needed to be implemented. The `convert.test.ts`, `discover.test.ts`, and `create-program.test.ts` tests defined the `handleConvert`, `handleDiscover`, and `createProgram` contracts precisely — no ambiguity about what was expected.

- **Incremental approach:** Fixing issues in order of dependency (build errors → workspace migration → CLI flags → handler extraction) meant each fix unblocked the next batch of tests. This made progress measurable and prevented confusion.

- **Git history as reference:** Using `git merge-base`, `git log`, and `git show` to find the reference implementation on `main` for the --from-dir/--to-dir/--rewrite-path-refs flags saved significant time vs reimplementing from scratch.

- **Clean extraction:** The convert handler extraction preserved the full git-ignore match mode logic (300+ lines of complex conflict resolution code) without any behavioral changes. All 53 CLI integration tests passed on the first run after extraction.

## 2. Challenges Encountered

- **Module-level side effects:** The initial `createProgram` export attempt failed because `program.parse()` ran at module top-level when tests imported the module. Commander called `process.exit(1)` because test processes don't have the expected CLI args. Solution: guarded `program.parse()` behind an `isMainModule` check using `import.meta.url` comparison.

- **Unicode character mismatch:** The git-ignore match mode output used `→` (Unicode right arrow, U+2192) in the original code. During extraction, I initially wrote `->` (ASCII), causing a regex test failure. Small detail but caught by the existing test.

- **Misidentifying failures as "pre-existing":** Early in the session, I incorrectly categorized some test failures as "pre-existing and not related to my changes." The user correctly pushed back: broken tests must always have a plan to fix, regardless of when they broke. This is a critical mindset correction — you can't ship broken code, period.

## 3. Lessons Learned

- **Never declare failures "pre-existing" as a way to avoid fixing them.** Every failing test needs a resolution plan. If it truly can't be fixed in the current scope, that needs explicit discussion with the user, not a dismissive label.

- **Check for module-level side effects when extracting exports.** Any module that calls `process.exit()` or `program.parse()` at the top level will break when imported by tests. Always guard entry-point behavior behind a main-module check.

- **Read tests before implementing.** The test files were the single best source of truth for what the implementation needed to do. Reading them first would have prevented guesswork.

- **Workspace migration is mechanical but error-prone in call sites.** The parseIRFile signature change (3-arg → 4-arg) required updating the call site in discover.ts. It's easy to miss dependent call sites in a monorepo.

## 4. Process Improvements

- **Run `pnpm build && pnpm test` early and often.** The build-test cycle caught issues quickly and prevented compounding errors.

- **When extracting command handlers from a CLI, start by reading the test expectations for the handler.** The test defines the exact function signature, options type, and behavioral contract. This is more reliable than reverse-engineering from the inline implementation.

- **Track tasks on disk.** The user explicitly reminded me to keep the memory bank task list updated on disk as I work. This persistence ensures continuity across context windows and sessions.

## 5. Files Changed

### New Files
- `packages/cli/src/commands/io.ts` — CommandIO interface
- `packages/cli/src/commands/convert.ts` — handleConvert + ConvertCommandOptions
- `packages/cli/src/commands/discover.ts` — handleDiscover + DiscoverCommandOptions

### Modified Files
- `packages/cli/src/index.ts` — Refactored to createProgram factory + isMainModule guard
- `packages/cli/src/output.ts` — Added orphan-path-ref to ICONS
- `packages/models/src/workspace.ts` — Added LocalWorkspace class + toWorkspace helper
- `packages/models/src/index.ts` — Added LocalWorkspace + toWorkspace exports
- `packages/engine/src/workspace.ts` — Re-exports LocalWorkspace + toWorkspace from models
- `packages/plugin-a16n/src/parse.ts` — Workspace-based parseIRFile (4-arg signature)
- `packages/plugin-a16n/src/discover.ts` — Updated parseIRFile call site
