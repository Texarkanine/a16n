# Active Context

## Current Task: v1-release-rollout-m6
**Phase:** COMPLEXITY-ANALYSIS - COMPLETE

## What Was Done
- Advanced the L4 from M5 to M6: marked M5 `- [x]`, cleared M5 sub-run ephemerals (operator confirmed `a16n@1.0.0` is live).
- Classified M6 (documentation capstone + rollout cruft cleanup) as **Level 1**: docs + one `.cursor/rules/` rule + one spent config-key removal; single component, low risk, no design work. Matches the milestone's own L1 estimate and M3/M5 precedent.
- Re-scoped `projectbrief.md` to M6, folding in the operator's cruft-cleanup request.

## Decisions
- Cruft scope: the only genuine "solely-scaffolding" item is the spent `release-as: "1.0.0"` on `packages/cli` (latent bug now that 1.0.0 is live). The `## Stability` README sections are real docs (keep); the `workspace-publish-invariant`/`publish-shape` tests are permanent guards (keep).
- M6 absorbs dissolved M2: post-publish tarball verification is the real safety net, not in-pipeline guards.

## Next Step
- Load Level 1 workflow → Build phase: author `CONTRIBUTING.md` runbook + `.cursor/rules/` rule, remove the spent CLI `release-as` key.
