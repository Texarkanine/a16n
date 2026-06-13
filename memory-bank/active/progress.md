# Progress

Wave B of the v1 rollout (Milestone 4): promote the middle-layer packages `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, `@a16njs/plugin-a16n`, and `@a16njs/engine` from `0.x` to `1.0.0` via per-package `release-as` in `release-please-config.json`, and re-release the already-`1.x` `@a16njs/plugin-agentsmd` so it re-pins to `@a16njs/models@1.0.0`. Each package that must cut a release needs a path-touching commit. Depends on Wave A (`@a16njs/models@1.0.0`, `@a16njs/glob-hook@1.0.0`) being live — confirmed published.

**Complexity:** Level 2

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Advanced the L4 from M3 to M4: marked M3 `- [x]` (Wave A published — `models@1.0.0` and `glob-hook@1.0.0` confirmed on npm; RP PRs #123/#124 merged), cleared M3 sub-run ephemerals.
    - Classified M4 (Wave B) as **Level 2**: coordinated multi-package release confined to the release-config subsystem; replays the proven M3/M1 recipe; no design decisions; moderate risk.
    - Re-scoped `projectbrief.md` to M4.
* Decisions made
    - M4 is Wave B only: promote plugins + engine; do NOT touch the `a16n` CLI (that is M5). Source deps stay `workspace:*`.
    - agentsmd is a **pin-refresh** (already `1.0.3`), NOT a `release-as: "1.0.0"` promotion — forcing it back to 1.0.0 would regress it (invariant #7) and is a SemVer downgrade.
    - Verified published baseline: plugin-cursor 0.14.1, plugin-claude 0.14.1, plugin-a16n 0.7.3, engine 0.8.1, agentsmd 1.0.3.
* Insights
    - The path-touch-per-package mechanic is again the one non-trivial detail; the difference from M3 is breadth (5 packages) and the agentsmd pin-refresh sub-case, not new design.

## 2026-06-13 - PLAN - COMPLETE

* Work completed
    - Wrote the full Level 2 plan to `tasks.md`: `release-as: "1.0.0"` for engine + plugin-cursor + plugin-claude + plugin-a16n; remove spent M3 keys (models/glob-hook); one `fix(release):` commit touching all five package READMEs (the RP trigger); agentsmd patch bump only.
    - Verified live facts: agentsmd@1.0.3 pins `@a16njs/models@0.14.1`; workspace `models` version is `1.0.0` (so pnpm rewrite resolves dependents to 1.0.0).
* Decisions made
    - **agentsmd: patch bump, NO `release-as`** (operator-confirmed). Forcing 1.0.0 would downgrade it and violate invariant #7. The patch (1.0.3→1.0.4) exists solely to re-pin its published `models` dep 0.14.1→1.0.0 via pnpm rewrite — dependency hygiene to avoid two `models` majors in the post-M5 CLI tree. Not invariant-required, but worth it.
    - No new unit test (config+docs change; existing `workspace-publish-invariant` + agentsmd `publish-shape` guards cover source; RP versions are operator merge-gated). Mirrors M3.
* Insights
    - The honest distinction the operator surfaced: Wave B is two different operations wearing one label — a `0.x→1.0.0` *promotion* (4 packages) and a *dependency re-pin* (agentsmd). Only the former is "promotion"; the latter is immutable-tarball hygiene.

## 2026-06-13 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the Wave B plan against codebase reality. PASS (with one advisory). Wrote `.preflight-status`.
    - Confirmed RP config has no `plugins`/`linked-versions` key → each package released independently → per-package path-touch is required (validates the plan's single 5-path commit). Confirmed via M3: releasing models@1.0.0 did NOT bump the still-0.x plugins.
* Decisions made
    - TDD: no new unit test is a justified PASS (config+docs change, no executable behavior; existing invariant guards + operator merge-gate cover it) — same basis M3 passed QA.
    - Advisory (config-lint test for spent release-as keys) NOT built: out of Wave-B brief scope; dissolved-M2 machine-guard territory now owned by M6. Flagged only.
* Insights
    - The "no linked-versions plugin" fact is the load-bearing reason every wave needs an explicit path-touch per package — it's why M1 thrashed and why this plan touches all five READMEs in one commit.

## 2026-06-13 - BUILD - COMPLETE

* Work completed
    - `release-as: "1.0.0"` added to engine/plugin-cursor/plugin-claude/plugin-a16n; spent M3 keys removed from models/glob-hook; agentsmd left without `release-as`.
    - `## Stability` README notes added to all five packages (the RP path-touch trigger).
    - Full validation green: build 8/8, test 17/17 (incl. `workspace-publish-invariant` + agentsmd `publish-shape`), typecheck 14/14. Source still `workspace:*`.
    - Committed deliverable as `fix(release): Wave B …`.
* Decisions made
    - Used a `fix(release):` deliverable commit, NOT the generic `chore: saving work before qa phase` — the conventional type is load-bearing for Release-Please; a `chore:` would not cut the release (the M1-class trap). The squash-merge PR title must likewise be `fix(release): …`.
    - agentsmd README note phrased as "Stable since 1.0.0" (honest — it is already 1.x) rather than "As of 1.0.0" (which the four promotions use), to avoid implying a promotion.
* Insights
    - `lint` executes 0 turbo tasks in this repo (no package defines a `lint` task) — pre-existing, not introduced here.

## 2026-06-13 - QA - COMPLETE

* Work completed
    - Semantic review (KISS/DRY/YAGNI/completeness/regression/integrity/docs) of the Wave B change. Wrote `.qa-validation-status` = PASS.
* Result
    - ✅ PASS, clean. No findings, no fixes. README claims verified accurate (incl. plugin-a16n's "described below" pointer and agentsmd's honest "Stable since 1.0.0" phrasing). The only residual (does RP cut all five at intended versions) is inherent and covered by the operator merge-gate + the required `fix(release):` PR title.

## 2026-06-13 - REFLECT - COMPLETE

* Work completed
    - Wrote `reflection/reflection-v1-release-rollout-m4.md`. Reconciled persistent files — none needed updating.
* Decisions made
    - Recorded the deliberate `fix(release):` deliverable-commit choice and the agentsmd promotion-vs-re-pin distinction as the reflection's durable lessons.
* Insights
    - Through-line across M1/M3/M4: the missing RP `linked-versions` plugin forces a per-package path-touch every wave. The elegant fix (auto-propagating releases) is M6-owned and out of scope here.
