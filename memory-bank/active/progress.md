# Progress: M5 — Split plugin-claude discover.test.ts

Split `packages/plugin-claude/test/discover.test.ts` (~813 lines, 7 top-level describes) into domain-specific test files (SLOBAC Finding 15). Structural reorganization only; no behavioral changes.

**Complexity:** Level 2

## Phase History

### 2026-05-02 — COMPLEXITY-ANALYSIS — Complete

- Classification target: M5 milestone text in `memory-bank/active/milestones.md`.
- Rationale: Single package (`@a16njs/plugin-claude`), test-only split along existing behavior domains, mirrors completed M2–M4 remediations. Not a bug fix; scoped enhancement / maintenance.

## 2026-05-02 — L2 PLAN — COMPLETE

- Seven-way vertical split by top-level describe:
  1. `discover-claude-md.test.ts` — `Claude Plugin Discovery`
  2. `discover-simple-agent-skill.test.ts` — `Claude SimpleAgentSkill Discovery`
  3. `discover-agent-ignore.test.ts` — `Claude AgentIgnore Discovery`
  4. `discover-manual-prompt.test.ts` — `Claude ManualPrompt Discovery`
  5. `discover-never-manual-prompt.test.ts` — `Claude Plugin Never Discovers ManualPrompt`
  6. `discover-agent-skill-io.test.ts` — `AgentSkillIO Discovery`
  7. `discover-rules.test.ts` — `Claude Rules Discovery`
- Baseline parity: 58 discover tests, 144 package tests; monorepo `pnpm test` green at milestone boundary.
- Docs: `packages/docs/docs/plugin-development/index.md` lists `discover.test.ts` as template (same stance as M4 for `emit.test.ts` — likely unchanged).

## 2026-05-02 — L2 PREFLIGHT — PASS

- TDD ordering verified; conventions and dependency impact documented in plan.
- Advisory: optional helper + batch extraction allowed with parity gates.

## 2026-05-02 — L2 BUILD — COMPLETE

- Implemented seven-way split per plan; added `test-support/discover-helpers.ts`; deleted monolith `discover.test.ts`.
- Parity gates: 58 discover tests, 144 package tests; full monorepo `pnpm test` green.
- Docs: plugin-development recommended structure lists `discover-*.test.ts` / `emit-*.test.ts`.
