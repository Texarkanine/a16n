# Task: Bind `npm run lint` to Oxlint

* Task ID: issue-74-oxc-linter
* Complexity: Level 2
* Type: simple enhancement

Install Oxlint at the monorepo root, bind the existing `lint` script so `npm run lint` / `pnpm lint` actually runs it, apply only `oxlint --fix` (safe autofix), leave CI alone, inventory leftovers by package, and open a PR to `main`. Per-package cleanup of remaining findings is follow-up, not this task. Tracked as [#74](https://github.com/Texarkanine/a16n/issues/74).

**Operator ruling (2026-08-20):** mapping `lint` / `lint:fix` in root `package.json` and adding `.oxlintrc.json` does not need tests. Lint *is* the checker. A prior preflight FAIL that demanded behavior-level tests for that mapping is overruled. Do not add change-detector tests on script text or config JSON.

## Test Plan (TDD)

### Behaviors to Verify

- [Bind]: `pnpm lint` / `npm run lint` → runs Oxlint (not `turbo run lint` with zero package tasks). Verified by running the command, not by a Vitest case.
- [Safe fix]: `pnpm lint:fix` → `oxlint --fix` only. Verified by the script we write and by reviewing the `--fix` diff.
- [Optional]: CI workflows → no lint job. Verified by not editing them.
- [Inventory]: after `--fix`, remaining correctness findings → counted by package in `progress.md` + PR body
- [Edge — leftover errors]: `pnpm lint` may exit non-zero → expected; not a CI gate
- [Regression]: `pnpm test` before and after `--fix` → existing suite still passes

### Test Infrastructure

- Framework: Vitest (existing). **New test files: none.**
- Test location: n/a
- Conventions: n/a
- Verifier: Oxlint itself

## Implementation Plan

1. [x] Add Oxlint and bind the root scripts (no tests)
   - Files: `package.json`, `pnpm-lock.yaml`, `.oxlintrc.json`
   - Changes: `pnpm add -Dw oxlint` (1.79.0). Set `"lint": "oxlint"` and `"lint:fix": "oxlint --fix"`. Created `.oxlintrc.json` with `oxlint --init`. Do not add per-package `lint` scripts.
2. [x] Update docs that the new bind would make factually wrong (prose/policy)
   - Files: `memory-bank/techContext.md`, `CONTRIBUTING.md`
   - Changes: replace the no-op-lint claim in `techContext.md`. Add optional `pnpm lint` / `pnpm lint:fix` to `CONTRIBUTING.md`. PR expectations stay test/typecheck/build only.
3. [x] Safe autofix with suite baseline
   - Files: none — `oxlint --fix` rewrote 0 files (unused-vars / irregular-whitespace have no safe fix)
   - Changes: `pnpm test` baseline passed; `pnpm lint:fix` applied; `pnpm test` still passed (FULL TURBO cache).
4. [x] Inventory leftovers (PR after QA)
   - Files: `memory-bank/active/progress.md`
   - Changes: after `--fix`, still 80 correctness errors in 8 packages (plugin-agentsmd clean). See progress.md table.

## Preflight Findings

- **OVERRULED:** TDD encoding FAIL on `package.json` script mapping / `.oxlintrc.json`. Operator: that mapping needs no test; lint is the tester.
- **KEPT:** `pnpm test` before and after `--fix` (existing suite, not new tests).
- **CONFIRMED:** Docs, inventory, CI-left-alone are prose/policy. No package has a `lint` script today. No creative docs.

## Technology Validation

New dependency: `oxlint` (PoC: `pnpm dlx oxlint` **1.79.0**).

- 165 JS/TS files. `--init` correctness: 80 errors (76 unused-vars, 4 irregular-whitespace) before `--fix`.
- Extra categories (not enabled): suspicious ~140, perf ~173, pedantic ~695, style ~7035, all ~9962.
- `--silent` empties JSON diagnostics — do not use it for inventory.

Default-correctness inventory **before** `--fix`:

| Package | Findings |
|---|---|
| plugin-claude | 40 unused-vars |
| cli | 11 unused-vars |
| plugin-a16n | 9 unused-vars |
| plugin-cursor | 6 unused-vars + 4 irregular-whitespace |
| engine | 4 unused-vars |
| models | 4 unused-vars |
| glob-hook | 1 unused-vars |
| docs | 1 unused-vars |
| plugin-agentsmd | 0 |
| repo-root | 0 |

Re-count after `--fix` during build.

## Dependencies

- `oxlint` (new root `devDependency`)
- Existing: pnpm, Node (`.nvmrc`), gitignore

## Challenges & Mitigations

- [Lint exits 1 after bind]: expected until follow-up tickets; not a CI gate; not a Niko-build failure.
- [Autofix changes tests]: full `pnpm test` before and after `--fix`; revert a fix that breaks a test.
- [Over-linting]: ship `--init` defaults only.
- [False-empty inventory]: never pass `--silent` when counting.

## Pre-Mortem

- [Agents/CI treat lint as a merge gate]: no CI step.
- [Extra categories drown the PR]: not enabled.
- [Inventory lived only in chat]: write to `progress.md` and the PR body.
- [Change-detector tests on package.json]: forbidden; operator confirmed none.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [x] QA

## QA Findings

- **PASS.** Bind, safe `--fix`, leftover inventory, docs, and CI-left-alone match the plan. No new Vitest cases (operator ruling). Unused-vars / irregular-whitespace leftovers not cleaned (follow-up).
- Trivial fix applied: `.oxlintrc.json` was missing a trailing newline (`oxlint --init` output); added to match other root JSON files.
- Non-blocking leftover: `turbo.json` still has `"lint": {}` from the old Turbo fan-out. Root `pnpm lint` no longer calls Turbo. Left as-is — removing it is a later design call.
- Re-counted leftovers: 80 errors in 40 files (plugin-claude 40, cli 11, plugin-cursor 10, plugin-a16n 9, models 4, engine 4, glob-hook 1, docs 1, plugin-agentsmd 0). Matches `progress.md`. `pnpm lint` exits 1 as expected.
- PR to `main` is after this phase (not opened here).
