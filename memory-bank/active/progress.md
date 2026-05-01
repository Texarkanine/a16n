# Progress: M4 — Split plugin-claude emit.test.ts

Split `packages/plugin-claude/test/emit.test.ts` (~2474 lines, 10 top-level describes) into domain-specific test files with shared emit setup extracted to `test-support/` (SLOBAC audit Finding 14).

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. M4 classified Level 2: self-contained test reorganization within `packages/plugin-claude`, mirrors M2/M3 scope (monolithic-test-file split + shared helpers via `test-support/`). No architectural implications.
- **L2 PLAN** — Complete. 9-way split (audit's 8 + dedicated `emit-mixed-models.test.ts`); FileRule + FileRule Empty Globs Validation merged into `emit-file-rule.test.ts`; new `test-support/emit-helpers.ts` reuses the M3 `suiteTempDir` shape; TDD ordering explicit (baseline → helper → per-describe splits → delete monolith → monorepo green → docs). No new deps.
