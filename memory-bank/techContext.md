# Memory Bank: Technical Context

## Architecture Overview
Plugin-based monorepo with:
- `@a16n/models` - Shared types and plugin interface
- `@a16n/engine` - Conversion orchestration
- `@a16n/plugin-cursor` - Cursor IDE support
- `@a16n/plugin-claude` - Claude Code support
- `a16n` - CLI package

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Package Manager | pnpm | workspace:* protocol, strict node_modules, fast |
| Versioning | Changesets | Auto-cascades dependency bumps |
| Build | Turborepo | Minimal config, aggressive caching |
| Language | TypeScript | Type safety for plugin interfaces |

## Core Abstractions

### CustomizationType Enum
- `GlobalPrompt` - Always-applied prompts
- `AgentSkill` - Description-triggered skills
- `FileRule` - Glob-triggered rules
- `AgentIgnore` - Exclusion patterns

### Plugin Interface
```typescript
interface A16nPlugin {
  id: string;
  name: string;
  supports: CustomizationType[];
  discover(root: string): Promise<DiscoveryResult>;
  emit(models: AgentCustomization[], root: string): Promise<EmitResult>;
}
```

## Tool Mappings

### Cursor
- `.cursor/rules/*.mdc` → GlobalPrompt/AgentSkill/FileRule
- Legacy `.cursorrules` is NOT supported (use `.cursor/rules/*.mdc`)
- `.cursorignore` → AgentIgnore

### Claude Code
- `CLAUDE.md` (nestable) → GlobalPrompt
- `.claude/skills/` → AgentSkill
- Tool hooks → FileRule (approximated)
- No equivalent → AgentIgnore (skipped)

## Key Technical Decisions
- Warn on lossy conversion, don't fail
- Support nested directory structures (both tools)
- MDC frontmatter uses text parsing (not YAML - globs are comma-separated strings)
