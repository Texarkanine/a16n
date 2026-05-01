---
task_id: glob-hook-test-env-fix
complexity_level: 2
date: 2026-05-01
status: completed
---

# TASK ARCHIVE: Fix glob-hook test environment / document correct test invocation

## SUMMARY

Fixed `runCli` in `packages/glob-hook/test/cli.test.ts` to use `cwd: join(__dirname, '..')` instead of `cwd: process.cwd()`, so `npx tsx` resolves the package-local binary when Vitest runs from the monorepo root. All 12 CLI integration tests pass within the default timeout. Updated `CONTRIBUTING.md` with copy-pasteable test invocation patterns and corrected `memory-bank/techContext.md` so the Testing Process section reflects Turbo/per-package config as canonical.

## REQUIREMENTS

- `pnpm test` (Turbo) remains canonical and unaffected.
- Direct Vitest invocations from the monorepo root must not break for glob-hook CLI tests.
- Code fix covered by existing CLI integration tests (no new test cases required).
- Discoverable documentation for single test / file / package invocation.

All requirements and acceptance criteria were met. QA additionally corrected a CONTRIBUTING.md note that was framed from the pre-fix perspective (implying glob-hook still needed special invocation after the cwd fix).

## IMPLEMENTATION

| Area | Change |
|------|--------|
| `packages/glob-hook/test/cli.test.ts` | `runCli`: `cwd` set to package root via `join(__dirname, '..')` so `npx` resolves `tsx` from `packages/glob-hook/node_modules/.bin/`. |
| `CONTRIBUTING.md` | Expanded "Running Tests" with patterns for full suite, filtered package, single file, and `-t` by name; note aligned with post-fix behavior. |
| `memory-bank/techContext.md` | Clarified that `pnpm test` via Turbo uses per-package Vitest config; root config is fallback for ad-hoc runs. |

One-line behavioral fix; documentation and tech context updates paired with it.

## TESTING

- **RED→GREEN:** Existing 12 tests in `cli.test.ts` were the contract; they failed from repo root before the fix and pass after.
- **Regression:** `pnpm --filter @a16njs/glob-hook test` and `cd packages/glob-hook && pnpm test` verified.
- **Root invocation:** `npx vitest run packages/glob-hook/test/cli.test.ts` from monorepo root passes within default timeouts.
- **QA:** Semantic review caught inaccurate CONTRIBUTING wording; fixed before archive.

## LESSONS LEARNED

### Technical

- `npx` resolves binaries by searching upward from the child process `cwd`. In a pnpm monorepo, devDependencies like `tsx` may exist only under `packages/<pkg>/node_modules/.bin/`. Integration tests that spawn `npx` should set `cwd` to the package root (or deeper), not `process.cwd()` when Vitest may run from the repo root.
- Vitest injects `__dirname` in ESM-mode test files; this file already used it for paths—extending that pattern for `cwd` was low risk.

### Process

- Documentation written during a fix often describes the *problem* ("if you have X, do Y") instead of *post-fix reality* ("everyone can do Z"). Prefer writing docs as if the fix is already shipped.
- QA’s doc-accuracy pass caught confusion that tests alone cannot (CONTRIBUTING implied special-case invocation while tests worked from root).

## PROCESS IMPROVEMENTS

- Consider making "confirm RED state before coding" an explicit checklist step for TDD tasks where existing tests are the RED harness.
- For future packages with spawned CLI integration tests, a shared helper (e.g. package root from `__dirname`) plus lint enforcement could prevent recurrence.

## TECHNICAL IMPROVEMENTS

- **Future:** A repo-wide `getPackageRoot()` (or similar) for spawned-process tests, optionally enforced by lint, would generalize the glob-hook pattern when more packages add similar suites.
- **Advisory (from preflight):** Optional `vitest.workspace.ts` at root could make per-package config delegation structural; not required for this task.

## NEXT STEPS

None. Optional follow-ups above are backlog suggestions, not blockers.
