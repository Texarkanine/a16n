# Progress: M3 — Split integration.test.ts + shared-state

Split `packages/cli/test/integration/integration.test.ts` (~1508 lines, 7 top-level describes) into domain-specific test files with shared helpers extracted to `test-support/`, and fix shared-state by moving module-level engine into per-describe factory (SLOBAC audit Findings 4, 6).

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. M3 classified Level 2: self-contained integration test reorganization within `packages/cli`, mirrors M2 scope; adds explicit shared-state fix (module-level engine → per-describe factory).
- **L2 PLAN** — Complete. Seven-way split per audit naming; `integration-helpers.ts`; explicit TDD ordering (baseline → helpers+engine factory → temp isolation → vertical slices); parallel-safe temp roots.
- **L2 PREFLIGHT** — PASS. TDD ordering explicit per step; helpers colocated with M2 `test-support/` pattern; parallel temp isolation called out; no new deps. Advisory: if any flake remains after split, confirm Vitest pool defaults with `pnpm test` logs.
