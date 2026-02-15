# Reflection: Phase 1 - Plugin Registry

**Task ID:** ARCH-M2
**Date:** 2026-02-15
**Complexity:** Level 4 (Phase 1 of 6)
**Status:** Complete

---

## Summary

Phase 1 replaced the dual-Map pattern (`plugins: Map<string, A16nPlugin>` + `pluginSources: Map<string, 'bundled' | 'installed'>`) with a unified `PluginRegistry` class backed by a single `Map<string, PluginRegistration>`. The `A16nEngine` was refactored to delegate all plugin storage and lookup to the registry. All 80 tests pass (21 new + 59 existing), TypeScript compiles clean, and the public API is unchanged.

---

## What Went Well

### 1. TDD Worked Exactly as Designed
The strict red-green cycle was textbook:
- **Red:** 21 tests written, all failing with `Error: Not implemented` from stub methods
- **Green:** Implementation filled in, all 21 tests passing on first attempt
- **Refactor:** Integrated into `A16nEngine`, zero regressions in existing 59 tests

The stub-first approach forced clear thinking about the API surface before any implementation. Every method signature was locked down by tests before writing a line of production code.

### 2. Minimal Surface Area
The `PluginRegistry` class is 123 lines including JSDoc. It wraps a single `Map` with typed accessors. No over-engineering, no lifecycle hooks (yet), no event system. The design follows the plan's "start simple" principle.

### 3. Zero-Regression Integration
Swapping the engine internals from dual Maps to `PluginRegistry` required changing only 4 methods in `A16nEngine`:
- `registerPlugin()` - one line: `this.registry.register({ plugin, source })`
- `discoverAndRegisterPlugins()` - changed `this.plugins.has()` to `this.registry.has()`
- `listPlugins()` - changed from manual Map iteration to `this.registry.list().map()`
- `getPlugin()` - changed from `this.plugins.get()` to `this.registry.getPlugin()`

The `convert()` and `discover()` methods didn't change at all because they only call `getPlugin()`.

### 4. Clean Separation
`PluginRegistry` has no dependency on `A16nEngine`. It only imports `A16nPlugin` from `@a16njs/models`. This means Phase 2 (PluginLoader) can depend on the registry without pulling in the engine.

---

## Challenges

### 1. Deciding What NOT to Include
The creative phase document described potential lifecycle hooks (`onRegister`, `onConflict`), but Phase 1 correctly deferred these. The temptation to add them was real since the code was right there, but the plan was clear: registry is data storage first, behavior later.

### 2. `PluginRegistrationInput` vs `PluginRegistration`
The `Omit<PluginRegistration, 'registeredAt'>` pattern was the right call. Callers shouldn't set `registeredAt` (the registry owns the timestamp), but the stored type should include it. The `Omit` utility type makes this clean without a separate interface that could drift.

---

## Lessons Learned

### 1. Dual Maps Are a Code Smell
Any time you see `Map<K, V1>` and `Map<K, V2>` with the same key type, they should be `Map<K, { v1: V1, v2: V2 }>`. This was documented as a problem in the creative phase, and fixing it was trivially easy - which confirms it should have been done earlier. The lesson: when you add a second parallel data structure, stop and refactor to a single one.

### 2. Test Count Aligns with API Surface
21 tests for 8 methods + 1 getter = ~2.6 tests per method. This feels right for a data-oriented class. Each method gets a "happy path" test and an "edge case" test (empty/undefined/overwrite). More complex classes with branching logic would need more tests per method.

### 3. Integration is the Real Test
The 21 registry unit tests gave confidence that the class worked in isolation. But the real validation was running the existing 59 engine tests after the integration. Unit tests prove correctness; integration tests prove compatibility.

---

## Process Observations

### TDD Overhead
For this component, TDD added ~5 minutes of overhead (writing stubs, running the red phase). The payoff was immediate: zero bugs in the implementation, zero regressions. For a data-oriented class like `PluginRegistry`, the overhead is low and the confidence gain is high.

### Phase Gating Works
The plan specified "do NOT proceed to next phase until all tests pass." This was naturally enforced by the TDD cycle. There was never a moment where I needed to decide whether to move on - the tests made the answer binary.

---

## Technical Observations for Future Phases

### 1. `PluginRegistry` is Ready for Phase 2
The `PluginLoader` (Phase 2) will need `registry.has()` for conflict detection and `registry.register()` for the registration phase. Both are tested and working. The `resolveConflicts()` method in the loader will accept a `PluginRegistry` as input - clean dependency direction.

### 2. `listPlugins()` Could Be Simplified Later
Currently `A16nEngine.listPlugins()` maps `PluginRegistration` to `PluginInfo`. In a future cleanup, we could expose `PluginRegistration` directly (it has all the same fields plus more). But this is a breaking API change, so it's correctly deferred.

### 3. The `convert()` Method is Untouched
Phase 1 didn't modify `convert()` at all. The hardcoded plugin knowledge (cursor/claude path prefixes) and double-emission are still there. These are Phase 4 (Transformation Pipeline) concerns. This confirms the dependency graph: registry is foundation, transformations come later.

---

## Metrics

| Metric | Value |
|--------|-------|
| New files | 2 (plugin-registry.ts, plugin-registry.test.ts) |
| Modified files | 1 (index.ts) |
| New test count | 21 |
| Total test count after | 80 |
| Regressions | 0 |
| Lines of production code | 123 |
| Lines of test code | 243 |
| Test:code ratio | ~2:1 |
| Build status | Clean |

---

## Next Steps

**Phase 2: Plugin Loader System** is next on the critical path. It depends on the registry (complete) and will:
1. Extract conflict resolution from `A16nEngine.discoverAndRegisterPlugins()`
2. Create `PluginConflictStrategy` enum
3. Create `PluginLoader` class with `loadInstalled()` and `resolveConflicts()` methods
4. Refactor engine to use the loader

Phase 3 (Workspace) can run in parallel with Phase 2 since it only depends on the registry.
