# Active Context

## Current Task: v1-release-rollout-m1
**Phase:** BUILD - COMPLETE

## What Was Done
- Added `publish-pack.test.ts` + `test-support/pack.ts` in `plugin-agentsmd` and `cli` (4 new tests; asserts `pnpm pack` rewrites `workspace:*`).
- Set temporary `release-as` in `release-please-config.json`: `@a16njs/plugin-agentsmd` → `1.0.3`, `a16n` → `0.15.3`.
- Full suite: all tests pass; typecheck clean.

## Next Step
- Run `/niko-qa` for semantic review, then `/niko-reflect` after merge + publish verification.
