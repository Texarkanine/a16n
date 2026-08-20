---
task_id: issue-162
date: 2026-08-20
complexity_level: 2
---

# Reflection: Bind Oxlint into CI, local lint, and pre-commit

## Summary

Local `pnpm lint` now autofixes; husky pre-commit and CI run `pnpm lint:check` only. Docs match. Oxlint is clean. Isolation held: husky was not left installed on the shared parent git config.

## Requirements vs Outcome

Delivered as specified: autofix local command, check-only hook + CI, pnpm `prepare` installer, no extra Oxlint categories, no change-detector tests, CONTRIBUTING and techContext updated. Added `HUSKY=0` on CI install and a worktree install note after the husky spike wrote shared `core.hooksPath`.

## Plan Accuracy

File list and script inversion were right. The surprise was husky 9.1.7 writing `core.hooksPath` to the **shared** parent `.git/config` from a worktree, not worktree-local config. The plan absorbed `HUSKY=0` before build.

## Build & QA Observations

Build was mechanical. QA PASS with no fixes. Did not execute husky after the spike unset.

## Insights

### Technical
- In a git worktree, `git config core.hooksPath` (husky's install) writes the shared parent `.git/config` and would bypass machine-local `.git/hooks` (including ai-rizz). `simple-git-hooks` would overwrite that shared `pre-commit` file. Use `HUSKY=0` when installing in a shared-`.git` worktree.

### Process
- Mapping lint scripts is not a TDD unit; encoding that in the plan kept preflight from repeating the #74 FAIL.

### Million-Dollar Question

Husky is the right clone-time installer. The worktree `HUSKY=0` escape is the honest companion, not a custom branching installer. Nothing more foundational was needed.
