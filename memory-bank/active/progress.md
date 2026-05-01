# Progress: M4 — Split plugin-claude emit.test.ts

Split `packages/plugin-claude/test/emit.test.ts` (~2474 lines, 10 top-level describes) into domain-specific test files with shared emit setup extracted to `test-support/` (SLOBAC audit Finding 14).

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. M4 classified Level 2: self-contained test reorganization within `packages/plugin-claude`, mirrors M2/M3 scope (monolithic-test-file split + shared helpers via `test-support/`). No architectural implications.
- **L2 PLAN** — Complete. 9-way split (audit's 8 + dedicated `emit-mixed-models.test.ts`); FileRule + FileRule Empty Globs Validation merged into `emit-file-rule.test.ts`; new `test-support/emit-helpers.ts` reuses the M3 `suiteTempDir` shape; TDD ordering explicit (baseline → helper → per-describe splits → delete monolith → monorepo green → docs). No new deps.
- **L2 PREFLIGHT** — PASS. TDD encoding: each split step ends with `pnpm --filter @a16njs/plugin-claude test`, with baseline capture in step 1 and test-count parity gate after step 13 (monolith deletion). Conventions: `test-support/` is package-local (L4 invariant respected); file naming matches audit prescription + M3 `<layer>-<domain>.test.ts` pattern. Dependency impact: step 14 full-monorepo `pnpm test` covers `cli` integration downstream. No conflicts with existing helpers (CLI helpers live in a different package). All 10 top-level describes accounted for; `'empty input'` correctly placed with its GlobalPrompt parent. Advisory: confirm Finding 13's body-comment fossil (line 1783, `emit.test.ts`) is already gone from M1 before the split carries it into `emit-agent-skill-io.test.ts` — if it reappears, flag in QA rather than sneaking a rename into M4.
