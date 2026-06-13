# Progress

Wave A of the v1 rollout (Milestone 3): promote the leaf-layer packages `@a16njs/models` and the standalone `@a16njs/glob-hook` to `1.0.0` via per-package `release-as` in `release-please-config.json`, plus a path-touching commit under each package so Release-Please actually cuts the release.

**Complexity:** Level 1

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Dissolved M2 as spurious (root cause was off-pipeline manual `npm publish` + missing OIDC, both M6-owned); folded residue into M6.
    - Advanced the L4 to Milestone 3 and classified it **Level 1** (single release-config edit + two trivial path-touches; no code, no design, isolated).
    - Re-scoped `projectbrief.md` to M3.
* Decisions made
    - M3 is Wave A only: promote leaf packages; do NOT touch dependents (engine/plugins/CLI) — those are M4/M5 and keep `workspace:*` in source.
    - Plan to remove the spent M1 `release-as` keys (CLI `0.15.4`, agentsmd `1.0.3`) during the config edit (verify first).
* Insights
    - The path-touch-per-package requirement is the exact Release-Please mechanic that thrashed M1 twice; it is the one non-trivial execution detail in this otherwise trivial milestone.

## 2026-06-13 - BUILD - COMPLETE

* Work completed
    - `release-as: "1.0.0"` for `packages/models` + `packages/glob-hook`; path-touching `## Stability` README note in each; removed spent M1 `release-as` keys (a16n 0.15.4, agentsmd 1.0.3). Commit `98795db7`.
    - Full suite green (17 packages); `workspace-publish-invariant` confirms source still `workspace:*`.
* Decisions made
    - Replicated the proven M1-rework recipe (`fix(release):` commit touching each package path + `release-as`) rather than improvising RP mechanics — explicitly to not step on the M1 rake a third time.
    - No new unit test: release-orchestration config change, not code behavior; the `workspace:*` constraint is already guarded.
* Insights
    - The honest path-touch (a real 1.0 stability note) doubles as useful user-facing documentation, avoiding a pure-fluff trigger commit.

## 2026-06-13 - QA - COMPLETE

* Work completed
    - Semantic review (KISS/DRY/YAGNI/completeness/regression/integrity/docs) of the Wave A change. Wrote `.qa-validation-status` = PASS.
* Result
    - ✅ PASS, clean. No findings, no fixes. The only residual (does RP cut both 1.0.0 releases) is inherent and covered by the operator merge-gate.
