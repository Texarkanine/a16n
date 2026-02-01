# Memory Bank: Active Context

## Current Session Focus

**Task**: Phase 8 Milestones A2 & A3 - Claude Rules Emission + Remove glob-hook
**Mode**: Planning (PLAN)
**Started**: 2026-01-31

## What We're Planning

Creating implementation plan for native Claude rules emission and removal of glob-hook workaround. This completes the native rules support started in A1 (discovery).

## Key Context

### Background
- **A1 Complete**: Discovery of `.claude/rules/*.md` with paths frontmatter ✅
- **A2 Goal**: Emit GlobalPrompt/FileRule as native `.claude/rules/*.md` files
- **A3 Goal**: Remove all glob-hook integration code

### Breaking Change
**CRITICAL**: GlobalPrompts will NO LONGER merge into single CLAUDE.md. Each GlobalPrompt becomes a separate `.claude/rules/<name>.md` file. This is intentional - provides better granularity and aligns with Claude's native structure.

### Technical Scope

**A2 Changes (Emission)**:
1. Add `formatGlobalPromptAsClaudeRule()` - No frontmatter, plain markdown
2. Add `formatFileRuleAsClaudeRule()` - With `paths:` YAML frontmatter
3. Rewrite GlobalPrompt emission section (~50 lines)
4. Rewrite FileRule emission section (~80 lines)
5. Update ~27 tests, add ~8 new tests

**A3 Changes (Cleanup)**:
1. Remove `buildHookConfig()` function
2. Remove `escapeShellArg()` function
3. Remove .a16n/rules/ directory creation
4. Remove settings.local.json hook writing
5. Remove ~6 glob-hook related tests
6. Remove approximation warnings

## Planning Decisions

### Test Strategy
- **Update, don't rewrite**: Modify existing tests to expect new behavior
- **Remove obsolete**: Delete glob-hook tests entirely
- **Add integration**: Round-trip tests (discover → emit → discover)
- **Manual verify**: Real-world conversion test

### Implementation Strategy
- **TDD still applies**: Update tests first, then implement
- **Incremental**: Do A2 first (emission), then A3 (cleanup)
- **Reuse patterns**: Follow A1's filename sanitization approach
- **Track breaking changes**: Document for changelog

### Code Organization
- **New functions**: Clean separation (format vs emit logic)
- **Reuse utilities**: `getUniqueFilename()`, `sanitizeFilename()`
- **Remove legacy**: Complete removal of glob-hook code

## Complexity Assessment

**Level 3** (Intermediate) - Similar to A1
- Well-defined scope
- Breaking changes but intentional
- Extensive test updates required
- No architectural changes

## Estimated Effort

**Total**: 4-6 hours for both milestones combined
- A2 (Emission): 3-4 hours
- A3 (Cleanup): 1-2 hours

## Files in Focus

- `packages/plugin-claude/src/emit.ts` - Major refactor
- `packages/plugin-claude/test/emit.test.ts` - Extensive test updates

## Immediate Next Steps

1. Read existing emit tests to understand patterns
2. Create TDD plan for A2 (emission)
3. Create TDD plan for A3 (cleanup)
4. Begin implementation when ready

## Blockers

None currently. Planning phase active.
