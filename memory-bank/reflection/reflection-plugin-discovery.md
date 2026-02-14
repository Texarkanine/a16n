# Reflection: Plugin Auto-Discovery

**Task:** Implement auto-discovery of `a16n-plugin-*` packages in `@a16njs/engine` and wire into CLI
**Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)
**Complexity:** Level 3 (Feature)
**Status:** All 5 Phases Complete

## Summary

Added a plugin auto-discovery system to `@a16njs/engine` that scans `node_modules` directories for packages matching `a16n-plugin-*`, dynamically imports them, validates their exports against the `A16nPlugin` interface, and registers valid ones. The engine's internal plugin map was refactored to track `source: 'bundled' | 'installed'` per plugin, with bundled plugins taking precedence in conflicts. The CLI now calls `engine.discoverAndRegisterPlugins()` on startup.

Phase 5 (cross-repo integration with `a16n-plugin-cursorrules`) was completed and revealed two bugs in the discovery module that were fixed with tests.

**Files changed:** 2 new, 3 modified (Phases 1-4), plus 1 modified with bug fixes (Phase 5). **Tests:** 26 new tests added (20 discovery + 6 engine), 694 total passing across all packages, zero regressions.

## What Went Well

1. **TDD process was smooth.** The stub-first approach (1a/1b) made the red phase (1c) and green phase (1d) straightforward. Each phase had clear boundaries and a clean red-to-green transition.

2. **Internal refactor was transparent.** Changing the plugins map from `Map<string, A16nPlugin>` to `Map<string, { plugin, source }>` touched several methods, but all 131 existing CLI tests passed without modification. Good encapsulation in the engine API.

3. **Plan quality was high.** The implementation followed the plan almost exactly as written. All design decisions from the creative phase (Option B for path walking, explicit async method, runtime validation) were implemented as specified.

4. **Test design using real ESM packages.** Rather than mocking `import()`, the tests create actual ESM packages in temp directories with `package.json` + `index.js`. This tests the real dynamic import path and caught potential issues with `pathToFileURL()` that mocks would have missed.

5. **CLI integration was minimal.** Only 3 lines changed in the CLI — wrapping the startup block in an async IIFE and adding the discovery call. The existing `plugins` and `convert` commands needed zero changes.

6. **Phase 5 cross-repo integration was valuable.** Testing with a real plugin (`a16n-plugin-cursorrules`) immediately uncovered two bugs that the unit tests missed because they used simplified package layouts. This validates the importance of integration testing.

## Challenges

1. **Dynamic import of absolute paths.** Node's `import()` requires `file://` URLs for absolute paths, not raw filesystem paths. Solved with `pathToFileURL()` from `node:url`. This would have been a subtle cross-platform bug without the real-ESM-package test approach.

2. **No `npm root -g` fallback implemented.** The plan mentioned falling back to `npm root -g` if path walking fails, but the implementation only uses path walking + cwd. This is a conscious simplification — the fallback would add subprocess overhead and the path walking approach covers the standard npm layout. Worth revisiting if users report issues with non-standard installs.

3. **Hardcoded `index.js` entry point (Bug #1, found in Phase 5).** The discovery code assumed all plugins have their entry point at the package root as `index.js`. Real packages like `a16n-plugin-cursorrules` use `"main": "./dist/index.js"` in `package.json`. Fixed by adding `resolvePluginEntry()` that reads the `main` field, falling back to `index.js`. The unit tests all used root-level `index.js`, so this was invisible until a real package was tested.

4. **`getDefaultSearchPaths()` didn't work in monorepo layout (Bug #2, found in Phase 5).** The function walked up from `import.meta.url` looking for a `node_modules` **parent** directory — which works for global installs (engine is *inside* `node_modules`) but fails in a monorepo (engine is at `packages/engine/dist/`, no parent named `node_modules`). It only worked during development because `cwd` happened to be the monorepo root. Fixed to also check for `node_modules` as a **child** directory at each ancestor level, collecting all matches rather than stopping at the first.

5. **pnpm link vs npm link.** The monorepo uses pnpm, so `npm link` at the root fails. Required `pnpm link <absolute-path>` at the monorepo root. Additionally, `pnpm link` in a sub-package (`packages/cli`) only puts the symlink in that package's `node_modules`, which is the wrong search path for the engine's discovery.

## Lessons Learned

1. **Unit tests with simplified fixtures miss real-world package layouts.** All 17 discovery tests passed with packages that had `index.js` at root and no subdirectory structure. The Phase 5 integration immediately found two bugs. Lesson: when testing a plugin loader, at least one test should use a realistic package layout (with `"main": "./dist/index.js"`).

2. **Testing dynamic imports requires real packages, not mocks.** Creating real ESM packages in temp dirs was more work upfront but caught the `pathToFileURL` requirement immediately. Mock-based tests would have given false confidence.

3. **Source tracking was pre-typed but unused.** The `PluginInfo.source` field was already typed as `'bundled' | 'installed'` but hardcoded to `'bundled'`. This is a good pattern — typing future fields early reduces the refactor surface when they're actually needed.

4. **Async IIFE for CLI startup is clean.** Rather than refactoring the entire CLI entry point, wrapping `isDirectRun` in `(async () => { ... })()` was minimal and non-disruptive.

5. **`getDefaultSearchPaths()` needs to handle both monorepo and global install layouts.** The original "walk up to find `node_modules` parent" assumption was too narrow. The fix (also check for `node_modules` child at each level, collect all) handles both cases and is more robust. The previous reflection noted this function "works in monorepo dev" — this was only true when `cwd` was the monorepo root, which masked the bug.

6. **pnpm monorepo linking has specific behaviors.** `pnpm link` at the monorepo root puts the symlink in root `node_modules`, which is correct. Sub-package linking puts it in that package's `node_modules`, which may not be on the discovery search path. For development workflows, root-level linking is the correct approach.

## Process Improvements

1. **Add at least one "realistic package layout" test to the discovery suite.** The three new tests added in Phase 5 (dist/index.js entry, no main field fallback, no package.json fallback) should have been part of the original test plan.

2. **Consider adding a "discovery dry-run" CLI flag.** For debugging, something like `a16n plugins --verbose` that shows which search paths were scanned and what was found/skipped/errored would be valuable. Not needed now, but worth noting for future enhancement.

3. **Phase 5 should have been flagged as blocked earlier in planning.** The cross-repo integration test depends on `a16n-plugin-cursorrules` being buildable, which is parallel work. This dependency should be called out more prominently during planning so expectations are set upfront.

4. **Cross-repo integration should be a non-negotiable gate.** The two bugs found in Phase 5 were significant — without them, the plugin system would not work with any real third-party plugin. Integration testing should be treated as mandatory, not optional.

## Technical Notes

- `getDefaultSearchPaths()` now walks up from `import.meta.url` checking for both `node_modules` ancestors (global install) and `node_modules` children (monorepo). It collects all matches rather than stopping at the first, then adds `cwd/node_modules` if not already included.
- `resolvePluginEntry()` reads `main` from `package.json`, falling back to `index.js`. This handles real-world packages with `dist/` output directories.
- Plugin validation is intentionally lenient — it only checks the 5 structural fields. It does not attempt to call `discover()` or `emit()` during validation.
- The `discoverAndRegisterPlugins` result type (`DiscoverAndRegisterResult`) is exported for consumers who want to inspect what was found.
- All discovery types are re-exported from `@a16njs/engine` for convenience.
- `statSync` from `node:fs` is used in `getDefaultSearchPaths()` (synchronous function) to check for `node_modules` directories.

## Next Steps

- Consider `--verbose` output for discovery results in CLI
- Monitor for issues with non-standard npm directory layouts
- Consider adding Windows-native (non-WSL) CI testing for path resolution
- Document the `pnpm link` workflow for plugin developers
