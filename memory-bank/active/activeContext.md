# Active Context

## Current Task: v1-release-rollout-m1
**Phase:** BUILD - COMPLETE

## What Was Done
- Set temporary `release-as` in `release-please-config.json`: `@a16njs/plugin-agentsmd` → `1.0.3`, `a16n` → `0.15.3`.
- Replaced the original per-package `pnpm pack` tests (near-tautological; couldn't catch the npm-vs-pnpm cause) with a single repo-level source-invariant test `packages/cli/test/workspace-publish-invariant.test.ts`: every workspace sibling reference must use `workspace:` in source (invariant #3, repo-wide).
- Deferred the real artifact-inspection guard (matches the operator's npm-publish error) to M2.

## Next Step
- Run `/niko-qa` for semantic review, then `/niko-reflect` after merge + publish verification.
