# Project Brief

## User Story

As a maintainer, I want leftover `eslint(no-unused-vars)` findings in `@a16njs/plugin-a16n` cleared so that package-scoped Oxlint is clean without changing exported plugin behavior.

## Use-Case(s)

### Use-Case 1

A developer runs `pnpm exec oxlint packages/plugin-a16n` after this cleanup and sees no unused-vars (and no other correctness) errors.

### Use-Case 2

Existing `@a16njs/plugin-a16n` tests still pass after unused bindings are omitted or underscore-prefixed.

## Requirements

As described in [a16n#159](https://github.com/Texarkanine/a16n/issues/159):

1. Clear the **9** leftover `eslint(no-unused-vars)` findings in `plugin-a16n` src and tests.
2. Touch only the listed files: `src/discover.ts` (2), `src/index.ts` (2), `test/emit.test.ts` (2), `test/parse.test.ts` (2), `test/discover.test.ts` (1).
3. In `src/`, prefer underscore prefix or omit unused bindings; do not change exported behavior or required signatures.
4. Validate with Oxlint plus existing package tests. Do not write change-detector tests.

## Constraints

1. Do not enable extra Oxlint rule categories.
2. Do not add lint to CI.
3. `oxlint --fix` does not clear these; fix by hand.
4. Unused-var cleanup is not new executable behavior.

## Acceptance Criteria

1. `pnpm exec oxlint packages/plugin-a16n` is clean.
2. `pnpm --filter @a16njs/plugin-a16n test` still passes.
