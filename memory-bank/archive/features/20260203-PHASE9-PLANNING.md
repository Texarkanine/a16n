# TASK ARCHIVE: Phase 9 - IR Serialization Plugin Planning

## METADATA
- **Task ID**: PHASE9-PLANNING
- **Date Completed**: 2026-02-03
- **Complexity Level**: 3 (Intermediate)
- **Type**: Feature Planning

## SUMMARY
Completed comprehensive planning and specification for Phase 9 - the IR Serialization Plugin (`@a16njs/plugin-a16n-ir`). This phase will enable persisting and reading the a16n intermediate representation to/from disk with versioned migration support.

## REQUIREMENTS
1. Define IR file format for disk persistence
2. Plan versioning strategy for IR schema evolution
3. Spec plugin implementation for discovery and emission
4. Document migration workflow
5. Update roadmap with Phase 9 and Phase 10

## DELIVERABLES

### Roadmap Updates
- Cleaned up ROADMAP.md - collapsed completed Phases 1-8 to summary table
- Added Phase 9 (IR Serialization Plugin) with full scope
- Added Phase 10 (MCP Configuration Support) outline
- Updated Gantt chart and version milestones

### Phase 9 Specification
Created `planning/PHASE_9_SPEC.md` with:
- IR file format: `.a16n/<IRType>/<Name>.md` with YAML frontmatter
- IR versioning: Kubernetes-style (`v1beta1`, `v1`, etc.)
- Plugin implementation: Discovery, emission, version checking
- 7 implementation milestones
- 16 acceptance criteria
- Estimated ~21 hours effort

## KEY DECISIONS

| Decision | Rationale |
|----------|-----------|
| Start at `v1beta1` | Standard for new APIs; signals instability |
| Markdown frontmatter format | Human-readable, git-friendly |
| Directory-per-type structure | Clear organization, easy to navigate |
| Migration via intermediate format | Simple, leverages existing functionality |
| Defer multi-plugin version support | Accept intermediate format migration for now |

## OPEN QUESTIONS (Deferred)
1. **Multi-plugin conversion**: How to enable `--from a16n@v1 --to a16n@v2`?
   - Current answer: Use intermediate format migration
2. **Non-markdown IR types**: MCPConfig might need JSON extension
   - Deferred to Phase 10

## IMPLEMENTATION ORDER (Ready)
```
M1: IR Model Versioning ← START HERE
 ↓
M2: Plugin Package Setup
 ↓
M3: Parsing & Formatting
 ↓
M4: IR Emission (--to a16n)
M5: IR Discovery (--from a16n)  [parallel]
 ↓
M6: CLI Integration
 ↓
M7: Integration & Docs
```

## FILES CREATED/MODIFIED
- `planning/ROADMAP.md` - Updated with cleanup + new phases
- `planning/PHASE_9_SPEC.md` - Created full specification
- `memory-bank/tasks.md` - Updated with Phase 9 breakdown
- `memory-bank/activeContext.md` - Updated current focus
- `memory-bank/progress.md` - Updated implementation status

## LESSONS LEARNED
- Kubernetes-style versioning is well-understood and appropriate for IR schemas
- Intermediate format migration is sufficient for initial version; can revisit if painful
- AgentSkillIO IR should NOT include hooks (they're Claude-specific, not standard)

## REFERENCES
- `planning/PHASE_9_SPEC.md` - Full specification
- `planning/ROADMAP.md` - Updated roadmap
