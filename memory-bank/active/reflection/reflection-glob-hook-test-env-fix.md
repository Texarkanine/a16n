---
task_id: glob-hook-test-env-fix
date: 2026-04-30
complexity_level: 2
---

# Reflection: Fix glob-hook test environment / document correct test invocation

## Summary

Fixed `runCli` in `packages/glob-hook/test/cli.test.ts` to use a `__dirname`-relative `cwd` instead of `process.cwd()`, making all 12 CLI integration tests pass when Vitest is invoked from the monorepo root. Accompanied by CONTRIBUTING.md and techContext.md documentation updates. All requirements met.

## Requirements vs Outcome

All four requirements and all three acceptance criteria were fully satisfied:
- `pnpm test` (Turbo) remains canonical and unaffected
- `npx vitest run packages/glob-hook/test/cli.test.ts` from the monorepo root now passes
- CI continues to pass unchanged
- CONTRIBUTING.md documents per-package, per-file, and per-test invocation patterns

One addition not in the original plan: QA caught that the CONTRIBUTING.md note was framed from the pre-fix perspective (implying glob-hook was still an exception), which contradicted the fix. Corrected to reflect post-fix reality.

## Plan Accuracy

The plan was accurate on every dimension — correct files, correct approach, correct scope. The only gap was a "confirm RED state before coding" step not being explicit in the numbered steps, but this was handled naturally during execution. No surprises from dependencies, ESM behavior, or `__dirname` availability.

## Build & QA Observations

Build was one of the cleanest possible: a single-line change with an immediately verifiable result (RED→GREEN). QA performed its intended function: surfacing a semantic inaccuracy that lint, build, and tests cannot catch — the CONTRIBUTING.md note described the old broken behavior from the problem's perspective rather than the fix's perspective. This is a subtle but common trap in documentation written mid-implementation.

## Insights

### Technical

- `npx` resolves binaries by searching upward from the spawning process's `cwd`. In a pnpm monorepo without workspace-level hoisting, `tsx` only exists in `packages/glob-hook/node_modules/.bin/`. Spawned child processes need `cwd` set at the package root or lower for `npx` binary resolution to work correctly. This is the general pattern for any package with a CLI integration test suite that spawns package-local binaries.
- `__dirname` is available in Vitest test files in ESM-mode packages — Vitest's transform layer injects it. The file already relied on this for `CLI_PATH` and `FIXTURES_PATH`, making the fix zero-risk.

### Process

- Documentation updates written during implementation tend to be framed from the "problem being fixed" perspective ("packages with X issue should do Y") rather than the "post-fix reality" perspective ("all packages work with Z"). The rule: write docs as if the fix is already deployed and the reader doesn't need to know there ever was a problem.
- QA's documentation accuracy check has real value beyond formatting. The CONTRIBUTING.md catch would have created developer confusion ("wait, this note says I need special invocation but the test file clearly works from root").

### Million-Dollar Question

The truly elegant from-first-principles solution would be a project-wide test helper utility (e.g., `getPackageRoot()` based on `__dirname`) that all integration test files with spawned child processes use, enforced by a lint rule. This would make the pattern impossible to get wrong in future packages. The current fix is clean and correct for its scope; the broader pattern is the next step for a future task if more packages develop CLI integration tests with spawned processes.
