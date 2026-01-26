# Memory Bank: Active Context

## Current Focus

**Task ID**: PHASE4-AGENTCOMMAND  
**Phase**: Phase 4 Implementation  
**Status**: ✅ Implementation Complete

## Session State

Phase 4 implementation and reflection are complete. All AgentCommand functionality is implemented, tested, and documented.

### Reflection Summary
- Reflection document created at `memory-bank/reflection/reflection-PHASE4-IMPL.md`
- Key lessons: One-way conversions simplify implementation, explicit complex feature detection is better than lossy conversion
- Process improvements identified for future phases

### Planning Documents
- `planning/ROADMAP.md` - Phase 4 roadmap entry
- `memory-bank/tasks.md` - Detailed implementation plan with code snippets

### Scope Summary

**AgentCommand Support (Cursor → Claude only)**:

| Direction | From | To | Status |
|-----------|------|-----|--------|
| Cursor → Claude | `.cursor/commands/*.md` | `.claude/skills/*/SKILL.md` | ✅ Supported |
| Claude → Cursor | (none) | (none) | ❌ Unsupported |

**Key Constraint**: Claude has no dedicated command concept. Skills serve double duty (auto-triggered AND slash-invocable). Claude plugin will never discover AgentCommand entries.

### Simple vs Complex Commands

| Type | Features | Behavior |
|------|----------|----------|
| Simple | Plain markdown prompt | Converted to Claude skill |
| Complex | `$ARGUMENTS`, `$1`-`$9`, `!` (bash), `@refs`, `allowed-tools` | Skipped with warning |

### Command Classification Reference

| Feature | Detection Pattern | Example |
|---------|-------------------|---------|
| Arguments | `$ARGUMENTS` | `Fix issue #$ARGUMENTS` |
| Positional | `$1`, `$2`, etc. | `Review PR #$1` |
| Bash | ``!`command` `` | ``!`git branch` `` |
| File refs | `@path` | `Analyze @src/utils.js` |
| allowed-tools | Frontmatter key | `allowed-tools: Bash(*)` |

## Implementation Tracks

### Track A: Models Package (Task 2)
- Add `AgentCommand` to `CustomizationType` enum
- Add `AgentCommand` interface with `commandName` field
- Add `isAgentCommand()` type guard

### Track B: Cursor Plugin (Tasks 3, 4)
- Discover `.cursor/commands/**/*.md` files
- Classify as simple (convert) vs complex (skip)
- Emit AgentCommand as `.cursor/commands/*.md` (pass-through)

### Track C: Claude Plugin (Tasks 5, 6)
- Emit AgentCommand as `.claude/skills/*/SKILL.md`
- Confirm no AgentCommand discovery (test)

### Prerequisites (Task 1)
- Create test fixtures for all scenarios

### Finalization (Tasks 7, 8)
- Integration tests
- Documentation updates

## Files to Modify

### Models Package
- `packages/models/src/types.ts` - Add AgentCommand type
- `packages/models/src/helpers.ts` - Add isAgentCommand()
- `packages/models/src/index.ts` - Export new items

### Cursor Plugin
- `packages/plugin-cursor/src/discover.ts` - Add command discovery
- `packages/plugin-cursor/src/emit.ts` - Add command emission

### Claude Plugin
- `packages/plugin-claude/src/emit.ts` - Emit commands as skills

### Test Fixtures (New)
- `packages/plugin-cursor/test/fixtures/cursor-command-*`
- `packages/cli/test/integration/fixtures/cursor-command-to-claude`

## Estimated Effort

| Track | Tasks | Estimate |
|-------|-------|----------|
| Fixtures | Task 1 | 30 min |
| Models | Task 2 | 30 min |
| Cursor Plugin | Tasks 3, 4 | 2-3 hours |
| Claude Plugin | Tasks 5, 6 | 1-2 hours |
| Integration | Task 7 | 1-2 hours |
| Documentation | Task 8 | 30 min |
| **Total** | | **5-8 hours** |

## Next Command

Run `/build` to begin implementation starting with Task 1 (test fixtures).

## Reference Documents

| Document | Purpose |
|----------|---------|
| `planning/ROADMAP.md` | Phase 4 specification |
| `planning/TECH_BRIEF.md` | AgentCommand architecture notes |
| `memory-bank/tasks.md` | Detailed implementation plan |
| `memory-bank/techContext.md` | Technical context |
