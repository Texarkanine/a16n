# Memory Bank: System Patterns

## Architecture Pattern

Plugin-based conversion engine with intermediate representation (IR):

```
Source Plugin.discover() → AgentCustomization[] (IR) → Target Plugin.emit()
```

## Error Handling Philosophy

1. **Fail fast on invalid input** - Bad syntax, missing fields → error
2. **Warn and continue on capability gaps** - Unsupported features → warning + skip/approximate
3. **Never silently drop data** - Every skipped item produces a warning
4. **Aggregate warnings** - Show all issues at end, not one at a time

## Warning System

```typescript
enum WarningCode {
  Merged = 'merged',           // Multiple items collapsed into one
  Approximated = 'approximated', // Feature translated imperfectly
  Skipped = 'skipped',         // Feature not supported, omitted
  Overwritten = 'overwritten', // Existing file replaced
  FileRenamed = 'file-renamed', // Filename collision resolved
}
```

## Plugin Interface Pattern

```typescript
interface A16nPlugin {
  id: string;
  name: string;
  supports: CustomizationType[];
  discover(root: string): Promise<DiscoveryResult>;
  emit(models: AgentCustomization[], root: string): Promise<EmitResult>;
}
```

## IR Type Classification (Cursor)

Priority order for MDC files:
1. `alwaysApply: true` → GlobalPrompt
2. `globs:` present → FileRule
3. `description:` present (no globs) → SimpleAgentSkill
4. `disable-model-invocation: true` → ManualPrompt
5. None of above → GlobalPrompt (fallback)

## File Structure Conventions

- Nested CLAUDE.md ↔ Nested .cursor/rules/ (structure preserved)
- Skills: `.claude/skills/<name>/SKILL.md` ↔ `.cursor/skills/<name>/SKILL.md` (flat only, no nesting)
- Skill resources: `readSkillFiles()` recursively reads subdirectories (scripts/, references/, assets/)
- Generated artifacts: `.a16n/` directory

## CLI Output Conventions

- Human-friendly by default
- `--json` for scripting
- `--dry-run` for preview ("Would" prefix)
- Exit 0 on success (even with warnings)
- Exit 1 on errors

## Testing Pattern

- Unit tests per package via Vitest
- Integration tests with fixtures in `test/integration/fixtures/`
- Fixture naming: `<tool>-<feature>/from-<tool>/` and `expected-<tool>/`
