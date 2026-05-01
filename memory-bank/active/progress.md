# Progress: M1 — SLOBAC rename remediation (fossils + naming lies)

Sub-run scoped to milestone M1 from `milestones.md`: rename-only remediation of deliverable-fossils and naming-lies in cli, engine, models, plugin-claude, and plugin-cursor tests per audit findings 1–3, 7–11, 13, 16–18 (see `slobac-audit.md`). No assertion or production-code changes — titles, prefixes, suffixes, and task-derived comments only.

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. M1 classified Level 2: systematic cross-package test-metadata cleanup with regression signal = existing Vitest suite.
- **L2 PLAN** — Complete. Checklist written to `memory-bank/active/tasks.md` mapping findings 1–3, 7–11, 13, 16–18 to concrete files (`cli`, `engine`, `models`, plugin emit tests); explicit exclusion of Finding 12 and monolith milestones.
- **L2 PREFLIGHT** — PASS. TDD applicability encoded as baseline + per-step test gates for rename-only work; conventions and completeness OK. **Advisory:** optional post-pass `grep` for `C[1-9]:`, `P[0-9]+:`, or task-id tokens across `packages/**/test` to catch misses (not blocking).
- **L2 BUILD** — Complete. Implemented audit mappings 1–3, 7–11, 13, 16–18 (`cli.test.ts`, `integration.test.ts`, `engine.test.ts`, `path-rewriter.test.ts`, `types.test.ts`, plugin emit comments/titles). `plugin-discovery.test.ts` rewritten to isolate temp dirs (`mkdtemp`) — unrelated to SLOBAC wording but unblock parallel Vitest regressions witnessed during verification.
