# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Phase 5 Bug Fixes - Round 2** — Bug 7 in progress (match mode destination attribution).

## Session State

- Phase 5 core implementation: ✅ Complete (Tasks 1-9)
- Phase 5 reflection: ✅ Created `memory-bank/reflection/reflection-PHASE5-GITIGNORE.md`
- Bug fix task Round 1: ✅ Complete (Level 2)
- Bug fix reflection: ✅ Created `memory-bank/reflection/reflection-PHASE5-BUGFIXES.md`
- Bug fix task Round 2: 🔨 In Progress (Bug 7)

## Bug Summary

### Round 1 (Complete)

| Item | Severity | Status |
|------|----------|--------|
| B1 | Medium | ✅ Fixed - Dry-run now shows planned git changes |
| B2 | High | ✅ Fixed - Glob patterns work correctly |
| B3 | High | ✅ Fixed - Paths converted to relative |
| B4 | Medium | ✅ Fixed - Empty globs validated and skipped |
| E1 | Low | ✅ Fixed - FileRule files now use `.md` |

### Round 2 (In Progress)

| Item | Severity | Status |
|------|----------|--------|
| B5 | Medium | ✅ Fixed - Empty globs fall through to AgentSkill |
| B6 | Low | ✅ Fixed - Match mode shows per-file details |
| B7 | High | 🔨 Match mode routes to wrong gitignore destination |

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

## In Progress

### Bug 7 (Match mode destination attribution)

**Problem:** `isGitIgnored()` only returns boolean, not WHERE file is ignored from.

**Implementation Plan:**
1. Add `getIgnoreSource(root, filepath)` function to `git-ignore.ts`
   - Uses `git check-ignore --verbose <filepath>`
   - Parses output: `<source>:<linenum>:<pattern><TAB><pathname>`
   - Returns source file path (e.g., `.gitignore`, `.git/info/exclude`) or null
2. Update match mode in `index.ts`:
   - Get ignore source for each source file
   - Group outputs by destination
   - Add outputs to `.gitignore` OR `.git/info/exclude` accordingly
3. Update dry-run output to show correct destination

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
