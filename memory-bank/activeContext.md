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
- YAML frontmatter for metadata (version, type, relativeDir, type-specific fields)
- Markdown content for the actual prompt/rule content
- Kubernetes-style versioning (`v1beta1`, `v1`, `v2beta1`, etc.)
- Directory structure preservation via `relativeDir` field
- Shared AgentSkillsIO parsing utilities in `@a16njs/models`

### Completed Milestones

**M1: IR Model Versioning & Extensions** ✅ (3 hours)
- Added IRVersion type and version utilities
- Created AgentSkills.io shared parsing utilities
- Applied breaking changes to AgentCustomization interface
- Updated all plugins and CLI
- 30 new tests, all 493 tests passing
- PR #32 merged to main

**M2: Plugin Package Setup** ✅ (15 minutes)
- Created `@a16njs/plugin-a16n` package structure
- Plugin ID `'a16n'` configured
- Dependencies and build configuration complete
- Comprehensive README documentation
- Integrates successfully with turbo monorepo
- PR #35 merged to main

**M3: Frontmatter Parsing & Formatting** ✅ (2.5 hours)
- Implemented parseIRFile() and formatIRFile()
- Created utility functions (extractRelativeDir, slugify, getNameWithoutExtension)
- 53 new tests (27 parse + 26 format)
- Fixed bugs in plugin-cursor and plugin-claude supports arrays
- All 546 monorepo tests passing
- PR #36 merged to main

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

**Completed:** M1 ✅, M2 ✅, M3 ✅  
**Current:** Starting M4 (IR Emission + CLI Integration)  
**Remaining:** M4 → M5 → M6 → M7

### Next: Milestone 4: IR Emission + CLI Integration (~5 hours)
**Updated scope:** CLI integration tasks moved from M6 to enable functional `--to a16n` in this PR

**Core Emission (4.1-4.7):**
- Implement emit() function with kebab-case directories
- Handle AgentSkillIO verbatim format
- Handle ManualPrompt with relativeDir namespacing
- Create test fixtures and unit tests

**CLI Integration (4.8-4.14):**
- Update plugin supports array with all 6 CustomizationType values
- Add @a16njs/plugin-a16n dependency to CLI
- Import and register a16nPlugin in CLI engine
- Test end-to-end: `a16n convert --from cursor --to a16n .`

**Total Estimated:** ~25 hours across 7 milestones (updated from 24h)
**Actual So Far:** 5.75 hours (M1: 3h, M2: 0.25h, M3: 2.5h)  
**Remaining:** ~19.25 hours (4 milestones)

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

### Planning Phase (2026-02-03)
- Loaded Phase 9 specification from `planning/PHASE_9_SPEC.md`
- Analyzed existing codebase patterns (discovered directory structure loss bug)
- Researched 3 key architectural questions (see: `memory-bank/creative/creative-phase9-architecture.md`)
- Finalized architectural decisions with 10 implementation amendments
- Created comprehensive task breakdown with 7 milestones

### Implementation Phase (2026-02-04)
- **M1 Completed** (3 hours, PR #32 merged):
  - Implemented IR versioning system (Kubernetes-style)
  - Created AgentSkills.io shared utilities
  - Applied breaking changes to models package
  - Updated all 3 plugins and CLI
  - 30 new tests, all 493 tests passing

- **M2 Completed** (15 minutes, PR #34 created):
  - Created `@a16njs/plugin-a16n` package structure
  - Plugin ID `'a16n'` configured
  - Build integration verified
  - Comprehensive README written

- **M3 Completed** (2.5 hours, PR #36 merged):
  - Implemented parseIRFile() and formatIRFile()
  - Created utility functions for path handling
  - 53 new tests (27 parse + 26 format)
  - Fixed bugs in plugin-cursor and plugin-claude
  - All 546 tests passing

### Current Status (2026-02-04)
- **Starting M4** (IR Emission + CLI Integration)
- Branch: `p9-m4` (ready for implementation)
- All verification checks passing (build, test, typecheck)
- CLI integration tasks moved from M6 to enable functional `--to a16n` in this milestone
- User requirement: Full CLI functionality needed for release after PR merge
