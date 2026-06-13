# Active Context

## Current Task: v1-release-rollout-m6
**Phase:** BUILD - COMPLETE

## What Was Done
- Authored `CONTRIBUTING.md` runbook (Releases + Adding a publishable package): four M1 traps, OIDC first-publish bootstrap, post-publish tarball verification, dissolved-M2 lesson.
- Added `.cursor/rules/shared/publishing-packages.mdc` routing agents to the runbook.
- Cleanup: removed the spent `release-as: "1.0.0"` from `packages/cli` (last rollout key); config still valid, no keys remain.
- Full validation green (build/test/typecheck); source still `workspace:*`.

## Decisions
- Cruft scope: the only genuine "solely-scaffolding" item is the spent `release-as: "1.0.0"` on `packages/cli` (latent bug now that 1.0.0 is live). The `## Stability` README sections are real docs (keep); the `workspace-publish-invariant`/`publish-shape` tests are permanent guards (keep).
- M6 absorbs dissolved M2: post-publish tarball verification is the real safety net, not in-pipeline guards.

## Next Step
- QA phase (niko-qa skill): semantic review of the runbook, rule, and config cleanup.
