# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Phase 7: AgentSkills Standard Alignment**

Working on aligning a16n with the AgentSkills open standard for portable AI agent skills. This involves:
- Renaming `AgentCommand` → `ManualPrompt` for bidirectional support
- Adding Cursor skills discovery and emission (`.cursor/skills/`)
- Adding Claude `disable-model-invocation` support

## Key Design Decisions

### 1. ManualPrompt vs AgentCommand
- **Decision:** Rename to `ManualPrompt` to align with AgentSkills terminology
- **Rationale:** The AgentSkills standard uses `disable-model-invocation` for user-requested prompts; "ManualPrompt" better describes this concept
- **Impact:** Breaking change mitigated with deprecation aliases

### 2. Classification Change for Cursor Rules
- **Decision:** Rules without activation criteria → ManualPrompt (not GlobalPrompt)
- **Rationale:** Aligns with Cursor's intent - rules without `alwaysApply: true` or `globs` or `description` are agent-requestable, not always-applied
- **Impact:** Potential behavior change for existing users; documented in migration guide

### 3. Skills Directory Structure
- **Decision:** Follow AgentSkills standard: `.cursor/skills/<name>/SKILL.md`
- **Rationale:** Cross-tool compatibility with Cursor, Claude, Codex
- **Impact:** AgentSkill no longer emits to `.cursor/rules/`

## Immediate Next Steps

1. **Start with Task 1:** Rename `AgentCommand` → `ManualPrompt` in models package
2. **Write tests first:** Following TDD - stub tests before implementation
3. **Parallel work:** After Task 1, can parallelize Tasks 2, 3, 5, 7

## Technical Notes

### ManualPrompt Interface
```typescript
export interface ManualPrompt extends AgentCustomization {
  type: CustomizationType.ManualPrompt;
  /** Name for invocation (e.g., "review" for /review) */
  promptName: string;
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

### Key Mapping
| AgentSkills Concept | a16n Type |
|---------------------|-----------|
| Skill with `description` | `AgentSkill` |
| Skill with `disable-model-invocation: true` | `ManualPrompt` |

## Recent Completed Work

| Phase | Completion Date | Archive |
|-------|-----------------|---------|
| Phase 6 | 2026-01-28 | [CLI Polish](archive/enhancements/20260128-PHASE6-CLI-POLISH.md) |
| Phase 5 | 2026-01-28 | [Git Ignore + Conflict Flag](archive/features/20260128-PHASE5-CONFLICT-FLAG.md) |
