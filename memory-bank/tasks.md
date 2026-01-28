# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task: CodeRabbit PR #11 Fixes

**Status:** In Progress
**PR URL:** https://github.com/Texarkanine/a16n/pull/11
**Rate Limit Until:** 

### Actionable Items

#### Code Issues (Major)
- [ ] ID: CR11-1 - Missing `error` event handler in `execGit` could cause promise to never resolve (`packages/cli/src/git-ignore.ts` lines 29-54)
- [ ] ID: CR11-2 - `commit` resolution performs file modifications even in dry-run mode (`packages/cli/src/index.ts` lines 354-380)
- [ ] ID: CR11-3 - Missing ignore source consistency check - multiple sources may have different ignore destinations (`packages/cli/src/index.ts` lines 205-214)

#### Code Issues (Minor)
- [ ] ID: CR11-4 - Remove `as any` casts and use proper WarningCode enum values (`packages/cli/src/index.ts` lines 166, 195, 202, 229)
- [ ] ID: CR11-5 - Use path-aware matching for `.a16n/rules` detection on Windows (`packages/plugin-claude/test/emit.test.ts` line 1324)

#### Documentation Issues (Minor)
- [ ] ID: CR11-6 - Duplicate heading "## Completed Implementation" triggers MD024 (`memory-bank/activeContext.md`)
- [ ] ID: CR11-7 - Missing language identifiers on fenced code blocks - MD040 (`memory-bank/tasks.md` lines 30, 71-80, 110-135, 141-154, 342-379, 386-417)
- [ ] ID: CR11-8 - Trim spaces inside inline code span - MD038 (`memory-bank/tasks.md` line 215)

### Already Fixed
- [x] ID: CR11-A1 - Remove leading spaces inside code span MD038 (`memory-bank/activeContext.md` line 75) - FIXED in 2b37e6c
- [x] ID: CR11-A2 - Inconsistent "Next Actions" section is stale (`memory-bank/progress.md`) - FIXED in 2b37e6c

### Requires Human Decision
(none)

### Ignored
(none)

---

## Previous Task: Phase 5 Enhancement - `--if-gitignore-conflict` Flag

**Status:** Implementation & Reflection Complete
**Branch:** phase-5

See `memory-bank/archive/` for archived details.
