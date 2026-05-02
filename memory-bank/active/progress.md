# Progress: M7 — Split plugin-cursor discover.test.ts

Structural split only (SLOBAC Finding 20): split `packages/plugin-cursor/test/discover.test.ts` (~832 lines; **four** root `describe` suites) into domain-specific test files, matching the pattern used for `plugin-claude` discover (M5) and cross-milestone invariants in `milestones.md`.

**Complexity:** Level 2

## Phase History

### 2026-05-02 — COMPLEXITY-ANALYSIS — Complete

- Target: first unchecked milestone in `milestones.md` — split `discover.test.ts` in `@a16njs/plugin-cursor`.
- Classification: Level 2 — single-package, test-only refactor mirroring completed M5 (`plugin-claude` discover split); no production API or behavioral changes.

### 2026-05-02 — L2 PLAN — Complete

- Plan in `memory-bank/active/tasks.md`: four files (`discover-mdc-and-ignore`, `discover-skills`, `discover-commands`, `discover-agent-skill-io`) + `test-support/discover-helpers.ts`; parity gates 63 discover `it`, 137 package tests.
- Advisory: `milestones.md` line still says “9 top-level describes” for Finding 20 — actual layout is **four** root `describe` blocks; optional checklist wording fix is out of scope unless the operator wants consistency.

### 2026-05-02 — L2 PREFLIGHT — PASS

- TDD encoding: baseline and per-extract `pnpm test` gates ordered before “next” cut; refactor has no production code — acceptable.
- Conventions: matches M5/`discover-helpers` precedent and `test-support/` locality rule.
- Completeness: all four monolith suites mapped; docsgrep step included.
- Radical innovation (advisory): none — mirror Claude/Cursor symmetry.

### 2026-05-02 — L2 BUILD — Complete

- Added `packages/plugin-cursor/test/test-support/discover-helpers.ts`; split monolith into **nine** `discover-*.test.ts` files (one per root `describe`); removed `discover.test.ts`.
- Parity: **66** discover tests, **137** package tests; root `pnpm test` (Turbo) green.
- **Deviation from preflight plan text:** Initial planning miscounted the monolith as four suites; implementation follows the actual **nine** root `describe` blocks aligned with the milestone (“9 top-level describes”).
