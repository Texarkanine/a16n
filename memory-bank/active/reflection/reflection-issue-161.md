---
task_id: issue-161
date: 2026-08-20
complexity_level: 2
---

# Reflection: issue-161 unused-vars in glob-hook and docs

## Summary

Cleared the two leftover Oxlint `unused-vars` findings in `@a16njs/glob-hook` and `docs` by deleting unused imports (`HookInput`, `dirname`). Grouped oxlint is clean; both package test suites pass.

## Requirements vs Outcome

Delivered as specified in [#161](https://github.com/Texarkanine/a16n/issues/161): both leftovers gone, one change set, no extra rule categories, no CI, no change-detector tests. Nothing added or dropped.

## Plan Accuracy

The plan was right: two import tokens, oxlint already red, existing Vitest as regression. No reordering, no surprises. The #74-style TDD process risk did not materialize (preflight PASS).

## Build & QA Observations

Build was one edit per file. QA found nothing to simplify.

## Insights

### Technical
- `oxlint --fix` still does not remove unused imports; leftover unused-vars need a manual delete.

### Process
- Grouping two packages under one leftover ticket routes the complexity tree to Level 2 even when each edit is one token. That matches "stay grouped" and is more process than design. Single-package leftovers (e.g. #156) stay Level 1.

### Million-Dollar Question

The elegant form is what shipped: never import an unused name. There is no deeper redesign; these leftovers are inventory from the #74 bind, not a missing abstraction.
