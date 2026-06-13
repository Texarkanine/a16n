# Active Context

## Current Task: v1-release-rollout-m2
**Phase:** PLAN - COMPLETE

## What Was Done
- Completed L4 Milestone 1 (verified `a16n@latest` installable on npm) and advanced the milestone list.
- Classified Milestone 2 as **Level 3**; re-scoped `projectbrief.md`, wrote fresh `progress.md`.
- Authored the L3 plan in `tasks.md`: (1) add `publishConfig.access: "public"` to 6 scoped packages, (2) a unit-tested pure analyzer `analyzePublishSet` hosted in `packages/cli/`, (3) a thin guard entry script that packs released tarballs and verifies them before any publish, (4) wire the guard + dependency-safe publish order into `release.yaml`.
- Resolved design in-plan (no CREATIVE needed): pack-all→verify-all→publish; guard lives in CLI package so per-package `pnpm test` runs it; `registryHas` injected for offline-testable logic.
- Verified `pnpm publish` already no-ops on private `docs` → requirement #4 is a regression guard, not a fix.

## Operator Decisions (post-preflight, 2026-06-13)
- **Remove** `packages/plugin-agentsmd/test/publish-shape.test.ts` — its access + workspace checks are now covered repo-wide (the new access guard + existing `workspace-publish-invariant.test.ts`). Sequence the deletion *after* the repo-wide access assertion lands.
- **Keep the guard as `.mjs`**, but require a concise header comment in the guard file explaining why it is plain ESM (no build/loader in the publish job) — not verbose.
- **Bring the PR-time guard into scope** ("that's CI's job"): reuse the analyzer in `ci.yaml` to pack publishable packages and fail a PR if any tarball leaks `workspace:`. Scope now includes `ci.yaml`.

## Next Step
- Plan + brief amended for the three decisions and preflight re-affirmed. Operator gate: run `/niko-build`.
