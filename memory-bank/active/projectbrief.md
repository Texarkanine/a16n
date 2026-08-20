# Project Brief

## User Story

As a maintainer, I want the leftover Oxlint `unused-vars` findings in `@a16njs/glob-hook` and `docs` cleared so that `pnpm exec oxlint packages/glob-hook packages/docs` is clean without enabling extra rule categories or adding lint to CI.

## Use-Case(s)

### Use-Case 1

Run `pnpm exec oxlint packages/glob-hook packages/docs` after #74 / #155 and get zero diagnostics.

### Use-Case 2

Keep existing package tests green: `pnpm --filter @a16njs/glob-hook test` and `pnpm --filter docs test`.

## Requirements

1. Clear the two grouped `eslint(no-unused-vars)` leftovers from [#161](https://github.com/Texarkanine/a16n/issues/161):
   - `packages/glob-hook/test/io.test.ts` — unused `HookInput` type import
   - `packages/docs/scripts/generate-cli-docs.ts` — unused `dirname` import
2. Stay grouped in one change set / one PR later (do not split the packages).
3. Do not enable extra Oxlint categories.
4. Do not add lint to CI.
5. Do not add change-detector tests. Oxlint plus existing package tests are the verification.

## Constraints

1. Work only in worktree `/home/mobaxterm/.cursor/worktrees/oxlint-161-glob-hook-docs/a16n` on `fix/oxlint-161-glob-hook-docs`.
2. `oxlint --fix` does not clear these; edits must be manual.
3. Stop after REFLECT; do not archive or open a PR in this run.

## Acceptance Criteria

1. `pnpm exec oxlint packages/glob-hook packages/docs` exits 0 with no unused-vars (or other) diagnostics.
2. `pnpm --filter @a16njs/glob-hook test` passes.
3. `pnpm --filter docs test` passes (docs has a `test` script).
4. No new Oxlint categories, CI wiring, or change-detector tests.
