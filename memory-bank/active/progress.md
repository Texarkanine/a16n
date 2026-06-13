# Progress

Harden the automated release pipeline (Milestone 2 of v1-release-rollout) so a non-resolvable package can never be published: make every scoped package publish publicly via the `pnpm publish` path, add a tarball-inspection guard that fails on any `workspace:` specifier or registry-absent/non-in-wave sibling pin, never attempt to publish the private `docs` package, and publish wave members in a dependency-safe order.

**Complexity:** Level 3

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Advanced L4 to Milestone 2 (M1 verified live on npm: `a16n@0.15.4` installs cleanly, pins `agentsmd@1.0.3` → `models@0.14.1`, no `workspace:` leak).
    - Inspected the release subsystem: `release.yaml` publish loop (`pnpm --filter publish` over `paths_released`), `release-please-config.json`, and per-package `publishConfig`.
    - Classified M2 as **Level 3** (estimate was L2; elevated per the milestone's own "may classify L3" note).
* Decisions made
    - L3 rationale: enhancement touching 6+ package manifests + workflow + a new guard, in the highest-risk subsystem, with genuine design choices — the registry-presence guard must be wave-aware, which couples it to topological publish ordering (the exact restructuring flagged as the L3 trigger).
    - Re-scoped `projectbrief.md` from M1 to M2; M1 record preserved in `reflection/` and `milestones.md`.
* Insights
    - Only `plugin-agentsmd` currently declares `publishConfig.access: "public"`; the other six scoped packages publish publicly via fragile implicit defaults — a latent recurrence risk M2 must close.

## 2026-06-13 - PLAN - COMPLETE

* Work completed
    - Authored the L3 plan in `tasks.md`: manifest `access` rollout (6 packages), a pure unit-tested `analyzePublishSet` analyzer + thin guard entry hosted in `packages/cli/`, and a `release.yaml` rewrite (pack-all → verify-all → publish in dependency-safe order).
    - Built the TDD test plan (analyzer behaviors incl. same-wave sibling resolution, toposort, private exclusion; extended manifest `access` guard).
* Decisions made
    - No CREATIVE phase: the design is sharply constrained by requirements. Pack-all→verify-all→publish (UC2: fail before any publish); guard hosted in CLI package so per-package `pnpm test` runs it (the M1 "root tests don't run in CI" insight); `registryHas` injected for offline-testable logic.
    - Guard written as plain ESM `.mjs` (no new build/loader/runtime); CLI `files: ["dist"]` keeps `scripts/` unpublished.
* Insights
    - `pnpm publish` already no-ops on the private `docs` package, so the docs-skip requirement is a regression guard rather than a bug fix.
    - The registry-presence check must consult the waveSet *before* the registry, or legitimate multi-package waves (e.g. M4) would false-positive — this is the central correctness risk and gets dedicated unit coverage.
