# Memory Bank: System Patterns

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
}
```

## Plugin Discovery Pattern
1. Bundled plugins (always available)
2. npm packages matching `@a16n/plugin-*` or `a16n-plugin-*`
3. Uses `require.resolve` similar to ESLint

## Conversion Flow
```
Source Plugin.discover() → AgentCustomization[] → Target Plugin.emit()
```

## File Structure Preservation
- Nested CLAUDE.md → Nested .cursor/rules/ (structure preserved)
- Nested .cursor/rules/ → Nested CLAUDE.md (structure preserved)
- No flattening required for either direction

## CLI Output Conventions
- Human-friendly by default
- `--json` for scripting
- `--dry-run` for preview
- Exit 0 on success (even with warnings)
- Exit 1 on errors
