# Project Brief

**Parent L4 task:** v1-release-rollout (see `memory-bank/active/milestones.md`) — this brief scopes **Milestone 6** (documentation capstone + rollout cruft cleanup).

## User Story

As a future maintainer of `a16n`, I want a prominent, hard-to-miss runbook for adding a new publishable package — capturing the exact ordered steps and the traps that caused the M1 release thrash — so that the next person to add a package does not re-derive the pipeline's non-obvious rules by breaking production. As the current maintainer, I also want the spent release-rollout scaffolding removed so the repo does not carry latent release-config bugs.

## Use-Case(s)

### Use-Case 1: Adding a new publishable package

A contributor adds a new `@a16njs/*` package. They open `CONTRIBUTING.md`, find the "Adding a publishable package" runbook, and follow the ordered steps (publishConfig, workspace deps, first publish via `pnpm publish`, path-touching release commit, OIDC trusted publisher, post-publish verification) without hitting any of the four M1 traps. A `.cursor/rules/` rule points agents at the same runbook.

### Use-Case 2: Spent rollout scaffolding removed

Now that `a16n@1.0.0` is live, the spent `release-as: "1.0.0"` key on `packages/cli` is removed from `release-please-config.json`, so future CLI releases derive their version from conventional commits instead of being permanently pinned to `1.0.0`.

## Requirements

1. Add a prominent "Adding a publishable package" runbook to `CONTRIBUTING.md` (create the file if absent) capturing the ordered manual steps and the four M1 traps:
   1. `publishConfig.access: "public"` on scoped packages.
   2. Internal deps stay `workspace:*`; the **first** publish MUST use `pnpm publish` (never `npm publish`, which leaks `workspace:*` into the tarball).
   3. A release needs a path-touching commit; `release-as` alone does not cut one.
   4. A per-package **trusted publisher (OIDC)** must be configured on npmjs.com or the pipeline publish 404s.
2. Document the first-publish bootstrap (the OIDC chicken-and-egg) and the post-publish verification commands (`npm view <pkg>@<ver> dependencies` shows no `workspace:`; attestations/provenance present).
3. Capture the **dissolved-M2** lesson: the pipeline already publishes correctly via `pnpm publish`; because pnpm's `workspace:` rewrite is non-standard, the *post-publish tarball verification* is the real safety net — not any in-pipeline guard. Manual `npm publish` is the documented failure to avoid.
4. Add a `.cursor/rules/` rule that points to the runbook (so agents adding a package are routed to it).
5. **Cleanup:** remove the spent `release-as: "1.0.0"` key from `packages/cli` in `release-please-config.json` (last remaining spent rollout key).

## Constraints

1. Documentation + one rule file + one config-key removal. No code or product behavior changes.
2. Preserve all L4 cross-milestone invariants: source inter-package deps stay `workspace:*`; `docs` never published; agentsmd never regresses; `a16n@latest` stays installable.
3. Keep the `## Stability` README sections (they are real docs, not scaffolding) and the `workspace-publish-invariant`/`publish-shape` tests (permanent guards).

## Acceptance Criteria

1. `CONTRIBUTING.md` contains the runbook with all four traps, the OIDC bootstrap, the post-publish verification, and the dissolved-M2 lesson.
2. A `.cursor/rules/` rule references the runbook.
3. `release-please-config.json` no longer declares `release-as` for `packages/cli`; no other `release-as` keys remain.
4. Full test suite green; no runtime/behavioral changes; source still `workspace:*`.
