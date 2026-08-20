# Task: Bind `npm run lint` to Oxlint

* Task ID: issue-74-oxc-linter
* Complexity: Level 2
* Type: simple enhancement

Install Oxlint at the monorepo root, bind the existing `lint` script so `npm run lint` / `pnpm lint` actually runs it, apply only `oxlint --fix` (safe autofix), leave CI alone, inventory leftovers by package, and open a PR to `main`. Per-package cleanup of remaining findings is follow-up, not this task. Tracked as [#74](https://github.com/Texarkanine/a16n/issues/74).

This is developer tooling and incidental autofix, not a product-behavior change. There are no new Vitest cases: a test that asserts the `lint` script text or config JSON would only go red when someone edits those artifacts on purpose (a change-detector, forbidden). Verification is operational (`pnpm lint` invokes Oxlint) plus the existing suite after `--fix`.


## Test Plan (TDD)

### Behaviors to Verify

- [Bind]: `pnpm lint` / `npm run lint` → runs Oxlint (not `turbo run lint` with zero package tasks)
- [Safe fix]: `pnpm lint:fix` → `oxlint --fix` only; no `--fix-suggestions` or `--fix-dangerously`
- [Optional]: `.github/workflows/ci.yaml` (and other workflows) → no new lint job or lint step
- [Inventory]: after `--fix`, remaining default-correctness findings → counted by `packages/<name>` and recorded in `progress.md` + PR body
- [Edge — leftover errors]: `pnpm lint` may exit non-zero while leftovers remain → expected; not a CI gate
- [Edge — fixtures]: default correctness does not flag the empty-export fixture under `plugin-agentsmd`; do not ignore-pattern fixtures in this PR
- [Edge — no-op turbo]: `turbo.json` `lint` task stays; root script no longer calls it
- [Regression]: after `--fix`, `pnpm test` → existing suite still passes

### Test Infrastructure

- Framework: Vitest (existing). Not used for new cases on this task.
- Test location: `packages/*/test/` — unchanged
- Conventions: plugin packages use flat `discover-`/`emit-` files; CLI is tiered. Irrelevant here.
- New test files: none

## Implementation Plan

1. Add Oxlint and bind the root scripts (developer tooling; no product tests)
   - Files: `package.json`, `pnpm-lock.yaml`, `.oxlintrc.json`
   - Changes: `pnpm add -D oxlint`. Set `"lint": "oxlint"` and `"lint:fix": "oxlint --fix"`. Create `.oxlintrc.json` with `oxlint --init` (correctness as error; typescript/unicorn/oxc plugins). Do not add per-package `lint` scripts.

2. Update docs that the new bind would make factually wrong (prose/policy; no tests)
   - Files: `memory-bank/techContext.md`, `CONTRIBUTING.md`
   - Changes: replace the "deliberately no lint / `pnpm lint` is a no-op" claim in `techContext.md` with "root `pnpm lint` runs Oxlint; optional; not in CI". In `CONTRIBUTING.md`, add `pnpm lint` / `pnpm lint:fix` under Running Tests (or a short sibling section) and keep PR expectations as test/typecheck/build only.

3. Apply truly safe autofix and confirm the suite
   - Files: whatever `oxlint --fix` rewrites (likely unused imports / irregular whitespace under `packages/*`)
   - Changes: run `pnpm lint:fix` once. Review the diff; do not run `--fix-suggestions` or `--fix-dangerously`. Then `pnpm test`.

4. Inventory leftovers and open the PR
   - Files: `memory-bank/active/progress.md` (inventory table); PR body (same numbers)
   - Changes: `oxlint -f json` grouped by `packages/<name>` and rule. List which packages still need a follow-up ticket. Open a PR to `main` for this branch. Comment the inventory on [#74](https://github.com/Texarkanine/a16n/issues/74) if useful.

## Technology Validation

New dependency: `oxlint` (PoC: `pnpm dlx oxlint` **1.79.0**).

- 165 JS/TS files linted (gitignore honored; `dist` / `coverage` / `.docusaurus` skipped).
- No config (CLI defaults): 80 **warnings**, exit 0 — `eslint(no-unused-vars)` 76, `eslint(no-irregular-whitespace)` 4.
- `--init` config (`categories.correctness: error`): same 80 as **errors**, exit 1.
- Category landscape (informational, **not** enabled this PR): suspicious ~140, perf ~173, pedantic ~695, style ~7035, all ~9962.
- `--silent` empties JSON `diagnostics` — do not use it for inventory.

Default-correctness inventory **before** `--fix` (the `--init` / this-PR rule set):

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

Re-count after `--fix` during build; that recount is the ticket list.

## Dependencies

- `oxlint` (new root `devDependency`)
- Existing: pnpm, Node (`.nvmrc`), gitignore (Oxlint default ignore)

## Challenges & Mitigations

- [Lint exits 1 after bind]: `--init` promotes the 80 correctness hits to errors. Mitigation: that is intended and documented; do not add lint to CI; do not treat a red `pnpm lint` as a Niko-build failure for this task. Success is "Oxlint ran", not "zero findings".
- [Autofix changes tests]: unused-import `--fix` can touch many test files. Mitigation: full `pnpm test` after `--fix`; revert any fix that breaks a test rather than rewriting the test to match a bad fix.
- [Over-linting]: style/all is thousands of nits. Mitigation: ship `--init` defaults only; extra categories stay inventory notes, not config.
- [False-empty inventory]: `--silent` drops diagnostics from `-f json`. Mitigation: never pass `--silent` when counting.

## Pre-Mortem

- [Agents/CI treat the new script as a merge gate]: already covered by Challenge 1 (no CI step, no `--deny-warnings` beyond `--init` correctness).
- [We enabled extra categories to "make lint useful" and drowned the PR]: already covered by Challenge 3.
- [Inventory lived only in this chat]: Step 4 writes it to `progress.md` and the PR body.
- [We added a Vitest case that snapshots `package.json` `scripts.lint`]: forbidden change-detector; Test Plan says none.
- [We used per-package Turbo `lint` scripts instead of binding the root command]: wrong layer; root `"lint": "oxlint"` is the issue's request.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
