# Task: Bind Oxlint into CI, local lint, and pre-commit

* Task ID: issue-162
* Complexity: Level 2
* Type: simple enhancement

Wire existing Oxlint (correctness-as-error from #74) so local `pnpm lint` autofixes, a husky pre-commit hook checks only, and CI checks only. Update CONTRIBUTING and techContext. Do not enable extra Oxlint categories. Do not add custom hook-installer logic.

## Test Plan (TDD)

There is **no implementable unit of new executable product behavior** under `.cursor/rules/shared/always-tdd.mdc`.

Operator constraint (this issue) and #74 outcome: mapping lint scripts, workflow YAML, and CONTRIBUTING prose is **not a TDD unit**. Oxlint itself is the checker. A standard hook tool (husky) has no custom branching installer, so it does not create a TDD unit either.

Do **not** add Vitest cases. A test that asserts on `package.json` script strings, `.github/workflows/ci.yaml` step text, `.husky/pre-commit` contents, or CONTRIBUTING/techContext wording is a **change-detector** and must not be written.

### Behaviors to Verify

Verification is running Oxlint and inspecting the three command bindings. These are not Vitest cases.

- Local autofix: `pnpm lint` is `oxlint --fix` → running it on this clean tip exits 0 and does not require leftover unused-var edits
- Check-only gate: `pnpm lint:check` is `oxlint` (no `--fix`) → exits 0 on this tip (`pnpm exec oxlint` already clean at plan time)
- Pre-commit binding: `.husky/pre-commit` runs `pnpm lint:check` only (no `--fix`)
- CI binding: `.github/workflows/ci.yaml` has a step `pnpm lint:check` after install (no `--fix`)
- Docs: `CONTRIBUTING.md` and `memory-bank/techContext.md` no longer say lint is optional / not in CI / leftovers expected
- Isolation: do not run `husky` / `pnpm install` without `HUSKY=0` in this worktree (husky writes `core.hooksPath` to the shared parent `.git/config`)

### Edge cases

- Pre-commit and CI must not autofix
- `.oxlintrc.json` categories stay correctness-only
- Non-fixable correctness errors still fail `pnpm lint:check` (Oxlint already does this; no new rules)
- `turbo.json` unused `"lint": {}` stays unused (root lint is not a per-package turbo task)

### Test Infrastructure

- Framework: Oxlint (existing). Not Vitest.
- Test location: none new
- Conventions: #74 — lint is the tester
- New test files: none

## Implementation Plan

These steps are configuration and prose. They are not TDD cycles.

1. Scripts: invert local lint to autofix; add check-only script
   - Files: `package.json`
   - Changes: `"lint": "oxlint --fix"`; add `"lint:check": "oxlint"`; keep `"lint:fix": "oxlint --fix"` as alias; add `"prepare": "husky"` (husky is already a root devDependency from plan spike: `husky@^9.1.7`)
2. Pre-commit hook file (check only)
   - Files: `.husky/pre-commit` (new)
   - Changes: single command `pnpm lint:check`. Do not source `_/husky.sh` (deprecated in husky 9; fails in 10). Husky 9.1.7 runs the file via `sh -e`; no shebang or +x required. Do not run `pnpm exec husky` or `husky init` in this worktree.
3. CI check-only step
   - Files: `.github/workflows/ci.yaml`
   - Changes: after Install dependencies, before Build, add step `name: Lint` / `run: pnpm lint:check`
   - On the existing Install dependencies step, set `env.HUSKY: "0"` (or prefix `HUSKY=0`) so `prepare: husky` does not run in CI. CI lint is the workflow step, not a git hook.
4. Docs
   - Files: `CONTRIBUTING.md`, `memory-bank/techContext.md`
   - Changes: document `pnpm lint` (autofix), `pnpm lint:check` (hook + CI), that CI fails on leftover correctness errors. Remove "optional / not in CI / leftovers expected".
   - In CONTRIBUTING, add that `pnpm install` in a git worktree that shares a parent `.git` should use `HUSKY=0` so husky does not write `core.hooksPath` on the shared config. Normal clones run `prepare: husky` as usual.
5. Verify (Oxlint is the checker)
   - Run `pnpm lint:check` and `pnpm exec oxlint` (expect exit 0)
   - Run `pnpm lint` (autofix; expect exit 0 on this clean tip)
   - Confirm hook and CI command strings have no `--fix`
   - Confirm `.oxlintrc.json` unchanged
   - Confirm shared git hooksPath is unset and shared `pre-commit` hash still `fe889e2f6c007bfa52591a5959150d64226a822ffdfd0a6ebe32d2be60cff560`
   - Do not run the full Vitest suite unless something other than wiring changed (it will not). If a later step forces a suite run, read the whole output.

## Technology Validation

New dependency: `husky@^9.1.7` (MIT, `engines.node >= 18`, already added with `pnpm add -Dw husky`).

XY / means check:

- Goal (no means): after `pnpm install`, git pre-commit runs check-only Oxlint; local manual lint autofixes; CI check-only fails on leftovers.
- Evidence husky achieves it: official docs `prepare: "husky"` + committed `.husky/pre-commit`; husky 9.1.7 `index.js` sets `core.hooksPath` to `.husky/_` and runs `.husky/<hook-name>` if present (`node_modules/husky/husky` helper).
- Alternatives: `simple-git-hooks` writes `.git/hooks` (would overwrite the machine-local ai-rizz shared `pre-commit`); a one-line `git config core.hooksPath` is the mechanism husky wraps, but the brief asked for a standard npm/node hook tool; custom installer with branching is out of scope.
- Decision: husky. In this isolated **worktree**, do not execute husky/`prepare` — a spike showed `git config core.hooksPath` writes `/home/mobaxterm/git/a16n/.git/config` (shared). Unset after spike. Use `HUSKY=0` on any later `pnpm install` here.

Spike result: `pnpm exec husky` created `.husky/_` (gitignored via `_/.gitignore`), set shared `core.hooksPath=.husky/_`, left shared `.git/hooks/pre-commit` hash unchanged. `core.hooksPath` was unset immediately. Spike `.husky/` directory removed.

## Dependencies

- Existing: `oxlint@^1.79.0`, `.oxlintrc.json` (do not change categories)
- New: `husky@^9.1.7`

## Challenges & Mitigations

- Worktree husky writes shared `core.hooksPath`: never run `husky`/`prepare` in this checkout; `HUSKY=0` on installs
- #74-style preflight TDD FAIL on script mapping: this plan names no Vitest cases and no change-detectors; Oxlint is the checker
- Accidentally putting `--fix` on hook or CI: `lint:check` is the only command those two call
- Enabling extra Oxlint categories: do not edit `.oxlintrc.json`

## Pre-Mortem

- Preflight FAILs TDD encoding like #74: already covered — no executable TDD unit, no change-detector tests scheduled
- Build/`pnpm install` re-runs husky and poisons parent git config: already covered — `HUSKY=0`; do not run husky
- CI or hook calls `pnpm lint` after inversion (would autofix in CI / rewrite during commit): plan binds those surfaces to `lint:check` only
- Docs still say lint is optional: step 4 is explicit file-level edits

## Preflight Findings (2026-08-20)

Verdict: **PASS**. No operator input required before `/niko-build`. This preflight run does not start build.

- **TDD Plan Encoding (info, pass):** No implementable unit of new executable product behavior. Plan schedules no Vitest cases and no change-detectors. Operator + #74: mapping lint scripts / workflow YAML / hook contents / CONTRIBUTING prose is not a TDD unit; Oxlint is the checker. husky is a standard installer with no custom branching, so it does not create a TDD unit.
- **Prerequisites (info, pass):** Level 2 plan complete. No creative-phase docs required.
- **Convention (info, pass):** Root `package.json` scripts, `ci.yaml` step shape, and CONTRIBUTING command list match existing DX patterns. `.husky/pre-commit` is new and matches husky 9 manual setup (`prepare: "husky"` + committed hook file). `turbo.json` unused `"lint": {}` stays unused (same as #74).
- **Dependency impact (info, pass):** `husky@^9.1.7` already in root `package.json` + lockfile. No package-level `"lint"` scripts. No tests snapshot root script strings or `ci.yaml`. Inverting `pnpm lint` to `--fix` is planned and documented. Other workflows (`release.yaml`, `docs.yaml`) also `pnpm install` and will run `prepare` unless they set `HUSKY=0`; harmless in a fresh GHA clone — only `ci.yaml` is in scope.
- **Conflict (info, pass):** No existing husky / simple-git-hooks / lefthook layout. No `.husky/` on disk. No public published-API contract.
- **Completeness (info, pass):** Brief requirements 1–8 map to concrete files. `pnpm exec oxlint` exits 0 on this tip. Hook file is one line; husky 9.1.7 executes it via `sh -e`.
- **Radical innovation (applied):** Treat `HUSKY=0` as the supported way to install without taking over git hooks — CI install + CONTRIBUTING worktree note. See plan steps 3–4.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [ ] Build
- [ ] QA
