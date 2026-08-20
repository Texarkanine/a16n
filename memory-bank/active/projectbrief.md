# Project Brief

## User Story

As a maintainer, I want `plugin-claude` to be clean under Oxlint correctness so leftover `eslint(no-unused-vars)` findings from [#74](https://github.com/Texarkanine/a16n/issues/74) / [#155](https://github.com/Texarkanine/a16n/pull/155) do not block a later green `pnpm lint`.

## Use-Case(s)

### Use-Case 1

A contributor runs `pnpm exec oxlint packages/plugin-claude` and gets a clean exit.

### Use-Case 2

Existing `@a16njs/plugin-claude` tests still pass after unused-binding cleanup.

## Requirements

1. Clear the 40 `eslint(no-unused-vars)` leftovers in `plugin-claude` emit tests, as specified in [issue #156](https://github.com/Texarkanine/a16n/issues/156).
2. Keep existing package tests passing.

## Constraints

1. Do not enable extra Oxlint rule categories.
2. Do not add lint to CI.
3. `oxlint --fix` does not clear these; edit by hand.
4. Unused-var cleanup is not new executable behavior. Do not write change-detector tests. Oxlint plus existing package tests are the validation.

## Acceptance Criteria

1. `pnpm exec oxlint packages/plugin-claude` is clean.
2. `pnpm --filter @a16njs/plugin-claude test` still passes.
