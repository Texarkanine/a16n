---
task_id: m2-split-cli-test
date: 2026-05-01
complexity_level: 2
---

# Reflection: Split cli.test.ts

## Summary

Split `packages/cli/test/cli.test.ts` (1108 lines, 55 tests) into 7 domain-specific test files with a shared `test-support/cli-runner.ts` helper. Clean execution — no deviations from plan, no QA findings, all tests green.

## Requirements vs Outcome

Delivered exactly what was planned: 7 domain files matching the audit's prescribed split boundaries (help, plugins, discover, convert, gitignore, delete-source, from-to-dir), shared helper extraction, and original file deletion. Test count unchanged at 55. Bonus: test runtime halved (~16s → ~8s) from parallel execution with per-test temp dir isolation.

## Plan Accuracy

Plan was correct in every detail. The 10-step sequence needed no reordering. All three identified challenges (temp dir isolation, error handling describe split, symlink test) materialized and were handled as planned. No surprises.

## Build & QA Observations

Build was highly mechanical — each file was a direct extraction from the original monolith with two systematic modifications: (1) hardcoded temp dir replaced with `mkdtemp()` per-test isolation, (2) `runCli()` cwd parameter made explicit (no default). QA was clean — zero findings across all 7 semantic constraints.

## Insights

### Technical

- The `mkdtemp()` pattern for per-test temp dir isolation is strictly better than hardcoded paths and should be the default for all remaining monolithic test file splits (M3–M7). This reinforces the M1 finding from `plugin-discovery.test.ts`.

### Process

- Monolithic test file splits are highly mechanical: plan-to-implementation mapping is 1:1 with no design decisions. L2 is the correct complexity level. The remaining 5 independent splits (M3–M7) should follow this exact template.

### Million-Dollar Question

If feature-scoped test files had been a foundational assumption, `test-support/cli-runner.ts` would have existed from day one, each feature PR would have added its own `cli-<feature>.test.ts`, and `mkdtemp()` would have been the original temp dir pattern. The current solution is what would have been built had the assumption been there from the start — the split produced the natural end state, not a compromise.
