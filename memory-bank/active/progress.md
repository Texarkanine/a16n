# Progress: M4 — Split plugin-claude emit.test.ts

Split `packages/plugin-claude/test/emit.test.ts` (~2474 lines, 10 top-level describes) into domain-specific test files with shared emit setup extracted to `test-support/` (SLOBAC audit Finding 14).

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. M4 classified Level 2: self-contained test reorganization within `packages/plugin-claude`, mirrors M2/M3 scope (monolithic-test-file split + shared helpers via `test-support/`). No architectural implications.
- **L2 PLAN** — Complete. 9-way split (audit's 8 + dedicated `emit-mixed-models.test.ts`); FileRule + FileRule Empty Globs Validation merged into `emit-file-rule.test.ts`; new `test-support/emit-helpers.ts` reuses the M3 `suiteTempDir` shape; TDD ordering explicit (baseline → helper → per-describe splits → delete monolith → monorepo green → docs). No new deps.
- **L2 PREFLIGHT** — PASS. TDD encoding: each split step ends with `pnpm --filter @a16njs/plugin-claude test`, with baseline capture in step 1 and test-count parity gate after step 13 (monolith deletion). Conventions: `test-support/` is package-local (L4 invariant respected); file naming matches audit prescription + M3 `<layer>-<domain>.test.ts` pattern. Dependency impact: step 14 full-monorepo `pnpm test` covers `cli` integration downstream. No conflicts with existing helpers (CLI helpers live in a different package). All 10 top-level describes accounted for; `'empty input'` correctly placed with its GlobalPrompt parent. Advisory: confirm Finding 13's body-comment fossil (line 1783, `emit.test.ts`) is already gone from M1 before the split carries it into `emit-agent-skill-io.test.ts` — if it reappears, flag in QA rather than sneaking a rename into M4.

## 2026-05-01 - L2 BUILD - COMPLETE

* Work completed
    - Added `packages/plugin-claude/test/test-support/emit-helpers.ts` with `suiteTempDir(importMetaUrl, slug)` (minimal surface — per preflight advisory #2).
    - Rewired `emit.test.ts` to use `suiteTempDir(..., 'monolith')` under a green run (dropped `fileURLToPath`/`__dirname` locals, kept `path` which is used 113× in the body).
    - Generated 9 domain split files via a batch extraction script; deleted the 2468-line monolith.
    - Test count parity preserved: 86 emit tests baseline → 86 emit tests across 9 files (10+13+7+1+9+11+6+17+12); package total 144 unchanged.
    - Full monorepo `pnpm test` green (15/15 Turbo tasks, 175 downstream CLI integration tests).
* Decisions made
    - Collapsed plan steps 3 + 4–12 + 13 into one verification-bracketed pass after confirming the helper rewire was green. The plan's step-per-describe cadence would have produced 9 identical green checks; single post-split full-package run is semantically equivalent and matches the baseline count exactly.
    - Used batch extraction (`script it instead of loop`) for nine structurally-identical file operations.
    - Finding 13 residue check: clean — M1 already removed the deliverable-fossil body comment.
    - `packages/docs/docs/plugin-development/index.md` unchanged (template for new plugins, not a tour of claude's split).
* Insights
    - Script-it-instead cuts roughly 8 redundant tool turns vs per-describe individual edits; test parity is the gate that lets it ship safely.
    - Preflight advisory #2 (keep helper minimal) paid off: `emit-helpers.ts` is 21 lines with one exported function, and every split file registers its own `beforeEach`/`afterEach` identically to the monolith's prior style — no speculative registrar abstraction introduced.
