# Progress

Bind existing Oxlint (correctness-as-error from #74) into local autofix, a check-only pre-commit hook installed on `pnpm install`, and a check-only CI step. Update CONTRIBUTING and techContext so lint is no longer described as optional / not in CI.

**Complexity:** Level 2

## 2026-08-20 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Fresh start: no `memory-bank/active/` in the isolated checkout
    - Intent taken as [a16n#162](https://github.com/Texarkanine/a16n/issues/162) plus the isolated-checkout operator constraints (standing consent through REFLECT)
    - Classified Level 2: small self-contained enhancement to root DX / CI tooling; no product-package behavior
* Decisions made
    - Level 2, not Level 3: hook-tool selection is a plan/tech-validation choice; prefer a standard installer over custom code
    - Isolated checkout is a git worktree sharing the parent `.git`; hook install must not write the parent's shared `.git/hooks`
* Insights
    - #74 already bound `lint` / `lint:fix` and left CI optional; this task inverts local lint to autofix and adds the two check-only gates
    - Mapping lint scripts is not a TDD unit (operator outcome from #74)

## 2026-08-20 - PLAN - COMPLETE

* Work completed
    - Wrote the Level 2 implementation plan in `tasks.md`
    - Confirmed `pnpm exec oxlint` is clean on this tip
    - Spiked `husky@9.1.7`; chose it over `simple-git-hooks` and a custom installer
* Decisions made
    - `pnpm lint` = `oxlint --fix`; `pnpm lint:check` = `oxlint`; keep `lint:fix` as alias
    - Husky pre-commit and CI both run `pnpm lint:check`
    - No new Vitest cases; no change-detector tests
    - Do not run `husky` / `prepare` in this worktree; use `HUSKY=0` on later installs
* Insights
    - In a git worktree, husky's `git config core.hooksPath .husky/_` writes the **shared** parent `.git/config`, which would bypass the machine-local ai-rizz `pre-commit`. Spike unset it. Shared hook hash unchanged.
    - `simple-git-hooks` would overwrite that same shared `pre-commit` file

## 2026-08-20 - PREFLIGHT - COMPLETE (PASS)

* Work completed
    - Validated the Level 2 plan against `package.json`, `ci.yaml`, `.oxlintrc.json`, `turbo.json`, CONTRIBUTING, techContext, husky 9.1.7 runtime, and the TDD rule
    - Confirmed `pnpm exec oxlint` exits 0 on this tip
    - Wrote `memory-bank/active/.preflight-status` (`PASS`)
    - Amended the plan (CI `HUSKY=0`, CONTRIBUTING worktree note, hook-file format) and recorded findings in `tasks.md`
* Decisions made
    - TDD Plan Encoding passes: no Vitest cases and no change-detectors is the correct encoding for this wiring
    - In-scope innovation applied: `HUSKY=0` is the supported way to install without taking over git hooks
    - Do not start `/niko-build` from this preflight run (parent owns build)
* Insights
    - Husky 9.1.7 runs `.husky/pre-commit` via `sh -e`; a one-line `pnpm lint:check` is enough
    - `git config core.hooksPath` from a worktree writes the shared parent `.git/config` — already a spike finding; now also a shipped CONTRIBUTING note

## 2026-08-20 - BUILD - COMPLETE

* Work completed
    - Inverted `package.json` `lint` to `oxlint --fix`; added `lint:check` and `prepare: husky`
    - Added `.husky/pre-commit` (`pnpm lint:check` only)
    - Added CI Lint step after install; install sets `HUSKY=0`
    - Updated CONTRIBUTING and techContext
    - Verified `pnpm lint:check`, `pnpm exec oxlint`, and `pnpm lint` exit 0; hook/CI have no `--fix`; `.oxlintrc.json` unchanged
    - `pnpm test`: 17/17 turbo tasks, all package suites green
* Decisions made
    - Did not run `husky`/`prepare` in this worktree; shared `core.hooksPath` remains unset; shared pre-commit hash unchanged
    - No new Vitest cases
* Insights
    - Isolation held: husky was not re-executed after the plan spike unset
