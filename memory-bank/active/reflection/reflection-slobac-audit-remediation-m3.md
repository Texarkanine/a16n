---
task_id: slobac-audit-remediation-m3
date: 2026-05-01
complexity_level: 2
---

# Reflection: M3 — Split integration.test.ts + shared-state

## Summary

Split the former monolithic `packages/cli/test/integration/integration.test.ts` into seven domain Vitest files, added `test-support/integration-helpers.ts` with `createIntegrationEngine()`, `suiteTempDir`, and shared FS/compare helpers, and removed module-level `A16nEngine` in favor of per-suite `beforeEach` factories and distinct `.temp-integration/<slug>/` roots. Full monorepo tests stayed green; QA required no follow-up code changes.

## Requirements vs Outcome

All project-brief and task requirements were met: Findings 4 and 6 addressed, audit-prescribed filenames and boundaries, helpers in package-local `test-support/`, fixtures and assertion bodies preserved, no production behavior change. The written plan assumed a strictly incremental sequence (helpers → temp slugs → seven vertical slices); delivery folded those steps into one mechanical pass after baseline verification, which is a execution pacing difference only, not a scope gap.

## Plan Accuracy

The file list, slugs, and TDD ordering in `tasks.md` were correct; nothing in the plan had to be re-scoped. The only deviation was combining steps 2–6 into a single changeset, which traded step-by-step “verify after each slice” checkpoints for speed while risk stayed low because the work was verbatim moves plus mechanical import/temp wiring.

## Build & QA Observations

Build was smooth and repetitive: same pattern as M2 (`cli.test.ts` split) with engine construction and temp roots instead of `runCli()`. QA was clean—semantic review matched the plan with no corrective edits.

## Insights

### Technical

- Per-suite `suiteTempDir(importMetaUrl, slug)` plus `createIntegrationEngine()` in `beforeEach` is the same isolation recipe as M2’s per-test `mkdtemp` for subprocess tests; it belongs in every future monolith split that shares filesystem state.
- `pnpm --filter` for this repo uses the package name from `package.json` (e.g. `a16n`); relying on a guessed scoped name breaks commands—confirm with the package manifest when documenting run examples.

### Process

- M2’s reflection already called out the template for M3–M7; M3 validated that template end-to-end. L2 remains the right complexity for these splits.

### Million-Dollar Question

If fixture-based integration tests had started as one file per top-level concern under `test/integration/` with `integration-helpers.ts` (or equivalent) from the first PR, there would never have been a module-level engine or a single 1500-line file—only the same seven files and helpers that exist now, with parallel-safe temp layout assumed from the start.
