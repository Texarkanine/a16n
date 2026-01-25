# Memory Bank: Tasks

## Current Task

| Field | Value |
|-------|-------|
| **Task ID** | PHASE3-PLANNING |
| **Phase** | Phase 3 Preparation |
| **Complexity** | Level 3 (Intermediate) |
| **Status** | ✅ Complete |

---

## Task Overview

**Objective**: Create comprehensive Phase 3 planning documents for AgentIgnore + Polish features.

**Deliverables**:
1. ✅ `planning/PHASE_3_SPEC.md` - Complete specification following Phase 1 template

---

## Research Completed

### AgentIgnore Platform Support

| Platform | File | Format | Status |
|----------|------|--------|--------|
| **Cursor** | `.cursorignore` | gitignore-style | Full support |
| **Claude Code** | `.claude/settings.json` | `permissions.deny` Read rules | Full support |

### Key Findings

1. **Cursor .cursorignore**:
   - Uses gitignore-style glob patterns
   - Explicit exclusion signal (NOT Cursor's implicit gitignore behavior)
   - Blocks: semantic search, code context, @ mentions
   - Cannot block: Terminal/MCP tools

2. **Claude Code**:
   - Uses `permissions.deny` with `Read()` patterns in `.claude/settings.json`
   - Functionally equivalent to `.cursorignore`
   - Patterns are translatable bidirectionally
   - Decision: **Full bidirectional support**

### Pattern Translation

| `.cursorignore` | Claude `permissions.deny` |
|-----------------|---------------------------|
| `.env` | `Read(./.env)` |
| `dist/` | `Read(./dist/**)` |
| `*.log` | `Read(./**/*.log)` |
| `secrets/` | `Read(./secrets/**)` |

---

## Phase 3 Scope Summary

### In Scope
- **AgentIgnore bidirectional conversion**:
  - Cursor: `.cursorignore` discovery and emission
  - Claude: `permissions.deny` Read rules discovery and emission
- `--verbose` flag for CLI
- Warning message improvements (colors, icons, hints)
- Error message improvements

### Out of Scope
- Config file support
- Watch mode
- Plugin auto-discovery
- Other platforms (Android Studio `.aiexclude`, etc.)

---

## Implementation Tasks (for future implementor)

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Cursor Discover AgentIgnore | 1-2 hours | Test fixtures |
| Cursor Emit AgentIgnore | 1 hour | — |
| Claude Emit AgentIgnore | 1-2 hours | Test fixtures |
| Claude Discover AgentIgnore | 1-2 hours | — |
| CLI --verbose Flag | 1-2 hours | — |
| Warning Improvements | 1-2 hours | — |
| Error Improvements | 1 hour | — |
| Test Fixtures | 1 hour | First |
| Integration Tests | 2-3 hours | All above |
| Documentation | 1 hour | Task 8 |

**Total Estimate**: 12-18 hours

---

## Acceptance Criteria

See `planning/PHASE_3_SPEC.md` for full acceptance criteria (AC1-AC10).

Key criteria:
- AC1: Cursor discovers `.cursorignore`
- AC3: Claude skips AgentIgnore with helpful warning
- AC4: `--verbose` shows detailed output
- AC6: Improved warning formatting

---

## Definition of Done

Phase 3 Planning is complete when:

- [x] Research completed on platform support
- [x] PHASE_3_SPEC.md created with full specification
- [x] Acceptance criteria defined (10 total)
- [x] Implementation tasks defined with estimates
- [x] Task dependencies documented
- [x] Memory bank updated

---

## Next Steps

1. **For implementor**: Start with Task 7 (Test Fixtures) to enable TDD
2. **Parallel work**: Tasks 1-6 can be developed in parallel
3. **Final validation**: Task 8 (Integration Tests) validates all features
4. **PR**: Create PR for Phase 3 implementation
