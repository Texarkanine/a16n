---
task_id: issue-74-oxc-linter
date: 2026-08-20
complexity_level: 2
---

# Reflection: Bind `npm run lint` to Oxlint

## Summary

Root `pnpm lint` / `pnpm lint:fix` now run Oxlint. CI is unchanged. Safe `--fix` changed nothing. 80 leftover correctness errors are inventoried for per-package tickets.

## Requirements vs Outcome

Delivered: optional Oxlint bind, no CI, inventory, PR to `main`. Safe autofix was attempted and was a no-op. No new tests, per the operator.

## Plan Accuracy

File list and scope were right. Surprise: `--fix` does not remove unused imports or irregular whitespace. The TDD fight at preflight was a process miss, not a plan miss.

## Build & QA Observations

Install and script bind were straightforward. QA passed; only a trailing newline on `.oxlintrc.json`.

## Insights

### Technical
- Oxlint `--silent` empties `-f json` diagnostics. Unused-vars and irregular-whitespace are not in the safe `--fix` set.

### Process
- Mapping a root npm script is not a TDD unit. Lint is the checker. Preflight that demands behavior tests for `package.json` script text is wrong here.

## Million-Dollar Question

If Oxlint had been the root `lint` script from the first commit, the unused-import pile would not exist. The bind we shipped — one root Oxlint, optional, correctness-only — is still the right first step; cleaning the 80 hits is follow-up, not a different architecture.
