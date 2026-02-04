# Memory Bank: Active Context

## Current Focus

**Task:** Phase 9 - IR Serialization Plugin (`@a16njs/plugin-a16n`)
**Plugin ID:** `'a16n'`
**Status:** Planning complete with architectural decisions, ready for implementation
**Complexity:** Level 4

---

## Session Context

### What We're Building
A new plugin that enables persisting and reading the a16n intermediate representation (IR) to/from disk in a `.a16n/` directory structure with:
- YAML frontmatter for metadata (version, type, name, relativeDir, type-specific fields)
- Markdown content for the actual prompt/rule content
- Kubernetes-style versioning (`v1beta1`, `v1`, `v2beta1`, etc.)
- Directory structure preservation via `relativeDir` field
- Shared AgentSkillsIO parsing utilities in `@a16njs/models`

### Key Architectural Decisions

**Full research documentation:** `memory-bank/creative/creative-phase9-architecture.md`

**Summary:**
- Plugin ID `'a16n'` for clean CLI usage (`--from a16n`)
- Add `relativeDir` field to preserve directory structure
- Derive `promptName` from filename (no frontmatter duplication)
- Extract AgentSkillsIO utilities to `@a16njs/models/src/agentskills-io.ts`
- Kubernetes-style versioning with compatibility rules
- Keep `sourcePath` for debugging/provenance

---

## Implementation Order

Start with **Milestones 1 & 2 in parallel** (no dependencies):

### Milestone 1: IR Model Versioning & Extensions (~5 hours)
- Add `IRVersion` type to `packages/models/src/types.ts`
- Add `relativeDir` field to `AgentCustomization` base interface
- Create `packages/models/src/version.ts` with parse/compatibility utilities
- **Create `packages/models/src/agentskills-io.ts` with parsing utilities**
- Add `WarningCode.VersionMismatch` to warnings
- Write tests first (TDD)

### Milestone 2: Plugin Package Setup (~1 hour)
- Create `packages/plugin-a16n/` directory structure
- Set up package.json (name: `@a16njs/plugin-a16n`), tsconfig.json, vitest.config.ts
- Create placeholder index.ts with plugin `id: 'a16n'`
- Verify build works

Then proceed sequentially: M3 → M4 & M5 (parallel) → M6 → M7

**Total Estimated:** ~24 hours across 7 milestones

---

## Key Patterns to Follow

### Plugin Structure (from plugin-cursor/plugin-claude)
```typescript
const plugin: A16nPlugin = {
  id: 'a16n',  // CLI usage: --from a16n, --to a16n
  name: 'a16n Intermediate Representation',
  supports: [/* all CustomizationType values */],
  discover,
  emit,
};
export default plugin;
```

### Warning Pattern
```typescript
warnings.push({
  code: WarningCode.VersionMismatch,
  message: `IR file version ${fileVersion} is incompatible with current version ${CURRENT_IR_VERSION}`,
  sources: [relativePath],
});
```

### EmitResult Pattern
```typescript
return {
  written: [{ path, type, itemCount: 1, isNewFile: true, sourceItems: [item] }],
  warnings: [],
  unsupported: [],
};
```

---

## Immediate Next Steps

1. **Start Milestone 1:** Models package extensions
   - Add `relativeDir` field to `AgentCustomization` interface
   - Create `version.ts` with TDD (tests first, then implementation)
   - Create `agentskills-io.ts` with shared parsing utilities
   - Write comprehensive tests for both modules
   - Export new types/functions

2. **Start Milestone 2 (in parallel):** Plugin package scaffold
   - Create `packages/plugin-a16n/` directory structure
   - Configure package.json (name: `@a16njs/plugin-a16n`)
   - Create placeholder index.ts with `id: 'a16n'`
   - Verify build integration

---

## Files to Reference

| Pattern | File |
|---------|------|
| Plugin structure | `packages/plugin-cursor/src/index.ts` |
| Discovery impl | `packages/plugin-cursor/src/discover.ts` |
| Emission impl | `packages/plugin-cursor/src/emit.ts` |
| Warning codes | `packages/models/src/warnings.ts` |
| Type definitions | `packages/models/src/types.ts` |
| Package setup | `packages/plugin-claude/package.json` |

---

## Recent Activity

- Loaded Phase 9 specification from `planning/PHASE_9_SPEC.md`
- Analyzed existing codebase patterns (discovered directory structure loss bug)
- Researched 3 key architectural questions (see: `memory-bank/creative/creative-phase9-architecture.md`)
- Finalized architectural decisions (documented in tasks.md)
- **Integrated 10 implementation amendments** (see creative doc):
  - Breaking changes to `AgentCustomization` interface
  - Clarified `metadata` not serialized, `sourcePath` optional
  - Fixed relativeDir extraction, version regex, compatibility semantics
  - Kebab-case directory names, ManualPrompt namespace handling
  - AgentSkillIO verbatim format (no IR frontmatter)
- Created comprehensive task breakdown with 7 milestones (~24 hours)
- All planning complete, ready for implementation
