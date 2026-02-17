# Reflection: Third-Party Plugin Discovery Wiring

**Task ID:** plugin-discovery-wiring
**Date:** 2026-02-17
**Complexity:** Level 1 (two small fixes)
**Branch:** plugin-disco-very-much

## Summary

Two bugs prevented third-party plugin auto-discovery from working:
1. The CLI never called `engine.discoverAndRegisterPlugins()` — the infrastructure existed in the engine but was never wired into the CLI entry point.
2. `getDefaultSearchPaths()` couldn't find the global `node_modules` when the engine was symlinked via `npm link`, because `import.meta.url` resolves through symlinks to the real monorepo path.

## What Went Well

- **External reviewer's diagnosis was accurate** — saved significant investigation time. Trusting external input and verifying against code was the right approach.
- **Incremental TDD worked cleanly** — each fix was a single, testable change. The first fix's integration test (fake plugin in `cwd/node_modules`) confirmed the wiring. The second fix's unit tests (stubbing `process.argv[1]` with a fake PREFIX structure) confirmed the path resolution.
- **The existing architecture was well-designed** — `PluginDiscoveryOptions.searchPaths`, `PluginLoader`, conflict resolution, and the registry were all already built and tested. The gap was purely at the integration/wiring layer.
- **Manual verification confirmed end-to-end** — `a16n plugins` now shows the `cursorrules` third-party plugin.

## Challenges

- **Understanding `import.meta.url` symlink behavior** — Node.js ESM resolves `import.meta.url` through symlinks to the real path. This is the root cause of the second bug: in an `npm link` setup, the engine thinks it lives in the monorepo, not in global `node_modules`. Required tracing through the path resolution logic to confirm.
- **Choosing the right detection heuristic** — Multiple approaches were possible (spawn `npm root -g`, read env vars, use `process.execPath`, use `process.argv[1]`). The `argv[1]`-based approach won because it's synchronous, subprocess-free, and reliable when the binary is in a `bin/` directory.

## Lessons Learned

- **Symlinked installs break `import.meta.url`-based path resolution** — any code that walks up from `import.meta.url` to find its own package tree needs a fallback for the `npm link` case.
- **`process.argv[1]` preserves the symlink path** — unlike `import.meta.url`, Node doesn't resolve `argv[1]` through symlinks. This makes it useful for finding where the binary was *invoked from* rather than where it *physically lives*.
- **Archive docs can lie** — the archive doc (`20260215-plugin-discovery.md`) claimed the CLI already called `discoverAndRegisterPlugins()`. Always verify claims against the actual source.

## Files Modified

| File | Change |
|------|--------|
| `packages/cli/src/index.ts:147` | Added `await engine.discoverAndRegisterPlugins()` |
| `packages/engine/src/plugin-discovery.ts` | Added `getGlobalNodeModulesFromArgv1()` helper, called from `getDefaultSearchPaths()` |
| `packages/cli/test/cli.test.ts` | Added integration test for third-party plugin discovery |
| `packages/engine/test/plugin-discovery.test.ts` | Added 7 tests for `getGlobalNodeModulesFromArgv1` and argv1-aware `getDefaultSearchPaths` |

## Process Improvements

- When building discovery/auto-registration infrastructure, always wire it into the entry point in the same PR. Infrastructure without integration is invisible.
- When testing path resolution logic, always test the `npm link` / symlink case — it's a common developer workflow that breaks `import.meta.url` assumptions.

## Technical Notes

- The `getGlobalNodeModulesFromArgv1()` helper checks `PREFIX/lib/node_modules` (Unix) first, then falls back to `PREFIX/node_modules` (Windows).
- The `bin/` directory basename guard prevents false positives when the script is run directly (e.g., `node ./dist/index.js`).
- Pre-existing timeout failures in `packages/glob-hook/test/cli.test.ts` (12 tests) are unrelated to this change.
