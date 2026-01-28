# Task Archive: Phase 7 - AgentSkills Standard Alignment

## Metadata

| Field | Value |
|-------|-------|
| Task ID | PHASE-7-AGENTSKILLS |
| Title | AgentSkills Standard Alignment |
| Complexity | Level 4 (Major Feature / Multi-Package) |
| Date | 2026-01-28 |
| Branch | `phase-7` |

---

## Summary

Aligned the `a16n` project with the [AgentSkills open standard](https://agentskills.io) for portable AI agent skills. This involved:

1. **Renaming AgentCommand → ManualPrompt** for bidirectional support
2. **Cursor skills discovery/emission** via `.cursor/skills/*/SKILL.md`
3. **Claude ManualPrompt handling** with `disable-model-invocation: true` support
4. **Follow-up cleanup:** Removed all deprecation aliases (AgentCommand, isAgentCommand) since project is v0

**Key Deliverables:**
- `ManualPrompt` type with `promptName` field
- Cursor skills discovery from `.cursor/skills/` directory
- Cursor skills emission to `.cursor/skills/` (replacing `.cursor/rules/` for AgentSkill)
- Claude ManualPrompt discovery/emission with `disable-model-invocation` flag
- 364 tests passing across 6 packages (after deprecation removal)

---

## Requirements

### Original Requirements
1. Rename `AgentCommand` to `ManualPrompt` to align with AgentSkills terminology
2. Implement bidirectional Cursor skills discovery (`.cursor/skills/*/SKILL.md`)
3. Implement Cursor skills emission for AgentSkill and ManualPrompt
4. Add `disable-model-invocation: true` support for Claude ManualPrompt
5. Update classification: rules without activation criteria → ManualPrompt (not GlobalPrompt)

### Follow-up Requirements (Deprecation Removal)
- Remove `AgentCommand` enum value and type alias
- Remove `isAgentCommand()` helper function
- Remove all re-exports and tests for deprecated aliases
- Rationale: v0 project; no need for backward-compat shims

---

## Implementation

### Phase A: Foundation (Models Package)
| Task | Description |
|------|-------------|
| Task 1 | Renamed `AgentCommand` → `ManualPrompt` with `promptName` field |

### Phase B-E: Plugin Updates
| Task | Description |
|------|-------------|
| Task 2 | Classification change: no criteria → ManualPrompt |
| Task 3 | Cursor skills discovery from `.cursor/skills/` |
| Task 4 | Cursor skills emission to `.cursor/skills/` |
| Task 5 | Claude ManualPrompt discovery (`disable-model-invocation`) |
| Task 6 | Claude ManualPrompt emission (with disable flag) |
| Task 7 | Updated all package references to use ManualPrompt |

### Follow-up: Deprecation Removal
- Removed `CustomizationType.AgentCommand` enum value
- Removed `AgentCommand` type alias
- Removed `isAgentCommand()` function
- Removed re-exports from `index.ts`
- Updated tests to use `ManualPrompt` / `isManualPrompt` only
- Updated Claude discover test name and assertions

### Files Changed
- `packages/models/src/types.ts` - ManualPrompt type, removed AgentCommand
- `packages/models/src/helpers.ts` - isManualPrompt(), removed isAgentCommand()
- `packages/models/src/index.ts` - Updated exports
- `packages/models/test/*.ts` - Updated tests
- `packages/plugin-cursor/src/discover.ts` - Skills discovery
- `packages/plugin-cursor/src/emit.ts` - Skills emission
- `packages/plugin-claude/src/discover.ts` - ManualPrompt discovery
- `packages/plugin-claude/src/emit.ts` - ManualPrompt emission
- `packages/plugin-claude/test/discover.test.ts` - Updated test names

---

## Testing

- **Unit Tests:** All type guards, helpers, discovery, and emission functions tested
- **Integration Tests:** Cross-plugin conversion tested via CLI integration tests
- **Final Count:** 364 tests passing across 6 packages
- **Build:** All packages build successfully with TypeScript

---

## Lessons Learned

### What Went Well
1. **TDD approach** - Tests passed on first implementation attempt after stubs
2. **Incremental multi-package changes** - No breakage during development
3. **Clean separation** of discovery vs emission logic
4. **Early detection** of Unicode JSDoc issues

### Challenges
1. Table formatting with unicode in markdown files (use Write tool)
2. Integration test path updates when emission paths changed
3. Collision handling for shared `.cursor/skills/` namespace

### Key Insights
- On v0, prefer **removing** deprecated aliases over keeping `@deprecated` shims
- Fixture-first approach works well for TDD with file-based tests
- Run tests frequently during multi-package changes

---

## Technical Details

### ManualPrompt Interface
```typescript
export interface ManualPrompt extends AgentCustomization {
  type: CustomizationType.ManualPrompt;
  promptName: string;  // Name for invocation (e.g., "review" for /review)
}
```

### SKILL.md Format
```markdown
---
name: my-skill
description: When to use this skill
disable-model-invocation: true  # Optional: manual-only
---

Instructions for the agent...
```

### Classification Mapping
| AgentSkills Concept | a16n Type |
|---------------------|-----------|
| Skill with `description` | `AgentSkill` |
| Skill with `disable-model-invocation: true` | `ManualPrompt` |

---

## References

- Reflection: `memory-bank/reflection/reflection-PHASE-7-AGENTSKILLS.md` (archived)
- Follow-up Reflection: `memory-bank/reflection/reflection-PHASE-7-DEPRECATION-REMOVAL.md` (archived)
- AgentSkills Standard: https://agentskills.io
