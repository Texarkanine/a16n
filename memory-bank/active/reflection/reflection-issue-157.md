---
task_id: issue-157
date: 2026-08-20
complexity_level: 2
---

# Reflection: Issue #157 CLI Unused-Variable Cleanup

## Summary

Removed 11 unused test declarations across nine CLI suites. `pnpm exec oxlint packages/cli` is clean and `pnpm --filter a16n test` passes 229/229. No product-src, config, or CI changes.

## Requirements vs Outcome

Delivered as specified. All listed leftovers are gone. No extra Oxlint categories, no lint-in-CI, no change-detector tests.

## Plan Accuracy

The file list and identifiers were exact. The planned `fixturesDirFor` follow-on removal was needed. The surprise was environmental: a fresh worktree must `pnpm build` before `pnpm --filter a16n test`, because that filter does not run Turbo's `test` → `build` edge.

## Build & QA Observations

Edits were mechanical and matched neighboring `runCli` destructures. QA found no issues. First test run failed only because `dist/` and workspace packages were unbuilt.

## Insights

### Technical

- `oxlint --fix` does not remove unused type imports or unused destructure bindings.
- Deleting an unused `fixturesDir` also requires dropping `fixturesDirFor` in the same edit, or Oxlint reports a replacement unused-var.

### Process

- Leftover unused-var tickets should treat Oxlint as the tester. New tests would be change-detectors.
- Isolated worktrees need `pnpm install` and `pnpm build` before package-filter tests.

### Million-Dollar Question

Nothing notable. The clean form is not binding unused fields, which is what the tests now do.
