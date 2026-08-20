# Task: Issue #157 CLI Unused-Variable Cleanup

* Task ID: issue-157
* Complexity: Level 2
* Type: simple enhancement

Remove the 11 unused declarations that Oxlint reports in the CLI package's test suites so `pnpm exec oxlint packages/cli` is clean, without changing executable behavior, enabling extra Oxlint categories, adding lint to CI, or adding change-detector tests.

The current leftovers, confirmed by `pnpm exec oxlint packages/cli` on this worktree:

| File | Unused declaration |
| --- | --- |
| `packages/cli/test/create-program.test.ts` | `afterEach` import |
| `packages/cli/test/commands/convert.test.ts` | `CommandIO` type import |
| `packages/cli/test/commands/discover.test.ts` | `CommandIO` type import |
| `packages/cli/test/git-ignore.test.ts` | `GitIgnoreResult` and `IgnoreSource` type imports |
| `packages/cli/test/integration/integration-split-dirs.test.ts` | unused `fixturesDir` plus its unused `fixturesDirFor` import |
| `packages/cli/test/integration/integration-path-rewrite.test.ts` | unused `fixturesDir` plus its unused `fixturesDirFor` import |
| `packages/cli/test/e2e/cli-convert.test.ts` | unused `stdout` destructure in two cases |
| `packages/cli/test/e2e/cli-from-to-dir.test.ts` | unused `stdout` destructure |
| `packages/cli/test/e2e/cli-gitignore.test.ts` | unused `stdout` destructure |

`oxlint --fix` does not clear these. Remove the unused bindings and imports; do not prefix them with `_`.


## Test Plan (TDD)

This cleanup does not change executable behavior. New tests would only go red when someone edits the cleaned declarations, so they are change-detectors and are out of scope. The already-failing Oxlint run is the red step; the existing CLI package suite is the regression gate.

### Behaviors to Verify

- [Oxlint clean]: `pnpm exec oxlint packages/cli` → no findings
- [CLI tests still pass]: `pnpm --filter a16n test` → all existing unit, integration, and e2e cases pass
- [Unused imports gone]: remove `afterEach`, `CommandIO`, `GitIgnoreResult`, and `IgnoreSource` type/value imports that Oxlint flags → those identifiers no longer appear in the listed files
- [Unused locals gone]: remove unused `fixturesDir` constants and unused `stdout` destructure bindings → sibling assertions on `exitCode`, `stderr`, and filesystem outcomes remain unchanged
- [No leftover unused helpers]: after removing `fixturesDir`, also drop `fixturesDirFor` from those two integration imports so Oxlint does not report a new unused import
- [Scope held]: `.oxlintrc.json` and CI workflows are untouched → no extra rule categories and no lint-in-CI change
- [Empty leftover]: a later Oxlint run on `packages/cli` still reports zero findings after the nine files are cleaned

### Test Infrastructure

- Framework: Vitest (package `a16n`, config `packages/cli/vitest.config.ts`) plus root Oxlint (`.oxlintrc.json`)
- Test location: `packages/cli/test/` with unit tests shadowing `src/`, `test/integration/` for fixture-based engine tests, and `test/e2e/` for subprocess specs via `test-support/cli-runner.ts`
- Conventions: existing `describe`/`it` suites; no new files or cases
- New test files: none

## Implementation Plan

1. Confirm the red Oxlint baseline (already recorded: 11 `eslint(no-unused-vars)` findings, exit code 1).
   - Files: none
   - Changes: use the current `pnpm exec oxlint packages/cli` output as the failing check that this cleanup must turn green

2. Remove unused type and value imports in the unit suites.
   - Files: `packages/cli/test/create-program.test.ts`, `packages/cli/test/commands/convert.test.ts`, `packages/cli/test/commands/discover.test.ts`, `packages/cli/test/git-ignore.test.ts`
   - Changes: drop `afterEach` from the vitest import in `create-program.test.ts`; delete the unused `import type { CommandIO }` lines in `convert.test.ts` and `discover.test.ts`; drop `type GitIgnoreResult` and `type IgnoreSource` from the `git-ignore.js` import while keeping `getIgnoreSource` and the other used value imports

3. Remove unused fixture helpers in the two integration suites.
   - Files: `packages/cli/test/integration/integration-split-dirs.test.ts`, `packages/cli/test/integration/integration-path-rewrite.test.ts`
   - Changes: delete `const fixturesDir = fixturesDirFor(import.meta.url);` and remove `fixturesDirFor` from the `integration-helpers.js` import. Leave `createIntegrationEngine` and `suiteTempDir` in place.

4. Drop unused `stdout` bindings from e2e `runCli` destructures.
   - Files: `packages/cli/test/e2e/cli-convert.test.ts` (verbose-flag case around line 94 and rewrite-path-refs case around line 135), `packages/cli/test/e2e/cli-from-to-dir.test.ts` (to-dir case around line 42), `packages/cli/test/e2e/cli-gitignore.test.ts` (gitignore match case around line 119)
   - Changes: destructure only the used fields (`stderr`/`exitCode` or `exitCode`). Do not touch the neighboring `--verbose --json` case that still asserts on `stdout`.

5. Re-run the two required gates.
   - Files: none
   - Changes: `pnpm exec oxlint packages/cli` must be clean; `pnpm --filter a16n test` must pass. No documentation, config, or CI edits.

## Technology Validation

No new technology - validation not required

## Dependencies

- Existing Oxlint (`oxlint` 1.79.0 at the workspace root) and the current `.oxlintrc.json` correctness-as-error setup
- Existing CLI Vitest suite via `pnpm --filter a16n test`
- Worktree `node_modules` (installed in this session)

## Challenges & Mitigations

- [Removing `fixturesDir` leaves `fixturesDirFor` unused]: delete the helper import in the same edit so Oxlint does not report a replacement unused-var
- [Over-trimming a `runCli` destructure that still needs `stdout`]: only the four flagged bindings are unused; leave the `--verbose --json` case in `cli-convert.test.ts` that parses `stdout`
- [Tests fail after import cleanup because a type was used later]: grep already shows each flagged identifier appears only on its import/declaration line

## Pre-Mortem

- [Cleanup is treated as a behavior change and someone adds change-detector tests]: the plan forbids new tests; Oxlint plus the existing package suite are the only gates
- [Scope creeps into rule config or CI]: already excluded by the brief; implementation steps name only the nine test files
- [A leftover unused import after deleting `fixturesDir` makes Oxlint still fail]: already covered by Challenge 1
- [The task is actually a broader leftover-oxlint program]: no — this ticket is the CLI package slice of #156–#161; other packages stay out of this branch

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA

## Build Notes

- Step 1: Oxlint baseline was already red (11 unused-vars).
- Steps 2–4: removed the unused imports, `fixturesDir`/`fixturesDirFor`, and unused `stdout` bindings in the nine listed files.
- Step 5: `pnpm exec oxlint packages/cli` is clean. `pnpm --filter a16n test` needed a prior `pnpm build` in this fresh worktree, then 229/229 passed.
