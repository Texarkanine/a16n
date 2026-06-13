# Progress

Move every published `a16n` package off `0.x` onto `1.x` semver without ever shipping a broken package: first repair the currently-broken `a16n@latest`, then harden the release CI against the failure mode that broke it, then promote all packages to `1.0.0` in dependency-ordered waves.

**Complexity:** Level 4

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Reproduced and root-caused the live `a16n@latest` install failure (poisoned `workspace:*` in published `@a16njs/plugin-agentsmd@1.0.1`/`1.0.2`, from manual `npm publish` bypassing pnpm's rewrite; `a16n@0.15.2` exact-pins the poisoned `1.0.2`).
    - Confirmed all other published packages carry correctly-rewritten exact internal pins.
    - Classified the effort as Level 4 and captured the validated intent in `projectbrief.md`.
* Decisions made
    - Ordered the work as: (1) restore installability, (2) harden CI, (3+) dependency-ordered `1.0.0` waves — per operator direction.
    - Each milestone is shaped to land via the normal Niko workflow (operator does PR + merge + Release-Please publish per milestone).

## 2026-06-13 - PLAN - COMPLETE

* Work completed
    - Decomposed the L4 project into 5 sequential milestones in `memory-bank/active/milestones.md`: M1 restore `a16n@latest` installability, M2 harden release CI, M3 Wave A (`models` + `glob-hook` → 1.0.0), M4 Wave B (middle layer → 1.0.0), M5 Wave C (CLI → 1.0.0).
    - Recorded 7 cross-milestone invariants (installability preserved at every boundary, no `workspace:` in tarballs, source stays `workspace:*`, forward-only dependency order, `docs` never published, no silent code breaks, agentsmd never regressed).
* Decisions made
    - Folded standalone `@a16njs/glob-hook` into the leaf wave (M3) since it has no internal edges.
    - `@a16njs/plugin-agentsmd` is already 1.x; it is repaired in M1 rather than getting its own promotion wave.
    - Estimated milestone scopes: M1 L2, M2 L2 (possibly L3), M3 L1, M4 L2, M5 L1 — advisory; actual classification happens at each sub-run start.

## 2026-06-13 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the 5-milestone decomposition against codebase reality (release-please config, publish workflow, dependency graph). Result: PASS with advisory; no blocking findings. Wrote `.preflight-status`.
* Decisions made
    - TDD encoding is deferred to each sub-run's own plan/preflight (L4 has no dedicated build/QA phase).
* Insights
    - The publish loop passes no `--access public` and relies on per-package `publishConfig`, which only `plugin-agentsmd` has — this is the latent trigger for the original breakage and is folded into M2's scope.
    - Advisory A1: release-please `node-workspace`/linked-versions would eliminate the phantom-pin class entirely but is a release-architecture change (out of current scope); flagged for operator, not applied.
