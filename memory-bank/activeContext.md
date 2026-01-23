# Memory Bank: Active Context

## Current Focus

**Bug Fix**: Cursor plugin recursive discovery - rules in subdirectories not found

## Current Mode

BUILD (Implementation)

## Session Context

- **Date**: 2026-01-21
- **Platform**: Linux (WSL2)
- **Shell**: Bash
- **Task**: CURSOR-RECURSIVE-DISCOVERY
- **Complexity**: Level 2

## Active Decisions

1. **TDD Mandatory**: Write test first, then implement fix
2. **Scope Limited**: Only root `.cursor/rules/**/*.mdc` for now
3. **Future Enhancement**: Nested `.cursor/rules/` dirs in subdirectories (TBD)

## Problem Statement

Running `a16n discover --from cursor .` on this repo returns 0 items, but we have rules in:
- `.cursor/rules/shared/always-tdd.mdc` (alwaysApply: true)
- `.cursor/rules/shared/niko-core.mdc` (alwaysApply: true)
- etc.

Current code only looks at `.cursor/rules/*.mdc` (flat), not subdirectories.

## Next Steps

1. Create test fixture with nested subdirs
2. Write failing test for recursive discovery
3. Implement recursive `findMdcFiles`
4. Verify fix works on this repo
5. Commit
