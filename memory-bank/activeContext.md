# Memory Bank: Active Context

## Current Session Focus

**Task**: Phase 8 Part B - Full AgentSkills.io Support
**Mode**: Implementation In Progress
**Started**: 2026-02-01
**Reference**: `/home/mobaxterm/Documents/git/a16n/planning/PHASE_8_SPEC.md` (lines 344-603)

## Implementation Progress

Milestones 4 and 5 are now complete.

### Milestones Status

| Milestone | Description | Tasks | Status |
|-----------|-------------|-------|--------|
| 4 | Type System Updates (B1+B2) | 13 | ✅ Complete |
| 5 | AgentSkillIO Discovery (B3) | 8 | ✅ Complete |
| 6 | AgentSkillIO Emission (B4) | 6 | ✅ Complete |
| 7 | Integration & Polish | 6 | ⏳ Ready |

### Dependencies

```
Milestone 4 → Milestone 5 → Milestone 6 → Milestone 7
```

**Note**: Milestone 4 (Type System Updates) is a prerequisite for milestones 5-7. Must complete in order.

## Key Technical Decisions

### B1: Type Rename Strategy

- `AgentSkill` → `SimpleAgentSkill` with deprecated alias
- Maintain backward compatibility via type alias
- All existing code continues to work without changes initially

### B2: AgentSkillIO Structure

```typescript
interface AgentSkillIO {
  type: CustomizationType.AgentSkillIO;
  name: string;
  description: string;
  hooks?: Record<string, unknown>;  // Copied verbatim
  resources?: string[];             // Resource file paths
  disableModelInvocation?: boolean;
  files: Record<string, string>;    // filename → content map
}
```

### B3: Discovery Classification Logic

```
SKILL.md found?
├── No → Skip directory
└── Yes → Parse frontmatter
    ├── Has hooks OR extra files?
    │   └── Yes → AgentSkillIO
    ├── Has disable-model-invocation: true?
    │   └── Yes → ManualPrompt
    └── Has description only?
        └── Yes → SimpleAgentSkill
```

### B4: Emission Routing

**For Cursor output:**
- Simple AgentSkillIO → `.cursor/rules/<name>.mdc` (idiomatic)
- Complex AgentSkillIO → `.cursor/skills/<name>/` with all files
- Hooks → Warning (not supported by Cursor)

**For Claude output:**
- All AgentSkillIO → `.claude/skills/<name>/` with all files
- Hooks → Preserved in frontmatter (supported by Claude)

## Files to Modify

### Models Package
- `packages/models/src/types.ts` - New types
- `packages/models/src/helpers.ts` - New type guards
- `packages/models/src/index.ts` - Updated exports
- `packages/models/test/*.test.ts` - Updated tests

### Cursor Plugin
- `packages/plugin-cursor/src/discover.ts` - Full directory discovery
- `packages/plugin-cursor/src/emit.ts` - AgentSkillIO emission
- `packages/plugin-cursor/test/*.test.ts` - New tests

### Claude Plugin  
- `packages/plugin-claude/src/discover.ts` - Full directory discovery
- `packages/plugin-claude/src/emit.ts` - AgentSkillIO emission
- `packages/plugin-claude/test/*.test.ts` - New tests

### CLI/Integration
- `packages/cli/test/integration/` - Round-trip tests

## Test Fixtures to Create

1. `packages/plugin-cursor/test/fixtures/cursor-skills-complex/`
2. `packages/plugin-claude/test/fixtures/claude-skills-complex/`
3. `packages/cli/test/integration/fixtures/cursor-to-claude-complex-skill/`
4. `packages/cli/test/integration/fixtures/claude-to-cursor-complex-skill/`

## Next Actions

When `/build` is invoked:
1. Start with Milestone 4 (Type System Updates)
2. Follow TDD methodology
3. Complete each milestone before starting next
4. Create reflection documents upon completion

## Milestone 4 Summary (Complete)

Type system successfully updated:
- `SimpleAgentSkill` type (renamed from `AgentSkill`, with deprecated alias)
- `AgentSkillIO` type (new, with hooks, resources, files fields)
- `isSimpleAgentSkill()` and `isAgentSkillIO()` type guards
- All packages updated and tested

## Milestone 5 Summary (Complete)

Discovery logic updated for AgentSkillIO:
- Both Cursor and Claude plugins now read full skill directories
- Skills with extra files (Cursor) or hooks (Claude) → AgentSkillIO
- Simple skills (only SKILL.md) → SimpleAgentSkill or ManualPrompt
- 452 tests pass across all packages

## Milestone 6 Summary (Complete)

Emission logic implemented for AgentSkillIO following TDD:
- **Cursor**: Smart routing based on complexity (simple → rule, complex → full directory)
- **Claude**: Full AgentSkills.io support (always emits to skill directory)
- Hooks warning added for Cursor (not supported)
- All resource files written from `files` map
- 452 tests pass across all packages

## Blockers

None. Ready for Milestone 7 (Integration Testing & Polish).
