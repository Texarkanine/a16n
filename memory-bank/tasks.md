# Memory Bank: Tasks

## Current Task

**Task ID**: DOCS-CLEANUP-R2
**Title**: Documentation Cleanup Round 2
**Complexity**: Level 2 (Simple Enhancement)
**Status**: Planning

## Task Description

Address feedback from documentation review:

1. **CLI versioned docs not generating** - Integrate CLI doc generation into versioned pipeline
2. **Remove plugin-to-plugin conversion tables** - Doesn't scale with N plugins
3. **Remove Quick Reference from Models** - Not useful
4. **Simplify plugin pages** - Link to canonical tool docs instead of replicating
5. **Clean up Models page** - Remove tool-specific implementation details
6. **Punt on API version linking** - Too complex to maintain accurately

## Analysis

### Issue 1: CLI Versioned Docs

The `generate-versioned-api.ts` script explicitly excludes CLI:
```typescript
// Note: CLI tools (cli, glob-hook) are excluded - they don't export library APIs.
const PACKAGES: PackageConfig[] = [
  { name: 'engine', ... },
  { name: 'models', ... },
  ...
];
```

But we have `generate-cli-docs.ts` that CAN generate versioned CLI docs. Need to:
1. Add CLI to versioned generation
2. Use `generateCliDocsForVersion()` instead of TypeDoc

### Issue 2: Plugin-to-Plugin Conversion Tables

Current tables like:
```
| Cursor | Claude | Notes |
| alwaysApply: true | CLAUDE.md | ... |
```

These create N×N documentation that doesn't scale. Remove from:
- `plugin-cursor/index.md` (lines 230-250)
- `plugin-claude/index.md` (lines 300-321)

### Issue 3: Quick Reference in Models

The "Quick Reference" section (lines 127-147) duplicates info already in Type Guards section. Remove.

### Issue 4: Simplify Plugin Pages

Instead of documenting Cursor/Claude file formats in detail, link to canonical docs:
- Cursor: Link to Cursor's official rules documentation
- Claude: Link to Claude Code's official documentation

Remove verbose sections:
- `plugin-cursor/index.md`: Command Files, .cursorignore Format sections
- `plugin-claude/index.md`: Similar verbose sections

### Issue 5: Models Page Tool-Specific Info

The "How Each Tool Implements Them" table is plugin-specific:
```
| Type | Cursor | Claude |
| GlobalPrompt | .cursor/rules/*.mdc | CLAUDE.md |
```

This should reference internal IR types, not external tools. Either:
- Remove the table entirely
- Or move to a "tool-specific" section that acknowledges it will grow

### Issue 6: API Version Linking

User says: "we don't want to hardcode versions everywhere... I think we punt on that for now"

Agreed. Keep links version-agnostic like `/models/api` instead of `/models/api/0.3.0`.

---

## Implementation Plan

### Phase 1: CLI Versioned Docs

| Step | Task | Files |
|------|------|-------|
| 1.1 | Add CLI to PACKAGES in generate-versioned-api.ts | `scripts/generate-versioned-api.ts` |
| 1.2 | Create CLI-specific generation function | `scripts/generate-versioned-api.ts` |
| 1.3 | Call CLI generator for each CLI tag | `scripts/generate-versioned-api.ts` |
| 1.4 | Add CLI to versions.json | `scripts/generate-versioned-api.ts` |

**Key insight**: CLI uses `generateCliDocsForVersion()` from `generate-cli-docs.ts`, not TypeDoc.

### Phase 2: Remove Plugin-to-Plugin Conversion Tables

| Step | Task | Files |
|------|------|-------|
| 2.1 | Remove "Conversion Notes" section from plugin-cursor | `docs/plugin-cursor/index.md` |
| 2.2 | Remove "Conversion Notes" section from plugin-claude | `docs/plugin-claude/index.md` |

### Phase 3: Clean Up Models Page

| Step | Task | Files |
|------|------|-------|
| 3.1 | Remove "Quick Reference" section | `docs/models/index.md` |
| 3.2 | Remove "How Each Tool Implements Them" table | `docs/models/index.md` |
| 3.3 | Simplify "Conceptual Distinctions" (remove tool refs) | `docs/models/index.md` |

### Phase 4: Simplify Plugin Pages

| Step | Task | Files |
|------|------|-------|
| 4.1 | Remove "Command Files" section from plugin-cursor | `docs/plugin-cursor/index.md` |
| 4.2 | Remove ".cursorignore Format" section from plugin-cursor | `docs/plugin-cursor/index.md` |
| 4.3 | Add link to Cursor's canonical documentation | `docs/plugin-cursor/index.md` |
| 4.4 | Simplify plugin-claude similarly | `docs/plugin-claude/index.md` |
| 4.5 | Add link to Claude's canonical documentation | `docs/plugin-claude/index.md` |

### Phase 5: Verification

| Step | Task | Files |
|------|------|-------|
| 5.1 | Run `pnpm build` in docs | (test) |
| 5.2 | Verify CLI versions appear | (test) |
| 5.3 | Run full test suite | (test) |

---

## Technical Notes

### CLI Doc Generation Integration

The existing `generateCliDocsForVersion()` function in `generate-cli-docs.ts`:
```typescript
export async function generateCliDocsForVersion(
  outputDir: string,
  version?: string
): Promise<void>
```

Need to call this for each CLI git tag (pattern: `a16n@X.Y.Z`).

### Version-Agnostic Links

Use paths like:
- `/models/api` → Landing page (has VersionPicker)
- `/engine/api` → Landing page

Avoid:
- `/models/api/0.3.0/interfaces/A16nPlugin` (hardcoded version)

---

## Files to Modify

- `packages/docs/scripts/generate-versioned-api.ts`
- `packages/docs/docs/models/index.md`
- `packages/docs/docs/plugin-cursor/index.md`
- `packages/docs/docs/plugin-claude/index.md`
