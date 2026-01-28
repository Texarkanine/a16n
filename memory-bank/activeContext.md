# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Phase 5 Enhancement: `--if-gitignore-conflict` Flag** — ✅ Implementation complete (TDD process), integration tests pending.

## Session State

- Phase 5 core implementation: ✅ Complete
- Phase 5 bug fixes (B1-B8, E1): ✅ Complete
- CR-10 source tracking: ✅ Complete
- `--if-gitignore-conflict` flag: 📋 Planning complete

## Task Summary

Add `--if-gitignore-conflict [skip|ignore|exclude|hook|commit]` to resolve git-ignore conflicts in match mode.

### Two Conflict Scenarios

1. **Source Conflict:** Multiple sources with different git-ignore statuses → single output
   - Currently: Skip + emit warning
   - With flag: User specifies resolution

2. **Destination Conflict:** Sources → existing output with different status
   - Currently: Skip + emit warning
   - With flag: User specifies resolution

### Resolution Options

| Value | Action |
|-------|--------|
| `skip` | Default. Current behavior (skip + warning) |
| `ignore` | Add to `.gitignore` |
| `exclude` | Add to `.git/info/exclude` |
| `hook` | Add to pre-commit hook |
| `commit` | Remove from all a16n-managed sections (ensure tracked) |

## Key Implementation Points

1. **New CLI flag** with validation (5 allowed values)
2. **New removal functions** in `git-ignore.ts` for `commit` option:
   - `removeFromGitIgnore()`
   - `removeFromGitExclude()`
   - `removeFromPreCommitHook()`
3. **Update conflict handling** in match mode to check flag value
4. **Tests** for each scenario

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Only affects match mode | Other modes (ignore/exclude/hook) don't have conflicts |
| Default is `skip` | Backwards compatible with current behavior |
| `commit` removes from a16n sections only | Never modify user's manual entries outside semaphore |

## Files to Modify

| File | Changes |
|------|---------|
| `packages/cli/src/index.ts` | Add flag, update conflict logic |
| `packages/cli/src/git-ignore.ts` | Add removal functions |
| `packages/cli/test/git-ignore.test.ts` | Unit tests for removal |
| `packages/cli/test/cli.test.ts` | Integration tests |

## Context from Prior Work

| Phase | Status |
|-------|--------|
| Phase 1 | ✅ GlobalPrompt MVP |
| Phase 2 | ✅ FileRule + AgentSkill |
| Phase 3 | ✅ AgentIgnore + CLI polish |
| Phase 4 | ✅ AgentCommand |
| Phase 5 Core | ✅ Git ignore output management |
| Phase 5 Bugs | ✅ B1-B8, E1 |
| CR-10 | ✅ Source tracking |
| **Current** | 📋 `--if-gitignore-conflict` flag |

## Branch

Current branch: `phase-5`

## Blockers

None - planning complete, ready for `/build` or `/plan`.

## Next Steps

1. Implement removal functions in `git-ignore.ts`
2. Add CLI flag with validation
3. Update conflict handling in match mode
4. Write tests
5. Verify all tests pass
