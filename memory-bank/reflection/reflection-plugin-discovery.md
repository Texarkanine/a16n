# Reflection: Plugin Auto-Discovery

**Task:** Implement auto-discovery of `a16n-plugin-*` packages in `@a16njs/engine` and wire into CLI
**Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)
**Complexity:** Level 3 (Feature)
**Status:** Phases 1-4 Complete, Phase 5 Blocked (cross-repo dependency)

## Summary

Added a plugin auto-discovery system to `@a16njs/engine` that scans `node_modules` directories for packages matching `a16n-plugin-*`, dynamically imports them, validates their exports against the `A16nPlugin` interface, and registers valid ones. The engine's internal plugin map was refactored to track `source: 'bundled' | 'installed'` per plugin, with bundled plugins taking precedence in conflicts. The CLI now calls `engine.discoverAndRegisterPlugins()` on startup.

**Files changed:** 2 new, 3 modified. **Tests:** 23 new tests added, 187 total passing, zero regressions.

## What Went Well

1. **TDD process was smooth.** The stub-first approach (1a/1b) made the red phase (1c) and green phase (1d) straightforward. Each phase had clear boundaries and a clean red-to-green transition.

2. **Internal refactor was transparent.** Changing the plugins map from `Map<string, A16nPlugin>` to `Map<string, { plugin, source }>` touched several methods, but all 131 existing CLI tests passed without modification. Good encapsulation in the engine API.

3. **Plan quality was high.** The implementation followed the plan almost exactly as written. All design decisions from the creative phase (Option B for path walking, explicit async method, runtime validation) were implemented as specified.

4. **Test design using real ESM packages.** Rather than mocking `import()`, the tests create actual ESM packages in temp directories with `package.json` + `index.js`. This tests the real dynamic import path and caught potential issues with `pathToFileURL()` that mocks would have missed.

5. **CLI integration was minimal.** Only 3 lines changed in the CLI — wrapping the startup block in an async IIFE and adding the discovery call. The existing `plugins` and `convert` commands needed zero changes.

## Challenges

1. **Dynamic import of absolute paths.** Node's `import()` requires `file://` URLs for absolute paths, not raw filesystem paths. Solved with `pathToFileURL()` from `node:url`. This would have been a subtle cross-platform bug without the real-ESM-package test approach.

2. **No `npm root -g` fallback implemented.** The plan mentioned falling back to `npm root -g` if path walking fails, but the implementation only uses path walking + cwd. This is a conscious simplification — the fallback would add subprocess overhead and the path walking approach covers the standard npm layout. Worth revisiting if users report issues with non-standard installs.

## Lessons Learned

1. **Testing dynamic imports requires real packages, not mocks.** Creating real ESM packages in temp dirs was more work upfront but caught the `pathToFileURL` requirement immediately. Mock-based tests would have given false confidence.

2. **Source tracking was pre-typed but unused.** The `PluginInfo.source` field was already typed as `'bundled' | 'installed'` but hardcoded to `'bundled'`. This is a good pattern — typing future fields early reduces the refactor surface when they're actually needed.

3. **Async IIFE for CLI startup is clean.** Rather than refactoring the entire CLI entry point, wrapping `isDirectRun` in `(async () => { ... })()` was minimal and non-disruptive.

## Process Improvements

1. **Phase 5 should have been flagged as blocked earlier in planning.** The cross-repo integration test depends on `a16n-plugin-cursorrules` being buildable, which is parallel work. This dependency should be called out more prominently during planning so expectations are set upfront.

2. **Consider adding a "discovery dry-run" CLI flag.** For debugging, something like `a16n plugins --verbose` that shows which search paths were scanned and what was found/skipped/errored would be valuable. Not needed now, but worth noting for future enhancement.

## Technical Notes

- `getDefaultSearchPaths()` walks up from `import.meta.url` to find the nearest `node_modules` ancestor. This works in monorepo dev (workspace `node_modules`) and global installs.
- Plugin validation is intentionally lenient — it only checks the 5 structural fields. It does not attempt to call `discover()` or `emit()` during validation.
- The `discoverAndRegisterPlugins` result type (`DiscoverAndRegisterResult`) is exported for consumers who want to inspect what was found.
- All discovery types are re-exported from `@a16njs/engine` for convenience.

## Next Steps

- Phase 5: Cross-repo integration test with `a16n-plugin-cursorrules` (when available)
- Consider `--verbose` output for discovery results in CLI
- Monitor for issues with non-standard npm directory layouts
