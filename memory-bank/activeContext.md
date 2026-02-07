# Memory Bank: Active Context

## Current Focus

**Task:** Phase 9 - Milestones 5 & 6 (IR Discovery + E2E Testing)
**Plugin ID:** `'a16n'`
**Status:** Planning complete, ready for implementation
**Complexity:** Level 4
**Branch:** `p9-m5`

---

## Session Context

### What We're Building

**M5:** `discover()` function — reads `.a16n/` directory structure back into IR items (the inverse of `emit()`).

**M6:** End-to-end integration tests — programmatic round-trip tests via the engine's `convert()` function.

### Completed Milestones

**M1: IR Model Versioning & Extensions** ✅ (3 hours, PR #32)
**M2: Plugin Package Setup** ✅ (15 minutes, PR #35)
**M3: Frontmatter Parsing & Formatting** ✅ (2.5 hours, PR #36)
**M4: IR Emission + CLI Integration + Bug Fixes** ✅ (4 hours, PR #37)

### Current State of plugin-a16n

- `src/parse.ts` — `parseIRFile(filepath, filename, relativePath)` → reads and parses a single IR file
- `src/format.ts` — `formatIRFile(item)` → formats an IR item to markdown with YAML frontmatter
- `src/emit.ts` — `emit(models, root, options)` → writes IR items to `.a16n/` directory
- `src/utils.ts` — `extractRelativeDir()`, `slugify()`, `getNameWithoutExtension()`
- `src/index.ts` — Plugin definition with `discover` as TODO stub
- `@a16njs/models` — `readAgentSkillIO()`, `writeAgentSkillIO()`, `areVersionsCompatible()`, `createId()`

### Key Patterns to Follow

**Discovery return type:**
```typescript
interface DiscoveryResult {
  items: AgentCustomization[];
  warnings: Warning[];
}
```

**Warning pattern:**
```typescript
warnings.push({
  code: WarningCode.Skipped, // or WarningCode.VersionMismatch
  message: `Description of issue`,
  sources: [relativePath],
});
```

**Existing parseIRFile signature:**
```typescript
async function parseIRFile(
  filepath: string,   // absolute path to file
  filename: string,   // just the filename (e.g., "basic.md")
  relativePath: string // path relative to .a16n/ root (e.g., ".a16n/global-prompt")
): Promise<ParseIRFileResult>
```

**readAgentSkillIO return type:**
```typescript
{ success: true; skill: ParsedSkill & { files: Record<string, string> } }
| { success: false; error: string }
```

**createId pattern:**
```typescript
createId(CustomizationType.GlobalPrompt, sourcePath) // → "global-prompt:sourcePath"
```

---

## Implementation Order

### TDD Process (Strict)

1. **Stub** `discover.ts` + `discover.test.ts` (empty implementations)
2. **Write** test implementations
3. **Run** tests → should all fail (red)
4. **Implement** `discover()` 
5. **Run** tests → should all pass (green)
6. **Wire** into `index.ts`
7. **Integration** tests (M6)
8. **Full** verification

---

## Files to Reference

| Pattern | File |
|---------|------|
| Parse implementation | `packages/plugin-a16n/src/parse.ts` |
| Emit implementation (inverse) | `packages/plugin-a16n/src/emit.ts` |
| Utils (extractRelativeDir) | `packages/plugin-a16n/src/utils.ts` |
| Plugin entry | `packages/plugin-a16n/src/index.ts` |
| Cursor discover (reference) | `packages/plugin-cursor/src/discover.ts` |
| Claude discover (reference) | `packages/plugin-claude/src/discover.ts` |
| AgentSkillsIO shared utils | `packages/models/src/agentskills-io.ts` |
| Version utilities | `packages/models/src/version.ts` |
| Warning codes | `packages/models/src/warnings.ts` |
| Type definitions | `packages/models/src/types.ts` |
| Type helpers | `packages/models/src/helpers.ts` |
| Emit tests (pattern) | `packages/plugin-a16n/test/emit.test.ts` |
| Integration tests (pattern) | `packages/cli/test/integration/integration.test.ts` |

---

## Immediate Next Steps

1. **Create fixture directories** for discover tests
2. **Stub** `discover.ts` with function signature and empty implementation
3. **Stub** `discover.test.ts` with all test case outlines
4. **Implement** test cases
5. **Implement** `discover()` function
6. **Wire** into `index.ts`
7. **Run** plugin tests
8. **Create** M6 integration fixtures and tests
9. **Run** full monorepo verification
