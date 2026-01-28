# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Phase 6: CLI Polish** - Implementing dry-run output wording and `--delete-source` flag

## Session State

Planning complete. Ready to begin implementation.

## Context from Prior Work

| Phase | Status |
|-------|--------|
| Phase 1 | ✅ GlobalPrompt MVP |
| Phase 2 | ✅ FileRule + AgentSkill |
| Phase 3 | ✅ AgentIgnore + CLI polish |
| Phase 4 | ✅ AgentCommand |
| Phase 5 | ✅ Git ignore output management |
| **Phase 6** | 🔄 **In Progress** - CLI Polish |

## Key Files Analyzed

| File | Purpose |
|------|---------|
| `packages/cli/src/index.ts` | Main CLI - output line 451 needs dry-run prefix |
| `packages/engine/src/index.ts` | `ConversionResult` type needs `deletedSources` |
| `packages/models/src/plugin.ts` | `WrittenFile.sourceItems` for source tracking |
| `packages/models/src/warnings.ts` | `WarningCode.Skipped` for skip detection |

## Technical Decisions

1. **Source collection:** Use `WrittenFile.sourceItems[].sourcePath` from successful conversions
2. **Skip detection:** Use `Warning.sources` where `code === 'skipped'`
3. **Conservative deletion:** If ANY part of source skipped, preserve entire file
4. **Type extension:** Add `deletedSources` to `ConversionResult` in engine

## Implementation Approach

Following TDD:
1. Stub tests first
2. Implement tests (verify they fail)
3. Implement code (verify tests pass)
4. Full verification

## Branch

Current branch: `phase-5` (will create `phase-6` branch for this work)

## Blockers

None

## Next Steps

1. Create `phase-6` branch from `main`
2. Stub test cases in `cli.test.ts`
3. Implement tests
4. Implement features following task order
5. Final verification and changeset
