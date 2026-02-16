# Current Task: Migrate Bundled Plugins to Workspace Interface

**Complexity Level:** 3 (Intermediate Feature)
**Status:** Implementation Complete

## Task Lifecycle
- [x] Planning complete
- [x] Creative phases (none required)
- [x] QA validation
- [x] Implementation
- [x] Reflection
- [ ] Archiving

## Reflection Highlights
- **What Went Well**: Clean migration pattern via `toWorkspace()`, zero regressions (807 tests), accurate planning with fs-to-workspace mapping table
- **Challenges**: WorkspaceEntry boolean vs Dirent methods, error handling for Workspace errors (no `.code` property), path separator normalization
- **Lessons Learned**: Boolean props vs methods decided early; forward-slash convention simplifies cross-platform; bridge pattern for shared utilities less disruptive than full migration
- **Next Steps**: Add MemoryWorkspace smoke tests, consider WorkspaceError class, migrate readAgentSkillIO/writeAgentSkillIO to accept Workspace directly

## Context

The architectural redesign (completed) established the `Workspace` interface and updated all plugin signatures to accept `string | Workspace`. However, plugins currently just extract the root string via `resolveRoot()` and continue using direct `fs.*` calls internally. This task completes the migration by replacing all direct `fs` usage with `Workspace` methods inside all three bundled plugins.

**Audit Summary:**
- **plugin-cursor:** 32+ fs calls across discover.ts (12+) and emit.ts (20+), 6 helper functions
- **plugin-claude:** 29+ fs calls across discover.ts (11+) and emit.ts (18+), 5 helper functions
- **plugin-a16n:** 11+ fs calls across discover.ts (5+), emit.ts (5+), parse.ts (1), delegates to models utilities
- **models/agentskills-io.ts:** `readAgentSkillIO()` and `writeAgentSkillIO()` also use direct fs (shared between a16n and potentially other consumers)
- **Total:** ~72+ direct fs calls to migrate

## Strategic Goals

1. **Replace all `fs.*` calls in plugins with `Workspace` methods** — enables MemoryWorkspace testing
2. **Move `LocalWorkspace` to models** — plugins can't depend on engine; models already has fs deps
3. **Update `readAgentSkillIO`/`writeAgentSkillIO` in models** — accept Workspace for a16n plugin
4. **Maintain 100% backward compatibility** — `string` args still work (auto-wrapped in LocalWorkspace)
5. **Zero regressions** — all 804 existing tests must pass

## Workspace Method Mapping

| FS Method | Workspace Method | Notes |
|-----------|------------------|-------|
| `fs.readFile(path, 'utf-8')` | `ws.read(relativePath)` | Workspace always returns UTF-8 |
| `fs.writeFile(path, content)` | `ws.write(relativePath, content)` | Also creates parent dirs |
| `fs.readdir(path, {withFileTypes})` | `ws.readdir(relativePath)` | Returns `WorkspaceEntry[]` not `Dirent[]` |
| `fs.mkdir(path, {recursive})` | `ws.mkdir(relativePath)` | Always recursive |
| `fs.access(path)` | `ws.exists(relativePath)` | Returns boolean instead of throwing |
| `fs.stat(path)` | `ws.exists()` + `ws.readdir()` | Only 1 call in a16n; can be replaced |

**Key difference:** All `Workspace` paths are **relative to workspace root**. Plugins currently join `root + relativePath` manually — workspace handles this internally.

## Architecture Decision: LocalWorkspace Placement

**Decision:** Move `LocalWorkspace` to `@a16njs/models`

**Rationale:**
- Plugins depend on models, not engine
- Plugins need to create `LocalWorkspace` when receiving a `string` argument (backward compat)
- Models already has `fs/promises` dependency via `agentskills-io.ts`
- Engine re-exports `LocalWorkspace` from models (backward compat for engine consumers)

## Implementation Phases

### Phase 0: Infrastructure — Move LocalWorkspace to Models
**Goal:** Enable plugins to create LocalWorkspace without engine dependency

**Tasks:**
- [ ] Move `LocalWorkspace` class from `engine/src/workspace.ts` to `models/src/workspace.ts`
- [ ] Update `models/src/index.ts` to export `LocalWorkspace`
- [ ] Update `engine/src/workspace.ts` to import and re-export `LocalWorkspace` from models
- [ ] Add `toWorkspace(rootOrWorkspace: string | Workspace): Workspace` helper to models
- [ ] Verify all 804 existing tests still pass
- [ ] Build clean across monorepo

### Phase 1: Plugin-A16N (simplest, 11 fs calls)
**Goal:** Migrate a16n plugin internals to Workspace — smallest plugin, proves the pattern

#### Phase 1a: Update models utilities
- [ ] Update `readAgentSkillIO(skillDir: string)` → `readAgentSkillIO(skillDirOrWorkspace: string | Workspace, relativePath?: string)`
- [ ] Update `writeAgentSkillIO(outputDir: string, ...)` → `writeAgentSkillIO(workspace: string | Workspace, relativePath: string, ...)`
- [ ] Add Workspace-based tests for both functions
- [ ] Existing tests still pass

#### Phase 1b: Migrate a16n discover.ts
- [ ] Replace `resolveRoot()` with `toWorkspace()` at entry point
- [ ] Migrate `fs.stat()` call (check .a16n exists) to `ws.exists()`
- [ ] Migrate `fs.readdir()` calls to `ws.readdir()`
- [ ] Update `findMdFiles()` helper to accept `Workspace`
- [ ] Update `discoverStandardType()` to use workspace
- [ ] Update `discoverAgentSkillIO()` to use workspace
- [ ] Pass workspace to `readAgentSkillIO()` calls
- [ ] Remove `import * as fs` from discover.ts

#### Phase 1c: Migrate a16n emit.ts
- [ ] Replace `resolveRoot()` with `toWorkspace()` at entry point
- [ ] Migrate `pathExists()` helper to use `ws.exists()`
- [ ] Migrate `emitStandardIR()` to use `ws.mkdir()` and `ws.write()`
- [ ] Pass workspace to `writeAgentSkillIO()` calls
- [ ] Remove `import * as fs` from emit.ts

#### Phase 1d: Migrate a16n parse.ts
- [ ] Update `parseIRFile()` to accept `Workspace` parameter
- [ ] Migrate `fs.readFile()` to `ws.read()`
- [ ] Remove `import * as fs` from parse.ts

**Quality Gate:** All a16n tests (93) pass, zero regressions across monorepo

### Phase 2: Plugin-Claude (29 fs calls)
**Goal:** Migrate claude plugin — medium complexity

#### Phase 2a: Migrate claude discover.ts
- [ ] Replace `resolveRoot()` with `toWorkspace()` at entry point
- [ ] Migrate `findClaudeRules(root)` → `findClaudeRules(ws)` — recursive readdir
- [ ] Migrate `findSkillDirs(root)` → `findSkillDirs(ws)` — readdir + exists
- [ ] Migrate `readSkillFiles(skillDir)` → `readSkillFiles(ws, relativePath)` — recursive read
- [ ] Migrate `findClaudeFiles(root)` → `findClaudeFiles(ws)` — recursive readdir
- [ ] Migrate `discoverAgentIgnore(root)` → uses ws.read for settings.json
- [ ] Remove `import * as fs` from discover.ts

#### Phase 2b: Migrate claude emit.ts
- [ ] Replace `resolveRoot()` with `toWorkspace()` at entry point
- [ ] Migrate all `fs.mkdir()` + `fs.writeFile()` to `ws.mkdir()` + `ws.write()`
- [ ] Migrate all `fs.access()` (isNewFile checks) to `ws.exists()`
- [ ] Migrate `fs.readFile()` for settings.json merge to `ws.read()`
- [ ] Migrate `emitAgentSkillIO()` to use workspace
- [ ] Remove `import * as fs` from emit.ts

**Quality Gate:** All claude tests (114) pass, zero regressions across monorepo

### Phase 3: Plugin-Cursor (32 fs calls)
**Goal:** Migrate cursor plugin — most complex (most helpers, most fs calls)

#### Phase 3a: Migrate cursor discover.ts
- [ ] Replace `resolveRoot()` with `toWorkspace()` at entry point
- [ ] Migrate `findMdcFiles(rulesDir, relativePath)` → `findMdcFiles(ws, relativePath)` — recursive readdir
- [ ] Migrate `findCommandFiles(commandsDir, relativePath)` → `findCommandFiles(ws, relativePath)`
- [ ] Migrate `findSkillDirs(root)` → `findSkillDirs(ws)` — readdir + exists
- [ ] Migrate `readSkillFiles(skillDir)` → `readSkillFiles(ws, relativePath)` — recursive read
- [ ] Migrate `discoverCommands(root)` → uses workspace for read
- [ ] Migrate `discoverSkills(root)` → uses workspace for read
- [ ] Migrate `discoverCursorIgnore(root)` → uses ws.read
- [ ] Remove `import * as fs` from discover.ts

#### Phase 3b: Migrate cursor emit.ts
- [ ] Replace `resolveRoot()` with `toWorkspace()` at entry point
- [ ] Migrate all `fs.mkdir()` + `fs.writeFile()` to `ws.mkdir()` + `ws.write()`
- [ ] Migrate all `fs.access()` (isNewFile checks) to `ws.exists()`
- [ ] Migrate `emitAgentSkillIO()` to use workspace
- [ ] Remove `import * as fs` from emit.ts

**Quality Gate:** All cursor tests (119) pass, zero regressions across monorepo

### Phase 4: Verification & Cleanup
**Goal:** Ensure everything works together

- [ ] Run full monorepo build
- [ ] Run full monorepo test suite (804+ tests)
- [ ] Verify no `import * as fs` remains in any plugin source file
- [ ] Verify all plugins work with MemoryWorkspace (add smoke tests)
- [ ] Update memory-bank/progress.md

## Test Strategy

### Existing Tests (Zero Regressions)
- All 804 existing tests must continue to pass
- Existing tests use real filesystem — they exercise LocalWorkspace implicitly

### New Tests
- **models:** Workspace-based `readAgentSkillIO` / `writeAgentSkillIO` tests
- **Each plugin:** At least 1 MemoryWorkspace smoke test per plugin proving workspace abstraction works

### TDD Process
- For Phase 0 and Phase 1a (new interfaces): stub tests first, then implement
- For Phase 1b-3b (mechanical migration): existing tests serve as regression tests; migration is behavioral-preserving

## Dependencies

```
Phase 0 (LocalWorkspace to models) → Phase 1 (a16n) → Phase 2 (claude) → Phase 3 (cursor) → Phase 4 (verify)
```

Phase 1a (models utilities) must complete before Phase 1b-1d (a16n plugin).
Phases 2 and 3 are independent of each other but both depend on Phase 0.

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Recursive traversal behavior differs | Medium | Medium | Use existing integration tests as oracle; test edge cases |
| readAgentSkillIO/writeAgentSkillIO API change breaks consumers | High | Low | Maintain backward compat with union types |
| WorkspaceEntry vs Dirent incompatibility | Low | Low | WorkspaceEntry has same isFile/isDirectory fields |
| Path normalization differences | Medium | Medium | Workspace always uses relative paths; validate edge cases |
| dryRun handling changes | Medium | Low | ReadOnlyWorkspace already blocks writes; emit tests cover this |
