# Progress

## Task: Plugin Auto-Discovery

### Completed
- [x] Research: Current plugin registration (hard-coded imports in CLI)
- [x] Research: Engine API (PluginInfo already has `source` field typed)
- [x] Research: Existing plugin structure (cursor, claude, a16n)
- [x] Design: Discovery mechanism (scan search paths for `a16n-plugin-*`)
- [x] Design: Engine API changes (discoverAndRegisterPlugins, source tracking)
- [x] Design: CLI integration (async startup, call discovery after construction)
- [x] Plan: Full implementation plan with TDD phases
- [x] Phase 1: Plugin discovery module — `plugin-discovery.ts` + 17 tests
- [x] Phase 2: Engine API changes — source tracking, `discoverAndRegisterPlugins()` + 6 new tests
- [x] Phase 3: CLI integration — async IIFE, discovery on startup
- [x] Phase 4: Verification — build, typecheck, 187 tests pass (56 engine + 131 CLI)

### Not Started
- [ ] Phase 5: Cross-repo integration test (requires a16n-plugin-cursorrules)

### Blocked
- [ ] Phase 5 depends on a16n-plugin-cursorrules being buildable (parallel work)

### Observations
- `getDefaultSearchPaths()` walks up from `import.meta.url` to find the nearest `node_modules` ancestor — this works in both monorepo dev (finds the workspace `node_modules`) and global installs
- Dynamic `import()` requires `pathToFileURL()` for absolute paths on all platforms
- The `isValidPlugin()` type guard checks all 5 required fields: id, name, supports, discover, emit
- All existing tests (engine + CLI) pass without modification — the internal refactor from `Map<string, A16nPlugin>` to `Map<string, {plugin, source}>` is fully transparent to callers
