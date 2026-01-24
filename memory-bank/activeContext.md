# Memory Bank: Active Context

## Current Focus

**Task ID**: PHASE2-FILERULE-AGENTSKILL  
**Phase**: Phase 2 - FileRule + AgentSkill Support  
**Status**: Planning Complete → Ready for Implementation

## Phase 2 Overview

Extending a16n to support FileRule (glob-triggered) and AgentSkill (description-triggered) customization types for bidirectional Cursor ↔ Claude conversion.

### Key Innovation: glob-hook Integration

The `@a16n/glob-hook` package (completed in PR #2) enables deterministic FileRule support in Claude Code:

```
Cursor FileRule → .a16n/rules/*.txt + .claude/settings.local.json (hooks)
                           ↓
                  npx @a16n/glob-hook (runtime matching)
```

## Implementation Strategy

### Phase 2a: Discovery (Tasks 1-2, 5)
Extend both plugins to discover FileRule and AgentSkill types from source formats.

### Phase 2b: Emission (Tasks 3-4, 6-7)
Extend both plugins to emit FileRule and AgentSkill to target formats.

### Phase 2c: Integration (Tasks 8-12)
Update plugin metadata, add tests, and documentation.

## Format Reference

### Cursor MDC Classification

```
alwaysApply: true          → GlobalPrompt
globs: **/*.tsx            → FileRule  
description: "Auth helper" → AgentSkill
(none of above)            → GlobalPrompt (fallback)
```

### Claude Output Structures

**FileRule** (via hooks):
```
.a16n/rules/<name>.txt           # Rule content
.claude/settings.local.json      # Hook configuration
```

**AgentSkill** (simple, no hooks):
```
.claude/skills/<name>/SKILL.md   # Skill with description frontmatter
```

### Claude Skills with Hooks (UNSUPPORTED)

Skills containing `hooks:` in their YAML frontmatter are **not convertible**:

```markdown
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      ...
---
```

**Why**: Skill-scoped hooks only run during that skill's lifecycle. Cursor has no equivalent. Stripping hooks would produce broken/unsafe skills.

**Handling**: Detect `hooks:` key → skip with warning, do not convert.

## Critical Technical Details

### Claude Hook Configuration Format

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Read|Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "npx @a16n/glob-hook --globs \"**/*.tsx\" --context-file \".a16n/rules/react.txt\""
      }]
    }]
  }
}
```

### Claude Skill Format

```markdown
---
description: "Skill activation description"
---

[Skill content here]
```

## Next Immediate Steps

1. Start with **Task 1: Cursor FileRule Discovery** - Modify `classifyRule()` in `discover.ts`
2. Add test fixtures for FileRule patterns
3. Write unit tests for classification logic

## Reference Documents

| Document | Purpose |
|----------|---------|
| `planning/glob-hook/PRODUCT_BRIEF.md` | Why glob-hook exists |
| `planning/ARCHITECTURE.md` | System design |
| `memory-bank/archive/features/20260124-GLOB-HOOK-BUILD.md` | glob-hook implementation details |
