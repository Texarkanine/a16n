# Memory Bank: Tasks

## Current Task: Phase 9 Milestones 5 & 6 (IR Discovery + E2E Testing)

**Status:** PLANNING
**Branch:** `p9-m5`
**Last Updated:** 2026-02-06
**Complexity:** Level 4

---

## Task Overview

Implement IR discovery (`--from a16n`) and complete end-to-end integration testing. These two milestones enable round-trip conversion: the `.a16n/` directory can now be both read and written, completing the plugin's core functionality.

**M5** implements `discover()` — reading `.a16n/` directory back into IR items.
**M6** tests end-to-end integration: discover → convert → round-trip.

---

## Milestone 5: IR Discovery (`--from a16n`)

**Status:** `pending`
**Dependencies:** M3 (parse.ts, format.ts), M4 (emit.ts, CLI wiring)
**Estimated:** 4 hours

### Scope

Implement the `discover()` function that reads `.a16n/` directory structure back into IR items. This is the inverse of `emit()`: it scans type directories, parses frontmatter files, handles AgentSkillIO verbatim format, validates versions, and produces warnings for issues.

### Architecture

```
.a16n/
├── global-prompt/          ← iterate, parse each .md via parseIRFile()
│   ├── coding-standards.md
│   └── shared/company/     ← recursive: relativeDir = "shared/company"
│       └── standards.md
├── agent-skill-io/         ← iterate, each subdir → readAgentSkillIO()
│   └── deploy-helper/
│       ├── SKILL.md
│       └── checklist.md
├── file-rule/              ← iterate, parse each .md via parseIRFile()
├── simple-agent-skill/     ← iterate, parse each .md via parseIRFile()
├── agent-ignore/           ← iterate, parse each .md via parseIRFile()
├── manual-prompt/          ← iterate, parse each .md (derive promptName from relativeDir + basename)
│   └── shared/company/     ← recursive: promptName = "shared/company/pr"
│       └── pr.md
└── unknown-dir/            ← WARN + skip
```

### Key Design Decisions (Already Decided in creative-phase9-architecture.md)

1. **Type directory names are kebab-case** matching `CustomizationType` enum values
2. **Recursive subdirectory scan** — files in subdirectories get `relativeDir` extracted via `extractRelativeDir()`
3. **AgentSkillIO is special** — uses `readAgentSkillIO()` from `@a16njs/models`, not `parseIRFile()`
4. **ManualPrompt promptName** — derived from `relativeDir` + filename (provides namespace)
5. **Version validation** — `areVersionsCompatible()` with `CURRENT_IR_VERSION` as reader
6. **Unknown directories** → `WarningCode.Skipped` warning, skip
7. **Invalid frontmatter** → `WarningCode.Skipped` warning, skip
8. **Invalid version format** → skip (parseIRFile already returns error)
9. **Incompatible version** → `WarningCode.VersionMismatch` warning, still process item

### Implementation Plan

#### 5.1 Create `packages/plugin-a16n/src/discover.ts` (NEW)

**Function signature:**
```typescript
export async function discover(root: string): Promise<DiscoveryResult>
```

**Algorithm:**
1. Check if `.a16n/` directory exists → if not, return empty `{ items: [], warnings: [] }`
2. Read top-level entries in `.a16n/`
3. For each directory entry:
   a. Validate against `Object.values(CustomizationType)` — unknown → warn + skip
   b. If `agent-skill-io` → call `discoverAgentSkillIO()` helper
   c. Otherwise → call `discoverStandardType()` helper (recursive .md scan)
4. Collate items + warnings and return

**Helper: `discoverStandardType()`**
- Recursively find all `.md` files in the type directory
- For each `.md` file:
  - Call `parseIRFile(filepath, filename, relativePath)` (already exists)
  - If error → `WarningCode.Skipped` warning, skip
  - Check version compatibility via `areVersionsCompatible(CURRENT_IR_VERSION, item.version)`
  - If incompatible → `WarningCode.VersionMismatch` warning, still include item
  - Push item to results

**Helper: `discoverAgentSkillIO()`**
- List subdirectories in `.a16n/agent-skill-io/`
- For each subdirectory:
  - Call `readAgentSkillIO(skillDir)` from `@a16njs/models`
  - If error → `WarningCode.Skipped` warning, skip
  - Construct `AgentSkillIO` IR item from parsed result
  - Version = `CURRENT_IR_VERSION` (AgentSkills.io format has no version field)
  - Push to results

**Imports needed:**
- `fs/promises`, `path` (Node builtins)
- `parseIRFile` from `./parse.js`
- `extractRelativeDir` from `./utils.js`
- From `@a16njs/models`:
  - `CustomizationType`, `CURRENT_IR_VERSION`, `WarningCode`
  - `areVersionsCompatible`, `readAgentSkillIO`, `createId`
  - Type imports: `DiscoveryResult`, `Warning`, `AgentCustomization`, `AgentSkillIO`

#### 5.2 Wire `discover()` into `index.ts`

Replace the TODO stub in `index.ts` with the actual import + delegation:
```typescript
import { discover as discoverImpl } from './discover.js';
// ...
discover: discoverImpl,
```

Also add export: `export { discover } from './discover.js';`

#### 5.3 Create test fixtures

**Fixture directories under `packages/plugin-a16n/test/fixtures/`:**

1. **`discover-basic/`** — Basic `.a16n/` with one file per type
   ```
   .a16n/
   ├── global-prompt/coding-standards.md
   ├── file-rule/typescript.md
   ├── simple-agent-skill/database.md
   ├── agent-ignore/cursorignore.md
   └── manual-prompt/review.md
   ```

2. **`discover-nested/`** — Subdirectories testing relativeDir
   ```
   .a16n/
   ├── global-prompt/
   │   └── shared/company/standards.md
   └── manual-prompt/
       ├── review.md
       └── shared/company/pr.md
   ```

3. **`discover-agentskill-io/`** — AgentSkillIO verbatim format
   ```
   .a16n/
   └── agent-skill-io/
       └── deploy-helper/
           ├── SKILL.md
           └── checklist.md
   ```

4. **`discover-unknown-dir/`** — Unknown type directory
   ```
   .a16n/
   ├── global-prompt/test.md
   └── unknown-type/something.md
   ```

5. **`discover-version-mismatch/`** — Version mismatch files
   ```
   .a16n/
   └── global-prompt/
       ├── current.md     (v1beta1 — current, should work)
       └── future.md      (v1beta99 — newer, incompatible → warning)
   ```

6. **`discover-invalid-frontmatter/`** — Files with parse errors
   ```
   .a16n/
   └── global-prompt/
       ├── valid.md         (valid file)
       ├── missing-version.md (no version field → error)
       └── bad-yaml.md      (malformed YAML → error)
   ```

7. **`discover-empty/`** — Empty `.a16n/` directory (no type subdirs)

#### 5.4 Write tests in `packages/plugin-a16n/test/discover.test.ts`

**Test structure:**
```
describe('A16n Plugin Discovery')
  describe('basic discovery')
    it('should return empty results when .a16n/ does not exist')
    it('should return empty results when .a16n/ is empty')
    it('should discover GlobalPrompt files')
    it('should discover FileRule files with globs')
    it('should discover SimpleAgentSkill files with description')
    it('should discover AgentIgnore files with patterns')
    it('should discover ManualPrompt files')
    it('should discover all types in a single .a16n/ directory')
  
  describe('relativeDir handling')
    it('should extract relativeDir from subdirectories')
    it('should handle files directly in type directory (no relativeDir)')
    it('should derive ManualPrompt promptName from relativeDir + basename')
    it('should handle ManualPrompt namespace collision (different relativeDir, same basename)')
  
  describe('AgentSkillIO discovery')
    it('should discover AgentSkillIO using readAgentSkillIO()')
    it('should include resource files in AgentSkillIO items')
    it('should handle AgentSkillIO without resource files')
    it('should warn and skip AgentSkillIO with missing SKILL.md')
  
  describe('version compatibility')
    it('should accept items with current version (v1beta1)')
    it('should warn on incompatible version (different major/stability)')
    it('should still include items with version mismatch')
    it('should skip files with invalid version format')
  
  describe('error handling')
    it('should warn and skip unknown type directories')
    it('should warn and skip files with invalid frontmatter')
    it('should warn and skip files with missing required fields')
    it('should skip non-.md files in type directories')
    it('should skip non-directory entries in .a16n/')
```

### Tasks Checklist

- [ ] 5.1 Create test fixtures (7 fixture directories)
- [ ] 5.2 Stub `discover.ts` with empty implementation + function signatures
- [ ] 5.3 Stub test file `discover.test.ts` with all test cases (empty implementations)
- [ ] 5.4 Implement test cases for `discover()`
- [ ] 5.5 Run tests → all should fail (TDD red phase)
- [ ] 5.6 Implement `discover()` in `discover.ts`
- [ ] 5.7 Wire `discover()` into `index.ts` (replace TODO stub)
- [ ] 5.8 Run tests → all should pass (TDD green phase)
- [ ] 5.9 Run full verification: `pnpm --filter @a16njs/plugin-a16n test`

### Files to Create/Modify

**Create:**
- `packages/plugin-a16n/src/discover.ts`
- `packages/plugin-a16n/test/discover.test.ts`
- `packages/plugin-a16n/test/fixtures/discover-basic/.a16n/...` (multiple files)
- `packages/plugin-a16n/test/fixtures/discover-nested/.a16n/...`
- `packages/plugin-a16n/test/fixtures/discover-agentskill-io/.a16n/...`
- `packages/plugin-a16n/test/fixtures/discover-unknown-dir/.a16n/...`
- `packages/plugin-a16n/test/fixtures/discover-version-mismatch/.a16n/...`
- `packages/plugin-a16n/test/fixtures/discover-invalid-frontmatter/.a16n/...`
- `packages/plugin-a16n/test/fixtures/discover-empty/.a16n/` (empty dir)

**Modify:**
- `packages/plugin-a16n/src/index.ts` — Replace discover stub, add export

### Acceptance Criteria (from tasks.md)

- AC-9C-3: Unknown type directories skipped with warning ✓
- AC-9C-4: Invalid frontmatter files skipped with warning ✓
- AC-9D-1: Incompatible versions emit `WarningCode.VersionMismatch` ✓
- AC-9D-2: Warning message includes file path and both versions ✓
- AC-9D-3: Items with version mismatch still processed ✓
- AC-9D-4: Invalid version format files skipped ✓

---

## Milestone 6: Discovery Integration & E2E Testing

**Status:** `pending`
**Dependencies:** M4 (CLI wiring), M5 (discover)
**Estimated:** 1 hour

### Scope

Test that the a16n plugin works end-to-end via the engine's convert() function: discover from a16n, convert to cursor/claude, and round-trip. M4 already wired the CLI integration; this milestone focuses on programmatic integration tests.

### Implementation Plan

#### 6.1 Add integration tests to `packages/cli/test/integration/integration.test.ts`

**New test section:**
```
describe('Integration Tests - Phase 9 a16n IR Plugin')
  describe('a16n discovery')
    it('should discover items from .a16n/ directory')
    it('should discover all 6 IR types from .a16n/')
  
  describe('a16n-to-claude conversion')
    it('should convert a16n IR to Claude format')
  
  describe('a16n-to-cursor conversion')
    it('should convert a16n IR to Cursor format')
  
  describe('round-trip: cursor-to-a16n-to-cursor')
    it('should preserve content through cursor → a16n → cursor round-trip')
  
  describe('round-trip: claude-to-a16n-to-claude')
    it('should preserve content through claude → a16n → claude round-trip')
```

#### 6.2 Create integration test fixtures

**Fixture directories under `packages/cli/test/integration/fixtures/`:**

1. **`a16n-basic/from-a16n/`** — Basic `.a16n/` directory for discovery testing
2. **`cursor-to-a16n-basic/from-cursor/`** — Cursor source for round-trip
3. **`claude-to-a16n-basic/from-claude/`** — Claude source for round-trip

#### 6.3 Update engine instantiation in integration tests

Add `a16nPlugin` to the engine constructor:
```typescript
import a16nPlugin from '@a16njs/plugin-a16n';
const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin]);
```

### Tasks Checklist

- [ ] 6.1 Update integration test engine to include a16nPlugin
- [ ] 6.2 Create integration test fixtures for a16n
- [ ] 6.3 Write integration tests (discovery, convert, round-trip)
- [ ] 6.4 Run integration tests → should pass
- [ ] 6.5 Run full monorepo verification: `pnpm build && pnpm test`

### Files to Create/Modify

**Create:**
- `packages/cli/test/integration/fixtures/a16n-basic/from-a16n/.a16n/...`
- `packages/cli/test/integration/fixtures/cursor-to-a16n-basic/from-cursor/...`
- `packages/cli/test/integration/fixtures/claude-to-a16n-basic/from-claude/...`

**Modify:**
- `packages/cli/test/integration/integration.test.ts` — Add a16nPlugin import, new test describe blocks

### Acceptance Criteria

- AC-9C-1: `a16n discover --from a16n .` reads `.a16n/` directory ✓
- AC-9C-2: `a16n convert --to a16n .` writes `.a16n/` directory ✓ (already works from M4)
- AC-9C-5: Round-trip preserves all IR fields ✓

---

## Implementation Order

### Phase 1: M5 - TDD Preparation (Stubbing)
1. Create all fixture directories and files
2. Stub `discover.ts` with empty implementation
3. Stub `discover.test.ts` with all test cases

### Phase 2: M5 - Write Tests
4. Implement all test cases
5. Run tests → all should fail

### Phase 3: M5 - Implementation
6. Implement `discover()` and helpers
7. Wire into `index.ts`
8. Run tests → all should pass

### Phase 4: M6 - Integration
9. Update integration test engine
10. Create integration fixtures
11. Write integration tests
12. Run full verification

---

## Test Infrastructure

### Existing
- `packages/plugin-a16n/test/parse.test.ts` — 27 tests
- `packages/plugin-a16n/test/format.test.ts` — 26 tests
- `packages/plugin-a16n/test/emit.test.ts` — 16 tests
- `packages/cli/test/integration/integration.test.ts` — ~15 tests

### New
- `packages/plugin-a16n/test/discover.test.ts` — ~25 tests
- `packages/cli/test/integration/integration.test.ts` — ~5 new tests (appended)

---

## Verification Commands

```bash
# M5 unit tests
pnpm --filter @a16njs/plugin-a16n test

# M6 integration tests
pnpm --filter a16n test

# Full verification
pnpm build && pnpm test
pnpm lint
pnpm typecheck
```

---

## Background: Phase 9 IR Serialization

**Task ID:** PHASE-9-IR-SERIALIZATION
**Source:** `planning/PHASE_9_SPEC.md`
**Complexity:** Level 4 (Multi-package architectural change)
**Estimated Effort:** ~24 hours across 7 milestones

### Milestone Progress

| Milestone | Status | Actual | PR |
|-----------|--------|--------|-----|
| M1: IR Model Versioning | ✅ Complete | 3h | #32 |
| M2: Plugin Package Setup | ✅ Complete | 15m | #35 |
| M3: Frontmatter Parsing & Formatting | ✅ Complete | 2.5h | #36 |
| M4: IR Emission + CLI Integration | ✅ Complete | 4h | #37 |
| M5: IR Discovery | 🔄 Planning | est. 4h | — |
| M6: E2E Testing | ⏳ Pending | est. 1h | — |
| M7: Integration & Docs | ⏳ Pending | est. 4h | — |

**Total actual so far:** 9.75 hours (M1-M4)
**Remaining estimate:** ~9 hours (M5-M7)
