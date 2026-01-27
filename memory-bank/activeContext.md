# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Phase 5 Bug Fixes - Complete** — All bugs fixed, reflection complete.

## Session State

- Phase 5 core implementation: ✅ Complete (Tasks 1-9)
- Phase 5 reflection: ✅ Created `memory-bank/reflection/reflection-PHASE5-GITIGNORE.md`
- Bug fix task Round 1: ✅ Complete (B1-B4, E1)
- Bug fix reflection: ✅ Created `memory-bank/reflection/reflection-PHASE5-BUGFIXES.md`
- Bug fix task Round 2: ✅ Complete (B5-B7)
- Bug fix task Round 3: ✅ Complete (B8)

## Bug Summary

### Round 1 (Complete)

| Item | Severity | Status |
|------|----------|--------|
| B1 | Medium | ✅ Fixed - Dry-run now shows planned git changes |
| B2 | High | ✅ Fixed - Glob patterns work correctly |
| B3 | High | ✅ Fixed - Paths converted to relative |
| B4 | Medium | ✅ Fixed - Empty globs validated and skipped |
| E1 | Low | ✅ Fixed - FileRule files now use `.md` |

### Round 2 (Complete)

| Item | Severity | Status |
|------|----------|--------|
| B5 | Medium | ✅ Fixed - Empty globs fall through to AgentSkill |
| B6 | Low | ✅ Fixed - Match mode shows per-file details |
| B7 | High | ✅ Fixed - Match mode routes to correct gitignore destination |

### Round 3 (Complete)

| Item | Severity | Status |
|------|----------|--------|
| B8 | High | ✅ Fixed - Semaphore section now accumulates entries |

## Recent Decisions

| Decision | Context |
|----------|---------|
| Fix at source | B5: Fix classification in Cursor discover, not just emit |
| Check parsed globs | B5: Only classify as FileRule if parseGlobs() returns non-empty array |
| Match mode details | B6: Only show per-file details for match mode (other modes are simple) |

## Key Insights from Investigation

1. **Bug 5 Root Cause**: `if (frontmatter.globs)` is truthy even for empty/whitespace strings. The fix must check `parseGlobs().length > 0` before classifying as FileRule.

2. **Bug 6 Root Cause**: Dry-run output only shows summary `Would update .gitignore (X entries)` but doesn't show which specific files would be added.

3. **Classification Precedence** (from Cursor docs):
   - `alwaysApply: true` → GlobalPrompt
   - `globs` (non-empty) → FileRule
   - `description` → AgentSkill
   - None → manual rule (fallback GlobalPrompt)

## Completed Implementation

### Bug 5 (FileRule vs AgentSkill) ✅
1. Created fixture `cursor-empty-globs-with-description` with test case
2. Added 2 tests in `discover.test.ts` for empty globs + description
3. Fixed `classifyRule()` to check `globs.length > 0` before classifying as FileRule
4. All 37 Cursor plugin tests pass

### Bug 6 (Dry-run match details) ✅
1. Added test in `cli.test.ts` for match mode per-file output
2. Updated CLI to show per-file details: `  <filename> → <destination>`
3. All 56 CLI tests pass

## Completed Implementation

### Bug 7 (Match mode destination attribution) ✅

**Problem:** `isGitIgnored()` only returned boolean, not WHERE file was ignored from.

**Solution Implemented:**
1. Added `getIgnoreSource(root, filepath)` function to `git-ignore.ts`
   - Uses `git check-ignore --verbose <filepath>`
   - Parses output: `<source>:<linenum>:<pattern><TAB><pathname>`
   - Returns source file path (`.gitignore`, `.git/info/exclude`) or null
2. Updated match mode in `index.ts`:
   - Gets ignore source for each source file using `getIgnoreSource()`
   - Groups outputs by destination (`filesToGitignore`, `filesToExclude`)
   - Adds outputs to `.gitignore` OR `.git/info/exclude` accordingly
3. Dry-run output shows correct destination per file

**Tests Added:**
- 5 unit tests for `getIgnoreSource()` in `git-ignore.test.ts`
- 2 integration tests for match mode routing in `cli.test.ts`

## Completed This Session

### Bug 8 (Semaphore section accumulation) ✅

**Problem:** When running conversion multiple times, the semaphore section REPLACED content instead of MERGING. Previously added entries were lost.

**Root Cause:** `updateSemaphoreSection()` in `git-ignore.ts` replaced the entire semaphore section with new entries instead of merging with existing ones.

**Fix Implemented:**
1. Modified `updateSemaphoreSection()` to:
   - Extract existing entries from between semaphore markers
   - Merge with new entries using Set (union)
   - Deduplicate entries automatically via Set
   - Sort entries alphabetically for deterministic output
   - Write merged list back to semaphore section

**Tests Added:**
- `should accumulate entries across multiple runs` (addToGitIgnore)
- `should deduplicate entries when same entry is added multiple times`
- `should sort entries alphabetically for deterministic output`
- `should accumulate entries across multiple runs` (addToGitExclude)

**Verification:** All 289 tests pass across all 6 packages

## Context from Prior Phases

| Phase | Status | Key Artifact |
|-------|--------|--------------|
| Phase 1 | ✅ Complete | GlobalPrompt MVP |
| Phase 2 | ✅ Complete | FileRule + AgentSkill |
| Phase 3 | ✅ Complete | AgentIgnore + CLI polish |
| Phase 4 | ✅ Complete | AgentCommand (Cursor → Claude) |
| **Phase 5** | 🔧 Bug Fixes R2 | Git ignore output management |

## Branch

Current branch: `pahse-5` (note: typo in branch name)

## Blockers

None - clear path forward for both bugs.
