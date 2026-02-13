# Current Task: Plugin Auto-Discovery

**Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54) (enabling requirement)
**Status:** Implementation Complete, Reflection Done — Phase 5 Pending (cross-repo)

## Context

The plugin framework documentation claims auto-discovery of `a16n-plugin-*` packages, but it's not implemented. Plugins are currently hard-coded imports in the CLI. This task implements the auto-discovery mechanism in `@a16njs/engine` and wires it into `@a16njs/cli`.

## Design Decisions (Resolved)

1. **Location:** Auto-discovery lives in `@a16njs/engine` so anyone using the engine gets plugin support
2. **Toggle:** Discovery is an explicit `await engine.discoverAndRegisterPlugins()` call — callers opt in
3. **Source tracking:** Engine tracks `source: 'bundled' | 'installed'` per plugin (already typed in `PluginInfo`)
4. **Conflict resolution:** Bundled plugins take precedence — if an installed plugin has the same ID as a bundled one, it's skipped
5. **Validation:** Invalid plugin packages are skipped with a warning, never crash the CLI
6. **Dependency strategy for third-party plugins:** `peerDependencies` on `@a16njs/models` (see a16n-plugin-cursorrules creative doc)

## Implementation Checklist

### Phase 1: Engine — Plugin Discovery Module (TDD)

#### 1a. Stub Tests
- [x] `packages/engine/test/plugin-discovery.test.ts` — stub test suites

#### 1b. Stub Interfaces
- [x] `packages/engine/src/plugin-discovery.ts` — stub with interfaces and empty functions

#### 1c. Implement Tests
- [x] Fill out all test implementations (mock filesystem with temp dirs + real ESM packages)
- [x] Run tests — 8 failed as expected (red phase)

#### 1d. Implement Discovery
- [x] `discoverInstalledPlugins()`: scans search paths, dynamic import, validates
- [x] `getDefaultSearchPaths()`: walks up from `import.meta.url` + cwd node_modules
- [x] `isValidPlugin()`: checks id, name, supports, discover, emit
- [x] Run tests — all 17 PASS

### Phase 2: Engine — API Changes (TDD)

#### 2a. Modify Engine Tests
- [x] Added `source tracking` describe block (3 tests)
- [x] Added `discoverAndRegisterPlugins` describe block (3 tests)
- [x] Run tests — 4 new tests failed as expected (red phase)

#### 2b. Modify Engine
- [x] Changed internal `plugins` map: `Map<string, { plugin, source }>`
- [x] Updated `registerPlugin(plugin, source = 'bundled')`
- [x] Updated `listPlugins()` to use stored source
- [x] Updated `getPlugin()` to unwrap from new structure
- [x] Added `discoverAndRegisterPlugins(options?)` method
- [x] Exported `DiscoverAndRegisterResult` type
- [x] Re-exported discovery types from `plugin-discovery.ts`
- [x] Run all engine tests — all 56 PASS

### Phase 3: CLI Integration

#### 3a. Modify CLI
- [x] Made `isDirectRun` block async with IIFE
- [x] Added `await engine.discoverAndRegisterPlugins()` after engine construction
- [x] `plugins` and `convert` commands: no changes needed

### Phase 4: Verification

- [x] `npm run build` passes for engine and cli
- [x] `npm run typecheck` passes for engine and cli
- [x] `npm run test` passes: engine (56 tests), cli (131 tests)
- [x] Zero regressions

### Phase 5: Cross-Repo Integration Test

- [ ] In a16n-plugin-cursorrules: `npm link`
- [ ] In a16n: `npm link a16n-plugin-cursorrules`
- [ ] Verify: `a16n plugins` shows `cursorrules` with `source: installed`
- [ ] Verify: `a16n convert --from cursorrules --to cursor <fixture>` works
- [ ] Verify: `a16n convert --from cursor --to cursorrules <fixture>` gracefully reports unsupported
- [ ] Document any framework issues discovered and fix them

## Components

| Component | File | Change Type | Purpose |
|-----------|------|------------|---------|
| Plugin discovery | `packages/engine/src/plugin-discovery.ts` | NEW | Core discovery logic |
| Engine class | `packages/engine/src/index.ts` | MODIFY | Source tracking, discoverAndRegisterPlugins() |
| CLI entry | `packages/cli/src/index.ts` | MODIFY | Call discovery on startup |
| Discovery tests | `packages/engine/test/plugin-discovery.test.ts` | NEW | Discovery unit tests |
| Engine tests | `packages/engine/test/engine.test.ts` | MODIFY | Updated for new API |

## Risk Notes

- Dynamic `import()` resolution in global installs may behave differently across npm/node versions
- Plugin validation must be defensive — a bad third-party plugin should never crash the CLI
- The `import.meta.url`-based path resolution needs testing on Windows (WSL ok, native Windows TBD)
- If `npm root -g` is slow, consider caching or using `import.meta.url` path walking instead
