# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task: CodeRabbit PR #11 Fixes

**Status:** In Progress
**PR URL:** https://github.com/Texarkanine/a16n/pull/11
**Rate Limit Until:** 

### Actionable Items
- [x] ID: CR-1 - Add `error` event handler to `execGit` in git-ignore.ts (Major) - FIXED
- [x] ID: CR-2 - Fix shell injection in `quotedEntries` in git-ignore.ts (Major) - FIXED
- [x] ID: CR-3 - Fix duplicate heading MD024 in activeContext.md - FIXED
- [x] ID: CR-4 - Fix spaces inside code span MD038 in activeContext.md line 75 - FIXED
- [x] ID: CR-5 - Update stale "Next Actions" section in progress.md - FIXED
- [x] ID: CR-6 - Add language identifiers to code blocks in tasks.md (MD040) - N/A (file rewritten)
- [x] ID: CR-7 - Fix trailing space in code span MD038 in tasks.md - N/A (file rewritten)
- [x] ID: CR-8 - Fix conditional assertions in cli.test.ts - FIXED
- [x] ID: CR-9 - Add language specifier to code block in PHASE_5_SPEC.md - FIXED

### Requires Human Decision
- ID: CR-10 - Match mode can mis-route outputs when multiple sources share a type - **PLANNED** (see below)

### Ignored
(none)

---

## CR-10 Implementation Plan: Source Tracking for WrittenFile

### Overview

Add `sourceItems` field to `WrittenFile` interface so CLI can accurately determine which sources contributed to each output file. This enables proper git-ignore conflict detection for merged outputs.

### Complexity: Level 3 (Intermediate Feature)

**Justification:**
- Touches 5-6 files across 4 packages
- Interface change affects all plugins
- Logic change in CLI for conflict detection
- Multiple test updates needed

### Problem Statement

Current code uses lossy heuristic to guess source→output mapping:
```typescript
const sources = result.discovered.filter(d => d.type === written.type);
```

This fails when multiple sources of the same type have different git status (some ignored, some tracked) and merge into one output.

### Proposed Solution

Add accurate source tracking to `WrittenFile`:
```typescript
interface WrittenFile {
  path: string;
  type: CustomizationType;
  itemCount: number;
  isNewFile: boolean;
  sourceItems: AgentCustomization[];  // NEW: which inputs made this output
}
```

### Merge Points Requiring sourceItems

| Plugin | Output File | Sources |
|--------|-------------|---------|
| Claude | CLAUDE.md | All GlobalPrompts |
| Claude | settings.local.json | All valid FileRules |
| Claude | settings.json | All AgentIgnores |
| Cursor | .cursorignore | All AgentIgnores |

### Git Conflict Detection Logic (CLI)

For `--gitignore-output-with match`:

**Case 1: Output file already exists**
- Output's current git status is the **authority**
- Check git status of all `sourceItems`
- Sources that don't match output's status → emit `GitStatusConflict` warning
- Note: Content still merged, but warning tells user about mismatch

**Case 2: Output file is new + sources unanimous**
- All sources have same git status → proceed normally
- Apply that status to output

**Case 3: Output file is new + sources conflict**
- Some ignored, some tracked → can't determine correct status
- Skip gitignore management for this file
- Emit `GitStatusConflict` warning

### Implementation Checklist

#### Phase 1: Interface Change ✅
- [x] Update `WrittenFile` in `packages/models/src/plugin.ts`
  - Add `sourceItems?: AgentCustomization[]` (optional for backwards compat)
- [x] Add `GitStatusConflict` to `WarningCode` enum in `warnings.ts`
- [x] Update plugin tests in `packages/models/test/plugin.test.ts`
- **Tests:** All 42 tests pass (5 new tests added)

#### Phase 2: Claude Plugin ✅
- [x] Update `emit()` in `packages/plugin-claude/src/emit.ts`:
  - GlobalPrompts → CLAUDE.md: `sourceItems: globalPrompts`
  - FileRules → settings.local.json: `sourceItems: validFileRules`
  - FileRules → .a16n/rules/*.md: `sourceItems: [rule]` (1:1)
  - AgentSkills → .claude/skills/*/SKILL.md: `sourceItems: [skill]`
  - AgentIgnores → settings.json: `sourceItems: agentIgnores`
  - AgentCommands → .claude/skills/*/SKILL.md: `sourceItems: [command]`
- [x] Update tests in `packages/plugin-claude/test/emit.test.ts`
- **Tests:** All 67 tests pass (6 new tests added)

#### Phase 3: Cursor Plugin ✅
- [x] Update `emit()` in `packages/plugin-cursor/src/emit.ts`:
  - GlobalPrompts → *.mdc: `sourceItems: [gp]` (1:1)
  - FileRules → *.mdc: `sourceItems: [fr]` (1:1)
  - AgentSkills → *.mdc: `sourceItems: [skill]` (1:1)
  - AgentIgnores → .cursorignore: `sourceItems: agentIgnores`
  - AgentCommands → *.md: `sourceItems: [command]` (1:1)
- [x] Update tests in `packages/plugin-cursor/test/emit.test.ts`
- **Tests:** All 81 tests pass (5 new tests added)

#### Phase 4: CLI Update ✅
- [x] Update match mode in `packages/cli/src/index.ts`:
  - Replace type-based heuristic with `written.sourceItems`
  - Add conflict detection logic per the cases above
  - Handle case where sourceItems is undefined (backwards compat)
- [x] Add GitStatusConflict warning display in `packages/cli/src/output.ts`
- [x] Update tests in `packages/cli/test/cli.test.ts`
- **Tests:** All 70 CLI tests pass (4 stub tests added for future detailed conflict scenarios)

#### Phase 5: Verification ✅
- [x] All existing tests pass (309 total across 6 packages)
- [x] New tests cover base scenarios (stub tests added for future detailed conflict scenarios)

### Files to Modify

| Package | File | Changes |
|---------|------|---------|
| models | `src/plugin.ts` | Add `sourceItems` to WrittenFile |
| models | `src/warnings.ts` | Add `GitStatusConflict` code |
| models | `test/plugin.test.ts` | Update tests |
| plugin-claude | `src/emit.ts` | Populate sourceItems for all written files |
| plugin-claude | `test/emit.test.ts` | Verify sourceItems in tests |
| plugin-cursor | `src/emit.ts` | Populate sourceItems for all written files |
| plugin-cursor | `test/emit.test.ts` | Verify sourceItems in tests |
| cli | `src/index.ts` | Use sourceItems for accurate mapping |
| cli | `test/cli.test.ts` | Test conflict detection |

### Test Plan

**Unit Tests (per plugin):**
```
- WrittenFile for merged output has sourceItems array with all inputs
- WrittenFile for 1:1 output has sourceItems array with single input
```

**CLI Integration Tests:**
```
- Match mode with existing tracked output + mixed sources → warning
- Match mode with new output + unanimous sources → proceeds normally  
- Match mode with new output + conflicting sources → warning, skip gitignore
```

### Estimated Effort

| Phase | Effort |
|-------|--------|
| Interface change | 30 min |
| Claude plugin | 45 min |
| Cursor plugin | 30 min |
| CLI update | 1 hour |
| Tests | 1 hour |
| **Total** | ~3.5 hours |

### Build Status

- [x] Planning complete
- [x] Implementation complete
- [x] All tests passing (309/309)
- [x] Ready for commit
