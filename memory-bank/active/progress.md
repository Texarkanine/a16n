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
