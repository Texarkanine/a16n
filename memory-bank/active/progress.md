# Progress

Wave C of the v1 rollout (Milestone 5): promote the top-level `a16n` CLI from `0.x` to `1.0.0` via per-package `release-as` in `release-please-config.json`, with a path-touching commit under `packages/cli`. Remove spent M4 `release-as` keys from engine/plugins once confirmed published. Depends on Wave B (`@a16njs/engine`, plugins, agentsmd pin-refresh) being live.

**Complexity:** Level 1

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Advanced the L4 from M4 to M5: marked M4 `- [x]`, cleared M4 sub-run ephemerals.
    - Classified M5 (Wave C: CLI → `1.0.0`) as **Level 1**: single package, proven release-config recipe, no design work.
    - Re-scoped `projectbrief.md` to M5.
* Decisions made
    - M5 is Wave C only: promote `a16n` CLI; do NOT touch other packages except spent-key cleanup in RP config. Source deps stay `workspace:*`.
* Insights
    - Same per-package path-touch mechanic as M1/M3/M4; breadth is one package, not new design.

## 2026-06-13 - BUILD - COMPLETE

* Work completed
    - `release-as: "1.0.0"` added to `packages/cli`; spent M4 keys removed from engine/plugin-cursor/plugin-claude/plugin-a16n.
    - `## Stability` README note added under `packages/cli` (RP path-touch trigger).
    - Confirmed Wave B published on npm before editing.
    - Full validation green: build 8/8, test 17/17, typecheck 14/14. Source still `workspace:*`.
* Decisions made
    - No new unit test (config+docs; existing `workspace-publish-invariant` + operator merge-gate). Mirrors M3/M4.
    - Deliverable commit will use `fix(release):` so RP cuts the release (M1 trap).
* Insights
    - Wave C is the narrowest wave: one package, one path-touch, spent-key cleanup only.

## 2026-06-13 - QA - COMPLETE

* Work completed
    - Semantic review (KISS/DRY/YAGNI/completeness/regression/integrity/docs) of Wave C. Wrote `.qa-validation-status` = PASS.
* Result
    - ✅ PASS, clean. No findings, no fixes. README claim verified. Residual (RP version on merge) is operator merge-gate.
