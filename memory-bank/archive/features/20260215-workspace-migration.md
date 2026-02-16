# TASK ARCHIVE: Migrate Bundled Plugins to Workspace Interface

## METADATA
- **Task ID:** workspace-migration
- **Date Completed:** 2026-02-15
- **Complexity Level:** 3 (Intermediate Feature)

## SUMMARY

Replaced all direct `fs.*` calls (~72 total) across the three bundled plugins (plugin-a16n, plugin-claude, plugin-cursor) with `Workspace` interface methods. Moved `LocalWorkspace` to `@a16njs/models`. All plugins now use `toWorkspace()` at entry points and `ws.read()`, `ws.write()`, `ws.readdir()`, `ws.mkdir()`, `ws.exists()` internally. 807 tests passing, zero regressions.

## REQUIREMENTS

- Replace all `fs.*` calls in plugins with Workspace methods
- Move `LocalWorkspace` to `@a16njs/models` (plugins can't depend on engine)
- Add `toWorkspace()` helper for `string | Workspace` conversion
- Maintain 100% backward compatibility (string args still work)
- Zero regressions across full monorepo test suite

## IMPLEMENTATION

### Phase 0: Infrastructure
- Moved `LocalWorkspace` to `@a16njs/models`, added `toWorkspace()` helper
- Engine re-exports from models for backward compat

### Phase 1: plugin-a16n (11 fs calls)
- Migrated discover.ts, emit.ts, parse.ts
- `parseIRFile` signature changed from 3-arg to 4-arg (workspace parameter)
- 93 tests pass

### Phase 2: plugin-claude (29 fs calls)
- Migrated discover.ts, emit.ts
- Settings.json merge error handling changed from `.code === 'ENOENT'` to string matching
- 114 tests pass

### Phase 3: plugin-cursor (32 fs calls)
- Migrated discover.ts, emit.ts
- Path separator handling simplified to `/` (workspace-relative paths)
- 119 tests pass

### Phase 4: Verification
- 807 tests pass across 8 packages
- Zero `fs/promises` imports remain in any plugin `src/` directory

### Key Decisions
- `toWorkspace(rootOrWorkspace, label)` wraps strings in `LocalWorkspace` automatically
- `WorkspaceEntry` uses boolean properties (`.isFile`, `.isDirectory`) not methods
- `readAgentSkillIO`/`writeAgentSkillIO` keep string-based APIs; plugins bridge via `ws.resolve()`
- `path` import kept where needed for path traversal validation; `fs` fully removed

## TESTING

- 807 tests passing (up from 804 baseline — 3 new tests for toWorkspace/LocalWorkspace)
- Existing tests served as regression oracle — zero modifications needed for plugin-claude and plugin-cursor
- plugin-a16n `parseIRFile` tests updated for new 4-arg signature
- **Gap:** No MemoryWorkspace smoke tests written yet — should be follow-up task

## LESSONS LEARNED

- **Boolean properties vs methods for interfaces:** Decide early when abstracting native APIs. `WorkspaceEntry` chose `.isFile` (boolean) vs `Dirent.isFile()` (method) — easy to miss during migration
- **Forward-slash convention for workspace paths:** Eliminates `path.sep` concerns, simplifies cross-platform
- **Bridge pattern for shared utilities:** When a utility has many consumers, bridging at call site (`ws.resolve()`) is less disruptive than migrating the utility's signature
- **Mechanical migrations benefit from clear mapping tables:** The fs-to-workspace mapping table was the single most useful planning artifact
- **Phase ordering matters:** Smallest plugin first (a16n, 11 calls) establishes pattern before larger plugins (claude 29, cursor 32)

## FUTURE WORK

- Add MemoryWorkspace smoke tests to validate the migration's purpose
- Consider `WorkspaceError` class with structured error codes
- Migrate `readAgentSkillIO`/`writeAgentSkillIO` to accept `Workspace` directly

## REFERENCES

- Reflection: `reflection-workspace-migration.md` (content preserved in this archive)
- Depends on: architectural-redesign (Workspace abstraction component)
