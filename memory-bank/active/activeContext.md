# Active Context

## Current Task: issue-148-cursor-skill-paths-refuse
**Phase:** BUILD - COMPLETE

## What Was Done
- Discover-time refuse for Cursor skill `paths:` in `packages/plugin-cursor/src/discover.ts` (`hasPaths` / `'paths' in data`, `WarningCode.Skipped`, no IR item).
- Unit tests in `discover-skills.test.ts`; CLI integration fixture `cursor-skill-paths-refuse-to-claude`.
- Docs: `packages/plugin-cursor/README.md`, `memory-bank/systemPatterns.md`.
- Full `pnpm test` green (incl. plugin-cursor 187, cli 229).

## Files Modified
- `/home/mobaxterm/.cursor/worktrees/issue-148-3df05aa6/a16n-61fe09b04bb4/packages/plugin-cursor/src/discover.ts`
- `/home/mobaxterm/.cursor/worktrees/issue-148-3df05aa6/a16n-61fe09b04bb4/packages/plugin-cursor/test/discover-skills.test.ts`
- `/home/mobaxterm/.cursor/worktrees/issue-148-3df05aa6/a16n-61fe09b04bb4/packages/plugin-cursor/README.md`
- `/home/mobaxterm/.cursor/worktrees/issue-148-3df05aa6/a16n-61fe09b04bb4/packages/cli/test/integration/integration-filerule-skill.test.ts`
- `/home/mobaxterm/.cursor/worktrees/issue-148-3df05aa6/a16n-61fe09b04bb4/packages/cli/test/integration/fixtures/cursor-skill-paths-refuse-to-claude/from-cursor/.cursor/skills/scoped/SKILL.md`
- `/home/mobaxterm/.cursor/worktrees/issue-148-3df05aa6/a16n-61fe09b04bb4/memory-bank/systemPatterns.md`
- memory-bank active files

## Decisions
- No IR modeling of `paths:`; refuse matches Claude `hooks:` pattern.
- Warning names Cursor non-portable scoping / widened scope.

## Deviations
- None — built to plan.

## Next Step
- QA phase
