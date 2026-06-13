# Project Brief

**Parent L4 task:** v1-release-rollout (see `memory-bank/active/milestones.md`)

## User Story

As the maintainer of `a16n`, I want `npx a16n@latest` to install and run again so that users are not blocked by the poisoned `@a16njs/plugin-agentsmd@1.0.1`/`1.0.2` tarballs (literal `workspace:*` for `@a16njs/models`).

## Use-Case(s)

### Use-Case 1: Latest CLI installs cleanly

`npx a16n@latest` (currently `a16n@0.15.2`) resolves all dependencies and the binary runs without `EUNSUPPORTEDPROTOCOL`.

### Use-Case 2: Republished agentsmd has real internal pins

A new `@a16njs/plugin-agentsmd` patch (≥ 1.0.3) is published via the automated `pnpm publish` path with `@a16njs/models` rewritten to an exact registry version.

## Requirements

1. Publish a new `@a16njs/plugin-agentsmd` patch through the normal Release-Please → `pnpm publish` pipeline so `workspace:*` is rewritten.
2. Publish a new `a16n` CLI patch that exact-pins the corrected agentsmd (via pnpm rewrite at publish time; source stays `workspace:*`).
3. Preserve all L4 cross-milestone invariants (see `milestones.md`): source stays `workspace:*`, no behavioral code breaks, `docs` never published.
4. Optionally deprecate poisoned versions (`@a16njs/plugin-agentsmd@1.0.1`, `1.0.2`, `a16n@0.15.2`) with a clear message pointing to fixed versions.

## Constraints

1. Immutable npm versions cannot be edited; repair is forward-only via new publishes.
2. `bump-minor-pre-major: true` means a CLI `fix:` commit would bump to `0.16.0`; use per-package `release-as` in `release-please-config.json` to land `0.15.3` if a patch-only repair is preferred.
3. Operator merges the PR and Release-Please publishes; this sub-run produces the repo changes that make that release land correctly.
4. CI/publish hardening (tarball guards, repo-wide `publishConfig`) is **M2 scope** — do not expand into M2 here.

## Acceptance Criteria

1. After operator merge + publish: `npm view @a16njs/plugin-agentsmd@latest dependencies` shows an exact semver for `@a16njs/models`, not `workspace:*`.
2. After operator merge + publish: `npx a16n@latest --version` succeeds (install + run).
3. Source `package.json` files for `packages/plugin-agentsmd` and `packages/cli` still use `workspace:*` for internal deps.
4. A local/pre-merge test proves `pnpm pack` on agentsmd produces a tarball whose `package.json` dependencies contain no `workspace:` protocol.
