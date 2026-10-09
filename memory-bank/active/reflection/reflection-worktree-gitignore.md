---
task_id: worktree-gitignore
date: 2026-10-09
complexity_level: 2
---

# Reflection: Document repository-wide gitignore scope

## Summary

The CLI overview now defines each `--gitignore-output-with` style and warns that `exclude` and `hook` write files Git shares across every linked worktree. The section matches the plan, and QA passed.

## Requirements vs Outcome

The rework brief asked for one section on `packages/docs/docs/cli/index.md`, a Docusaurus warning admonition in that section, and no repetition elsewhere. That is what landed. The opening sentence uses "git-ignored" rather than "tracked", from a preflight wording note. The runtime-guard idea from preflight was left out, because the brief kept the behavior and limited the change to docs.

## Plan Accuracy

The plan named the file, the insertion point, the table, and the admonition, and build transcribed them. The challenges (restating the table, under-describing `match`) did not show up in the diff. No steps were reordered.

## Build & QA Observations

Build was a single edit. `pnpm build`, `pnpm test`, and `pnpm lint:check` passed. QA confirmed placement, the table, the admonition syntax, and that Examples, help text, and the FAQ were untouched. QA's only note was the opening-sentence wording, already recorded during build.

## Insights

### Technical

Nothing notable.

### Process

A verification pass will propose a runtime guard for a footgun the operator has already chosen to keep. The brief's "docs only, this section only" line is what kept that proposal from becoming scope.

### Million-Dollar Question

The section that shipped is the one the flag's overview page would have had if repository-wide scope had been written down when the flag was introduced. No separate code path.
