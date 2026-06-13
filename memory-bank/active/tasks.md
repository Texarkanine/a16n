# Current Task: v1-release-rollout-m6

**Complexity:** Level 1

## Build — COMPLETE

- [x] `CONTRIBUTING.md`: added **Releases** + **Adding a publishable package** runbook — the four M1 traps (publishConfig.access, workspace-deps + first publish via `pnpm publish`, path-touching commit, per-package OIDC), the first-publish OIDC bootstrap, post-publish tarball verification, and the dissolved-M2 lesson (tarball verification is the real safety net).
- [x] `.cursor/rules/shared/publishing-packages.mdc`: agent-requested rule routing to the runbook, with the load-bearing rules summarized.
- [x] **Cleanup:** removed the spent `release-as: "1.0.0"` key from `packages/cli` in `release-please-config.json` (last remaining rollout key; verified no `release-as` keys remain, JSON still valid).
- [x] Kept `## Stability` README sections (real docs) and publish-invariant/publish-shape tests (permanent guards).
- [x] Full validation green: build 8/8, test 17/17 (incl. `workspace-publish-invariant` 10/10), typecheck 14/14. Source still `workspace:*`. No lint task configured.

**Files changed:** `CONTRIBUTING.md`, `.cursor/rules/shared/publishing-packages.mdc`, `release-please-config.json`

## QA — PENDING
