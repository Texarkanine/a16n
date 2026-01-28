# Memory Bank: Progress

<!-- This file tracks implementation progress, completed steps, and current status. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Overall Project Status

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 1** | ✅ Complete | PR #1 merged (GlobalPrompt MVP) |
| **Phase 2** | ✅ Complete | PR #3 merged (FileRule + AgentSkill) |
| **Phase 3** | ✅ Complete | PR #4 merged (AgentIgnore + CLI polish) |
| **Phase 4** | ✅ Complete | PR #8 merged (AgentCommand, Cursor → Claude) |
| **Phase 5** | ✅ Complete | Git ignore output management + conflict flag |
| **Phase 6** | ✅ Complete | CLI Polish (dry-run wording + --delete-source) |

## Current Session

**Task ID:** PHASE-7-AGENTSKILLS
**Status:** REFLECT Complete - Ready for ARCHIVE

### Phase A: Foundation (Models Package)
| Task | Status | Notes |
|------|--------|-------|
| Task 1: Rename AgentCommand → ManualPrompt | ✅ Complete | Types, helpers, exports updated with backward compat |

### Phase B-E: Plugin Updates
| Task | Status | Notes |
|------|--------|-------|
| Task 2: Classification Change | ✅ Complete | No criteria → ManualPrompt |
| Task 3: Cursor Skills Discovery | ✅ Complete | `.cursor/skills/` discovery implemented |
| Task 4: Cursor Skills Emission | ✅ Complete | AgentSkill/ManualPrompt → `.cursor/skills/` |
| Task 5: Claude ManualPrompt Discovery | ✅ Complete | `disable-model-invocation: true` detection |
| Task 6: Claude ManualPrompt Emission | ✅ Complete | ManualPrompt emits with disable flag |
| Task 7: Update All References | ✅ Complete | All packages updated to use ManualPrompt |

### Build Progress
- ✅ All 370 tests passing
- ✅ Build successful across all 6 packages

### Completed Changes
1. **ManualPrompt Type** - New type with `promptName` field, backward compat aliases
2. **Type Guards** - `isManualPrompt()` added, `isAgentCommand()` deprecated wrapper
3. **Classification Change** - Rules without activation criteria → ManualPrompt (not GlobalPrompt)
4. **All Package Updates** - plugin-cursor, plugin-claude, engine, cli tests updated
5. **Cursor Skills Discovery** - Discover `.cursor/skills/*/SKILL.md` → AgentSkill (with description) or ManualPrompt (with disable-model-invocation)
6. **Cursor Skills Emission** - AgentSkill and ManualPrompt now emit to `.cursor/skills/*/SKILL.md`
7. **Claude ManualPrompt Discovery** - Skills with `disable-model-invocation: true` → ManualPrompt
8. **Claude ManualPrompt Emission** - ManualPrompt emits with `disable-model-invocation: true`
