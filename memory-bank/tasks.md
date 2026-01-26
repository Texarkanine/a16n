# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

| Field | Value |
|-------|-------|
| **Task ID** | PHASE5-GITIGNORE |
| **Title** | Phase 5: Git Ignore Output Management |
| **Complexity** | Level 3 (Intermediate) |
| **Type** | Feature |
| **Spec** | `planning/PHASE_5_SPEC.md` |
| **Estimated Effort** | 14-20 hours |

## Summary

Provide CLI options to manage git tracking of converted output files via `--gitignore-output-with <style>` flag with 5 styles: `none`, `ignore`, `exclude`, `hook`, `match`.

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Style `none` (default) makes no git changes | ⬜ |
| AC2 | Style `ignore` appends to `.gitignore` with semaphores | ⬜ |
| AC3 | Style `exclude` appends to `.git/info/exclude` | ⬜ |
| AC4 | Style `hook` creates/updates pre-commit hook | ⬜ |
| AC5 | Style `match` ignores output when source is ignored | ⬜ |
| AC6 | Style `match` tracks output when source is tracked | ⬜ |
| AC7 | Boundary crossing emits warning | ⬜ |
| AC8 | Only new files are managed (not edited existing) | ⬜ |
| AC9 | Dry run shows planned git changes | ⬜ |
| AC10 | Verbose mode shows git operations | ⬜ |
| AC11 | JSON output includes `gitIgnoreChanges` | ⬜ |
| AC12 | Error handling for non-git-repos | ⬜ |

## Implementation Checklist

### Track A: Models & Type Changes
- [x] Task 1: Extend `WrittenFile` with `isNewFile` boolean
- [x] Task 9: Extend `ConversionResult` with `gitIgnoreChanges`

### Track B: Plugin Updates
- [x] Task 2: Update Cursor plugin emit to track `isNewFile`
- [x] Task 2: Update Claude plugin emit to track `isNewFile`

### Track C: CLI & Git Utilities
- [x] Task 3: Add `--gitignore-output-with <style>` CLI flag
- [x] Task 4: Create `git-ignore.ts` utilities module
- [x] Task 5: Implement style `ignore`
- [x] Task 6: Implement style `exclude`
- [x] Task 7: Implement style `hook`
- [x] Task 8: Implement style `match`

### Track D: Finalization
- [ ] Task 10: Create test fixtures (git repo scenarios)
- [ ] Task 11: Integration tests for all 5 styles
- [ ] Task 12: Documentation updates (README, CLI README)

## Task Dependencies

```
T1 (WrittenFile) → T2 (Plugins) → T5-T8 (Styles)
T3 (CLI Flag) → T5-T8 (Styles)
T4 (Git Utils) → T5-T8 (Styles)
T5-T8 → T9 (ConversionResult)
T10 (Fixtures) → T11 (Integration Tests)
T9 → T11
T11 → T12 (Docs)
```

## Parallel Work Opportunities

- **Batch 1** (parallel): Tasks 1, 3, 4, 10
- **Batch 2** (parallel, after Batch 1): Tasks 2, 5, 6, 7, 8
- **Batch 3** (sequential): Task 9
- **Batch 4** (sequential): Task 11
- **Batch 5** (sequential): Task 12

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Only manage new files | Prevents accidentally untracking user's manually managed files |
| Semaphore pattern | Allows regeneration without losing user content |
| Directory entries where possible | Efficiency (`.a16n/` instead of many individual files) |
| Conservative `match` heuristic | If ANY source ignored → output ignored |
| `BoundaryCrossing` warning code | New warning type for git status conflicts |

## Files to Create

- `packages/cli/src/git-ignore.ts` — Git utilities module

## Files to Modify

- `packages/models/src/plugin.ts` — `WrittenFile.isNewFile`
- `packages/models/src/warnings.ts` — `BoundaryCrossing` warning code
- `packages/plugin-cursor/src/emit.ts` — Track `isNewFile`
- `packages/plugin-claude/src/emit.ts` — Track `isNewFile`
- `packages/engine/src/index.ts` — `gitIgnoreChanges` in `ConversionResult`
- `packages/cli/src/index.ts` — New flag and style implementations
- `README.md` — Feature documentation
- `packages/cli/README.md` — Flag documentation

## Test Locations

- `packages/models/test/plugin.test.ts` — `isNewFile` tests
- `packages/plugin-cursor/test/emit.test.ts` — Plugin tests
- `packages/plugin-claude/test/emit.test.ts` — Plugin tests
- `packages/cli/test/git-ignore.test.ts` — New test file for utilities
- `packages/cli/test/integration/integration.test.ts` — E2E scenarios

## Verification Command

```bash
pnpm format && pnpm lint -- --fix && pnpm build && pnpm test -- --silent
```
