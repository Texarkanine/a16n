# Task: issue-161 unused-vars in glob-hook and docs

* Task ID: issue-161
* Complexity: Level 2
* Type: bug fix (leftover oxlint unused-vars)

Clear the two grouped `eslint(no-unused-vars)` leftovers from [#161](https://github.com/Texarkanine/a16n/issues/161): unused `HookInput` type import in glob-hook `test/io.test.ts`, unused `dirname` import in docs `scripts/generate-cli-docs.ts`. One change set. No extra Oxlint categories, no CI, no change-detector tests.

## Test Plan (TDD)

### Behaviors to Verify

- Unused type import: `packages/glob-hook/test/io.test.ts` imports `HookInput` but never uses it → remove it; `HookOutput` stays because `writeOutput` tests annotate with it
- Unused value import: `packages/docs/scripts/generate-cli-docs.ts` imports `dirname` from `node:path` but never calls it → remove it; `join` stays
- Oxlint gate: `pnpm exec oxlint packages/glob-hook packages/docs` → exit 0, no diagnostics
- Regression: `pnpm --filter @a16njs/glob-hook test` → existing io/matcher/cli suites still pass
- Regression: `pnpm --filter docs test` → existing `generate-cli-docs.test.ts` and sibling docs tests still pass

### Edge Cases

- Do not drop `HookOutput` (used at `io.test.ts:52`)
- Do not drop `join` (used throughout `generate-cli-docs.ts`)
- Invalid/empty inputs and parseStdin null cases already covered in existing `io.test.ts`; markdown generation already covered in `packages/docs/test/generate-cli-docs.test.ts`
- A new Vitest case that only fails if someone re-adds these unused imports is a change-detector — do not add one. Oxlint is the checker (same as #74)

### Test Infrastructure

- Framework: Vitest (`vitest run` in each package)
- Test location: `packages/glob-hook/test/`, `packages/docs/test/`
- Conventions: flat `*.test.ts` next to package; docs already imports `generate-cli-docs.js` exports
- New test files: none
- Lint checker: root Oxlint (`.oxlintrc.json`, correctness as error) — `pnpm exec oxlint packages/glob-hook packages/docs`

## Implementation Plan

0. Confirm the existing red check (do not write new tests)
   - Files: none
   - Changes: `pnpm exec oxlint packages/glob-hook packages/docs` already fails on `HookInput` (`io.test.ts:3`) and `dirname` (`generate-cli-docs.ts:17`). That is the failing checker. New Vitest cases that only fail if those imports return would be change-detectors.
1. Drop unused `HookInput` from the type import in glob-hook io tests
   - Files: `packages/glob-hook/test/io.test.ts`
   - Changes: `import type { HookInput, HookOutput }` → `import type { HookOutput }`
2. Confirm glob-hook still behaves
   - Files: none additional
   - Changes: `pnpm --filter @a16njs/glob-hook test`; `pnpm exec oxlint packages/glob-hook` should be clean
3. Drop unused `dirname` from the path import in CLI docs generator
   - Files: `packages/docs/scripts/generate-cli-docs.ts`
   - Changes: `import { join, dirname } from 'node:path'` → `import { join } from 'node:path'`
4. Confirm docs still behaves and the grouped gate is green
   - Files: none additional
   - Changes: `pnpm --filter docs test`; `pnpm exec oxlint packages/glob-hook packages/docs` clean

## Preflight Findings

- TDD: no new executable behavior; unused imports have no runtime effect. Oxlint is already red. Change-detector tests are forbidden (issue + always-tdd).
- Conventions / deps / conflicts: in-place import edits only; glob-hook is standalone; `generate-cli-docs.ts` exports unchanged.
- Completeness: both leftovers, grouped gate, no extra categories, no CI.

## Technology Validation

No new technology - validation not required

## Dependencies

- Existing `oxlint` at repo root (already installed)
- Existing Vitest scripts in `@a16njs/glob-hook` and `docs`

## Challenges & Mitigations

- Preflight TDD FAIL (happened on #74 when lint wiring had no new unit test): document that oxlint is the tester and the operator forbade change-detector tests; cite #74 / Texarkanine/.cursor-rules#116
- Removing the used import by mistake (`HookOutput` or `join`): keep both; existing tests fail immediately if they go missing

## Pre-Mortem

- Preflight treats "no new tests" as a process fail: already covered by Challenge 1; this run uses Grok-only preflight models
- Splitting the two packages into separate PRs: rejected by the issue ("stay grouped")
- Enabling extra Oxlint categories to "help": rejected by the issue and brief

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [ ] Build
- [ ] QA
