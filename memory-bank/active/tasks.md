# Tasks: v1-release-rollout-m3

**Complexity:** Level 1 — see `memory-bank/active/progress.md` (system of record).

Wave A: promote `@a16njs/models` and `@a16njs/glob-hook` to `1.0.0`.

## Build (complete)

- **What**: forced the leaf-layer major for both packages via per-package `release-as: "1.0.0"` in `release-please-config.json`, plus a path-touching `## Stability` note in each package README so Release-Please cuts the release (replicating the proven M1-rework recipe: `fix(release):` commit touching each package path + `release-as`).
- **Cleanup**: removed the spent M1 `release-as` keys (`a16n` `0.15.4`, agentsmd `1.0.3`) — already published, matched the manifest, were cruft.
- **Files**: `packages/models/README.md`, `packages/glob-hook/README.md`, `release-please-config.json`.
- **Why no new test**: this is a release-orchestration config change, not code behavior. The constraint that matters (source stays `workspace:*`) is already guarded by `packages/cli/test/workspace-publish-invariant.test.ts`, which passed. Full suite green (17 packages).
- **Commit**: `98795db7` `fix(release): promote @a16njs/models and @a16njs/glob-hook to 1.0.0 (Wave A)`.

## Operator merge-gate (per M1 lesson)

Before merging the generated Release-Please PR, confirm it bumps **both** `@a16njs/models → 1.0.0` **and** `@a16njs/glob-hook → 1.0.0`. If either is missing, do not merge (that was the M1 failure mode). After publish: `npm view @a16njs/models@1.0.0 version` and `npm view @a16njs/glob-hook@1.0.0 version` both resolve.

## Wave ordering

M3 (Wave A) must merge + publish **before** M4 (Wave B), which re-pins dependents to `@a16njs/models@1.0.0`.
