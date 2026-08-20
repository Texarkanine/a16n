# Project Brief

## User Story

As a contributor (human or LLM), I want `npm run lint` to run Oxlint so I can optionally lint the repo without CI gating, and so we can inventory remaining violations for later per-package fix tickets.

## Use-Case(s)

### Use-Case 1

A developer (or agent) runs `npm run lint` / `pnpm lint` and gets a real Oxlint pass/fail instead of Turbo running zero package scripts.

### Use-Case 2

After install, we apply only truly safe Oxlint autofixes, then inventory remaining violations by package so follow-up tickets can be opened one package at a time.

### Use-Case 3

This work lands on `main` via a PR. CI is not changed to require lint. Later PRs (probably one per package) fix leftover issues.

## Requirements

1. Install Oxlint and bind the existing root `lint` script so `npm run lint` actually lints, as described in [issue #74](https://github.com/Texarkanine/a16n/issues/74) and the [Oxlint usage guide](https://oxc.rs/docs/guide/usage/linter.html).
2. Apply only truly safe Oxlint autofixes as part of this change.
3. Inventory remaining violations (counts and which packages) so we know what needs its own ticket.
4. Open a PR to `main` when this install/inventory work is done.

## Constraints

1. Do not bind lint into CI in this PR.
2. Do not attempt a repo-wide unsafe cleanup of lint issues here.
3. Follow-up fix work is out of scope except for truly safe autofix.

## Acceptance Criteria

1. `npm run lint` / `pnpm lint` runs Oxlint (not a no-op Turbo fan-out).
2. CI workflows are unchanged with respect to requiring lint.
3. Remaining violations are inventoried by package and recorded for ticket planning.
4. A PR targeting `main` is opened for this change.
