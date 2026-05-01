# Task: M1 — Rename deliverable-fossils & naming-lies (SLOBAC)

* Task ID: m1-slobac-renames
* Complexity: Level 2
* Type: simple enhancement (test metadata cleanup; no SUT changes)

Remediate SLOBAC audit findings **1–3, 7–11, 13, 16–18** using **rename-only** changes to `it`/`test` titles and inline comments (no assertion bodies, no production code). Parent L4 project: `slobac-audit-remediation`; reference `slobac-audit.md` for exact before/after guidance. **Out of scope for M1:** findings 4–6, 12, 14–15, 19–20 (shared-state, monolith splits, discover naming-lie 12).

## Test Plan (TDD)

### Behaviors to Verify

- **Regression / suite green:** `pnpm test` (or Turbo equivalent) passes for `cli`, `engine`, `models`, `plugin-claude`, and `plugin-cursor` after all edits — renames must not change test registration or async hooks.
- **Finding 1 (cli):** Tests under `describe('--from-dir and --to-dir flags')` no longer use `C1:`–`C8:` prefixes; each title still describes the behavior (audit examples).
- **Finding 2 (cli integration):** The former “Claude hooks” test is titled to match native `.claude/rules` output and non-use of `settings.local.json`.
- **Finding 3 (cli):** Delete-source test title matches “two separate output files”, not “single merged output”.
- **Findings 7–9 (engine):** Fossil “refactor” wording and parenthesized AC-style suffixes stripped; path-rewriter tests no longer start with `P<n>:` prefixes.
- **Findings 10–11 (models):** Type test titles describe current API only; historical rename notes moved to optional comments only if useful (prefer title-only cleanup per audit Option A).
- **Finding 13 (plugin-claude emit):** Body comment describes contract without behavior numbers / task IDs.
- **Findings 16–18 (plugin-cursor emit):** “Symmetric to Claude B*” suffixes removed from titles; body comment stripped of “Behavior 3:” prefix.

### Test Infrastructure

- Framework: Vitest (per-package configs via Turborepo)
- Test locations: `packages/*/test/**/*.test.ts`
- Conventions: ESM, existing `describe`/`it` style; fixture layout unchanged
- **New test files:** none

## Implementation Plan

### Verification gates (TDD applicability)

This milestone edits **only** test titles and comments — no production code and no new `it()` bodies. Conventional red/green refactor cycles apply to behavioral changes elsewhere; **here**, the oracle is **existing assertions**. Procedures:

1. **Baseline:** Before step 1, run **`pnpm test` from repo root** and confirm green.
2. **Per step 1–7:** After edits in that bullet, rerun tests touching that package (`pnpm turbo run test --filter=<package-or-scope>` acceptable) until green **before starting the next step**.
3. **Final:** Repeat full **`pnpm test`** at repo root after all steps.

This ordering satisfies plan-level test-first discipline: baseline tests precede edits; every edit batch is immediately validated by the same suite.

1. **CLI — `packages/cli/test/cli.test.ts`**
   - Files: `packages/cli/test/cli.test.ts`
   - Changes: In `describe('--from-dir and --to-dir flags')`, rename tests `C1:`…`C8:` per Finding 1 (strip prefixes, keep descriptive suffix). Rename Finding 3 test per audit: `should delete all sources when each produces a separate output file` (exact wording aligned to audit prose).

2. **CLI integration — `packages/cli/test/integration/integration.test.ts`**
   - Files: `packages/cli/test/integration/integration.test.ts`
   - Changes: Finding 2 — rename to `should convert Cursor FileRule to Claude native rule file` (or equivalent matching body per audit).

3. **Engine — `packages/engine/test/engine.test.ts`**
   - Files: `packages/engine/test/engine.test.ts`
   - Changes: Finding 7 — remove “after source tracking refactor” fossil from title per audit suggestion. Finding 8 — strip parenthesized `(E1)`…`(WS5)` style suffixes from all 13 flagged tests (preserve behavioral text).

4. **Engine — `packages/engine/test/path-rewriter.test.ts`**
   - Files: `packages/engine/test/path-rewriter.test.ts`
   - Changes: Finding 9 — remove `P1:` through `P28:` prefixes from every `it`/test title (28 replacements); rely on describe structure for grouping.

5. **Models — `packages/models/test/types.test.ts`**
   - Files: `packages/models/test/types.test.ts`
   - Changes: Findings 10–11 — titles per audit (“SimpleAgentSkill” value assertion; ManualPrompt `promptName` without historical “commandName” parenthetical).

6. **Plugin Claude emit — `packages/plugin-claude/test/emit.test.ts`**
   - Files: `packages/plugin-claude/test/emit.test.ts`
   - Changes: Finding 13 only — rewrite the inline comment near the `sourcePaths` / `WrittenFiles` test to remove task ID / “Behavior 4” / cross-plugin behavior numbering; keep technical explanation.

7. **Plugin Cursor emit — `packages/plugin-cursor/test/emit.test.ts`**
   - Files: `packages/plugin-cursor/test/emit.test.ts`
   - Changes: Findings 16–17 — remove `(symmetric to Claude B1/B2)` from titles. Finding 18 — strip `Behavior 3:` (or equivalent) prefix from resource `sourcePaths` comment per audit.

8. **Verification**
   - Run full `pnpm test` from repo root (and fix any accidental string typos in test names if Vitest reports missing tests — should not occur for renames only).

## Technology Validation

No new technology — validation not required.

## Dependencies

- Clean tree aside from M1 edits
- Node/pnpm per `techContext.md` and CI

## Challenges & Mitigations

- **Volume of mechanical renames (path-rewriter, engine):** Mitigation — edit per file in one pass; run package-scoped tests first if faster feedback, then full suite.
- **Optional merge of duplicate engine tests (Finding 7 note):** Deferred — M1 is rename-only; merging would change test count/structure beyond audit’s Phase A minimum.
- **Finding 12 (discover `.git` title):** Explicitly excluded from M1 milestone list; do not change in this sub-run.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight ([2026-05-01] PASS — see `memory-bank/active/progress.md` / `.preflight-status`)
- [x] Build — M1 renames/comments across 7 targets; incidental fix `plugin-discovery.test.ts` (parallel-safe `mkdtemp` per suite) — required after races surfaced under Vitest parallelism
- [x] QA ([2026-05-01] PASS — semantic review vs plan; `.qa-validation-status`)
