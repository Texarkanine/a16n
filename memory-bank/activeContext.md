# Memory Bank: Active Context

## Current Focus

**Task ID**: PHASE3-IMPL  
**Phase**: Phase 3 Implementation  
**Status**: 🔄 Planning Complete - Ready for Build

## Session State

Phase 3 implementation plan has been created. The plan covers bidirectional AgentIgnore conversion and CLI polish features.

### Planning Documents
- `planning/PHASE_3_SPEC.md` - Complete specification
- `memory-bank/tasks.md` - Detailed implementation plan with code snippets

### Scope Summary

**AgentIgnore Bidirectional Support**:

| Direction | From | To |
|-----------|------|-----|
| Cursor → Claude | `.cursorignore` | `permissions.deny` Read rules |
| Claude → Cursor | `permissions.deny` Read rules | `.cursorignore` |

**CLI Polish**:
- `--verbose` flag for debugging output
- Colored warnings with icons and hints (using chalk)
- Improved error messages with suggestions

### Pattern Translation Reference

| `.cursorignore` | Claude `permissions.deny` |
|-----------------|---------------------------|
| `.env` | `Read(./.env)` |
| `dist/` | `Read(./dist/**)` |
| `*.log` | `Read(./**/*.log)` |
| `**/*.tmp` | `Read(./**/*.tmp)` |
| `secrets/` | `Read(./secrets/**)` |

## Implementation Tracks

### Track A: Cursor Plugin (Tasks 1, 2)
- Discover `.cursorignore` files
- Emit `.cursorignore` from AgentIgnore items

### Track B: Claude Plugin (Tasks 3, 3b)
- Emit `permissions.deny` from AgentIgnore items
- Discover `permissions.deny` Read rules as AgentIgnore

### Track C: CLI Polish (Tasks 4, 5, 6)
- Add `--verbose` flag
- Improve warning formatting
- Improve error messages

### Prerequisites (Task 7)
- Create test fixtures for all scenarios

### Finalization (Tasks 8, 9)
- Integration tests
- Documentation updates

## Files to Modify

### Models Package
- No changes needed (all types and helpers already exist)

### Cursor Plugin
- `packages/plugin-cursor/src/discover.ts` - Add `discoverCursorIgnore()`
- `packages/plugin-cursor/src/emit.ts` - Handle AgentIgnore items

### Claude Plugin
- `packages/plugin-claude/src/discover.ts` - Add `discoverAgentIgnore()`
- `packages/plugin-claude/src/emit.ts` - Handle AgentIgnore → permissions.deny

### CLI
- `packages/cli/src/index.ts` - Add `--verbose`, improve errors
- `packages/cli/src/output.ts` - New file for formatted output
- `packages/cli/package.json` - Add chalk dependency

## Estimated Effort

| Track | Tasks | Estimate |
|-------|-------|----------|
| Fixtures | Task 7 | 1 hour |
| Cursor Plugin | Tasks 1, 2 | 2-3 hours |
| Claude Plugin | Tasks 3, 3b | 2-4 hours |
| CLI Polish | Tasks 4, 5, 6 | 3-5 hours |
| Integration | Task 8 | 2-3 hours |
| Documentation | Task 9 | 1 hour |
| **Total** | | **12-18 hours** |

## Next Command

Run `/niko/build` to begin implementation starting with Task 7 (test fixtures).

## Reference Documents

| Document | Purpose |
|----------|---------|
| `planning/PHASE_3_SPEC.md` | Full specification |
| `memory-bank/tasks.md` | Detailed implementation plan |
| `memory-bank/archive/features/` | Past implementation patterns |
