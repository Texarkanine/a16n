---
task_id: cli-coverage-hardening
complexity_level: 2
date: 2026-03-06
status: completed
---

# TASK ARCHIVE: CLI Coverage Hardening

## SUMMARY

Improved correctness-oriented test coverage for `packages/cli` by excluding interface-only files from coverage, documenting the E2E subprocess coverage limitation, and adding 10 behavioral unit tests for `handleDeleteSource` safety guards and `handleGitIgnoreMatch` routing. Coverage rose from 78% to 87% overall; `convert.ts` from 64% to 82% (functions 100%). All 174 tests pass.

## REQUIREMENTS

- Exclude pure-interface files (e.g. `io.ts`) from coverage reporting
- Determine whether E2E subprocess tests can contribute to coverage; document recommendation
- Add unit tests for `handleDeleteSource`: path traversal guard, skippedSources preservation, unlink failure handling
- Add unit tests for `handleGitIgnoreMatch`: new-file routing (gitignore/exclude/tracked), mixed-status and different-file conflict detection, existing-file conflict scenarios
- Do not unit test output formatting specifics; every test must validate a real behavior

## IMPLEMENTATION

- **packages/cli/vitest.config.ts**: Added `src/commands/io.ts` to `coverage.exclude`
- **packages/cli/test/cli.test.ts**: Added NOTE that E2E tests use spawnSync and do not contribute to v8 coverage (vitest-dev/vitest#7064)
- **packages/cli/test/commands/convert.test.ts**: Added imports (`WarningCode`, `isGitIgnored`, `isGitTracked`, `addToGitIgnore`, `addToGitExclude`); two new describe blocks:
  - **handleDeleteSource safety guards**: B1 (path traversal refusal), B2 (skippedSources preserved), B3 (unlink failure reported, other sources still processed)
  - **handleGitIgnoreMatch routing** (inside existing git-ignore match mode block): B4–B10 covering routing to .gitignore / .git/info/exclude, all-tracked skip, mixed-status and different-files conflict, existing-file conflict (tracked+ignored sources, ignored output+tracked sources). Added `beforeEach(() => vi.clearAllMocks())` to avoid mock call state leaking between tests.

## TESTING

- Full CLI test suite: 174 tests passed (unit, integration, E2E)
- Coverage run: `pnpm test:coverage` in packages/cli — io.ts excluded, convert.ts 81.83% statements, 100% functions
- Lint and typecheck: clean
- QA phase: PASS (KISS/DRY/YAGNI/completeness/regression/integrity)

## LESSONS LEARNED

- **Technical**: vitest `vi.mock` at describe-level keeps a persistent mock scope; mock *call state* accumulates across sibling `it` blocks. When asserting `not.toHaveBeenCalled`, pair with `beforeEach(() => vi.clearAllMocks())` in that describe block.
- **E2E coverage**: Vitest does not collect coverage from subprocesses (issue #7064). NODE_V8_COVERAGE + merge tooling is possible but not worth the complexity; unit tests on critical paths are the right lever.

## PROCESS IMPROVEMENTS

- None. Two-phase flow (L1 analysis → L2 implementation) fit this "analyze then act" task well.

## TECHNICAL IMPROVEMENTS

- **Million-dollar question**: If behavioral coverage had been assumed from the start, `handleGitIgnoreMatch` could separate "compute routing plan" (pure: sources → decisions) from "apply plan" (side effects). A `planGitIgnoreRouting()` → `applyGitIgnoreRouting()` split would make routing testable with zero mocks. Not worth refactoring now; consider if the function grows.

## NEXT STEPS

None.
