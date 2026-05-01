# Active Context

## Current Task: SLOBAC Audit Remediation — M4 (Split plugin-claude emit.test.ts)

**Phase:** L2 PLAN - COMPLETE

## What Was Done

- Classified M4 as Level 2 (test reorganization mirroring M2/M3).
- Authored the full L2 plan in `memory-bank/active/tasks.md`:
    - 9-way vertical split (audit's 8 prescribed + dedicated `emit-mixed-models.test.ts` for the cross-cutting `'Mixed Model Emission'` describe).
    - FileRule + FileRule Empty Globs Validation collapse into `emit-file-rule.test.ts` per audit naming.
    - New `packages/plugin-claude/test/test-support/emit-helpers.ts` exposing `suiteTempDir(import.meta.url, slug)` mirroring the M3 pattern from `packages/cli/test/test-support/integration-helpers.ts`.
    - Explicit TDD ordering: baseline green → helper + monolith rewire → per-describe splits → monolith delete → full-monorepo green → doc sweep.
    - Parallel-safe per-suite `.temp-emit/<slug>/` roots.
- No new dependencies; technology validation not required.

## Key Decisions

- 9 split files, not the audit's 8: `emit-mixed-models.test.ts` is a necessary extension because `'Mixed Model Emission'` is a distinct cross-cutting behavior domain.
- `test-support/emit-helpers.ts` kept minimal; no cross-package helper imports (preserves L4 cross-milestone invariant).
- Milestone checkbox advancement deferred to `/niko` Step 2a per the M3 reflection.

## Next Step

- L2 PREFLIGHT — invoke the `niko-preflight` skill to validate the plan before build.
