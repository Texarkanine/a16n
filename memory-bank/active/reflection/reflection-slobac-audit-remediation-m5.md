---
task_id: slobac-audit-remediation-m5
date: 2026-05-02
complexity_level: 2
---

# Reflection: M5 — Split plugin-claude discover.test.ts

## Summary

Moved all cases from `packages/plugin-claude/test/discover.test.ts` into seven `discover-<domain>.test.ts` Vitest modules, centralized fixture resolution in `test-support/discover-helpers.ts` (`discoverFixturesDir`), removed the monolith, and refreshed the plugin-development doc tree for `discover-*.test.ts` / `emit-*.test.ts`. Parity gates (58 discover `it`s, 144 package `it`s) matched the plan; QA required no corrective code edits — only bookkeeping and this reflection.

## Requirements vs Outcome

Project-brief and task requirements satisfied: Finding 15 (monolithic discover file), no changes under `packages/plugin-claude/src/`, fixture paths unchanged, assertions preserved structurally via block moves, docs sweep completed where the tutorial tree implied filenames. Milestone checklist in `milestones.md` remains under `/niko` lifecycle authority (QA did not mutate it).

## Plan Accuracy

The seven describe domains, optional helper recommendation, parity gates, and ordered extraction guidance matched execution. Preflight allowances (batch extraction with parity gates) align with how M4 shipped; helper stayed single-purpose (~16 lines).

## Build & QA Observations

Build followed the proven M4 pattern: fixtures are read-only, so split files avoid emit-style temp-directory concerns. QA verification was empirical: parity counts script, artifact presence checklist, stale path grep (CONTRIBUTING unaffected; archival memory-bank / audit prose still cites historical paths, which is expected).

## Insights

### Technical

- Discover split plus `discoverFixturesDir(import.meta.url)` mirrors emit’s fixture root pattern (`path.join(dirname(fileURLToPath(...)), 'fixtures')`) without coupling to cwd — safe under Vitest’s parallel-by-file scheduling for read-only trees.
- Nothing notable beyond reuse of prior split conventions — intentional consistency.

### Process

- Parity gates (`it(` totals) turned a large mechanical diff into an objective completeness check; retaining them as explicit numeric targets in tasks paid off versus eyeballing.

### Million-Dollar Question

If Claude discover tests had been authored one top-level describe per file from introduction, alongside a one-line fixtures helper, no monolithic `discover.test.ts` would accumulate. The shipped layout is effectively that ideal state post-remediation — same layering M4 articulated for emit.
