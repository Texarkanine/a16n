# Active Context

## Current Task: v1-release-rollout-m5
**Phase:** BUILD - COMPLETE

## What Was Done
- Wave C (CLI → `1.0.0`): `release-as: "1.0.0"` on `packages/cli`; spent M4 `release-as` keys removed from engine/plugins; CLI README stability note added as RP path-touch.
- Verified Wave B deps live on npm before editing.
- Full validation green (build/test/typecheck).

## Decisions
- No new unit test (release-config + docs change; `workspace-publish-invariant` guards source; RP version output is operator merge-gated). Mirrors M3/M4 precedent.
- Deliverable commit uses `fix(release):` (not `chore:`) so Release-Please cuts the release.

## Next Step
- `/niko-qa` — semantic review. Operator merge-gate after QA: RP PR must bump `a16n` → `1.0.0`.
