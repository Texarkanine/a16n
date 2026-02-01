# Memory Bank: Tasks

## Current Task: CodeRabbit PR #27 Fixes

**Status:** COMPLETE
**PR URL:** https://github.com/Texarkanine/a16n/pull/27
**Rate Limit Until:**
**Last Updated:** 2026-02-01T19:40:00Z

### Actionable Items (Round 1 - commit 254957a)

- [x] ID: tasks-dod - Update Definition of Done checklist to match completion status - FIXED
- [x] ID: cli-paths - Normalize stdout paths for OS-agnostic assertions (packages/cli/test/cli.test.ts:103, 288-295) - FIXED
- [x] ID: discover-regex - Update frontmatter key regex to accept hyphens (packages/plugin-claude/src/discover.ts:178) - FIXED
- [x] ID: discover-hooks - Skip skills with hooks instead of silently dropping (packages/plugin-claude/src/discover.ts:542-573) - FIXED
- [x] ID: backup-file - Remove or fix discover.ts.backup file (packages/plugin-claude/src/discover.ts.backup) - FIXED
- [x] ID: emit-filenames - Fix usedFilenames scope in emitAgentSkillIO (packages/plugin-cursor/src/emit.ts:246) - FIXED

### Actionable Items (Round 2)

- [x] ID: emit-collision-param - Pass collisionSources parameter to emitAgentSkillIO (packages/plugin-cursor/src/emit.ts:650) - FIXED
- [x] ID: cli-test-comment - Fix contradictory test name/comments about "skips" vs "silently ignored" (packages/cli/test/cli.test.ts:521-542) - FIXED

### Actionable Items (Round 3)

- [x] ID: emit-collision-order - Move collision warning emission after AgentSkillIO loop (packages/plugin-cursor/src/emit.ts:556-563) - FIXED

### Actionable Items (Round 4)

- [x] ID: emit-collision-simple - Track collision from getUniqueFilename in simple AgentSkillIO rule emission (packages/plugin-cursor/src/emit.ts:251) - FIXED

### Requires Human Decision

None

### Ignored

- ID: precheck-sh - Test fixture file doesn't need reviewing (Texarkanine confirmed: "this is a test fixture and not a real skill/hook")
- ID: types-test-hooks - Test already removed by Texarkanine per his comment about removing the test
- ID: discover-test-warningcode - Already has WarningCode.Skipped assertions (lines 117, 128)

---

## Phase 8 Status (Reference)

**Part A (Claude Native Rules Support)**: ✅ COMPLETE
**Part B (Full AgentSkills.io Support)**: ✅ COMPLETE

---

## Part A Summary (Complete)

All four milestones successfully implemented on 2026-01-31 and 2026-02-01.

| Milestone | Description | Status | Reflection |
|-----------|-------------|--------|------------|
| A1 | Claude Rules Discovery | ✅ Complete | `reflection-phase8-milestone-a1.md` |
| A2 | Claude Rules Emission | ✅ Complete | `reflection-phase8-milestone-a2-a3.md` |
| A3 | Remove glob-hook | ✅ Complete | `reflection-phase8-milestone-a2-a3.md` |
| A4 | Documentation Cleanup | ✅ Complete | `reflection-phase8-milestone-a4.md` |

---

## Definition of Done

Phase 8 is complete when:

- [x] All acceptance criteria pass (AC-B1 through AC-B4, AC-7)
- [x] `pnpm build` succeeds
- [x] `pnpm test` passes (all packages)
- [x] `pnpm lint` passes
- [x] `AgentSkill` renamed to `SimpleAgentSkill` with backward compat
- [x] `AgentSkillIO` type defined and implemented
- [x] Full skill directories discovered with resources
- [x] Smart emission routing based on skill complexity
- [x] Round-trip tests pass for all scenarios
- [x] No TODO comments in shipped code
