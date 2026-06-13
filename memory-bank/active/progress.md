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
