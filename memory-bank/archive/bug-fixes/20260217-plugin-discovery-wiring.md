---
task_id: plugin-discovery-wiring
complexity_level: 1
date: 2026-02-17
status: completed
---

# TASK ARCHIVE: Third-Party Plugin Discovery Wiring

## SUMMARY

Two bugs prevented third-party plugin auto-discovery from working: (1) the CLI never called `engine.discoverAndRegisterPlugins()` even though the infrastructure existed in the engine; (2) `getDefaultSearchPaths()` couldn't find the global `node_modules` when the engine was symlinked via `npm link`, because `import.meta.url` resolves through symlinks to the real monorepo path. Both were fixed; `a16n plugins` now shows the cursorrules third-party plugin.

## REQUIREMENTS

- Wire CLI entry point to call `engine.discoverAndRegisterPlugins()`.
- Make plugin search paths work when the engine is symlinked (e.g. `npm link`) so global `node_modules` is found.

## IMPLEMENTATION

| File | Change |
|------|--------|
| `packages/cli/src/index.ts:147` | Added `await engine.discoverAndRegisterPlugins()` |
| `packages/engine/src/plugin-discovery.ts` | Added `getGlobalNodeModulesFromArgv1()` helper, called from `getDefaultSearchPaths()` |
| `packages/cli/test/cli.test.ts` | Added integration test for third-party plugin discovery |
| `packages/engine/test/plugin-discovery.test.ts` | Added 7 tests for `getGlobalNodeModulesFromArgv1` and argv1-aware `getDefaultSearchPaths` |

**Technical notes:** Node.js ESM resolves `import.meta.url` through symlinks to the real path, so in an `npm link` setup the engine thought it lived in the monorepo. The fix uses `process.argv[1]`, which Node does not resolve through symlinks, to derive PREFIX and then check `PREFIX/lib/node_modules` (Unix) and `PREFIX/node_modules` (Windows). A `bin/` directory basename guard avoids false positives when the script is run directly (e.g. `node ./dist/index.js`).

## TESTING

- Integration test: fake plugin in `cwd/node_modules` confirmed CLI wiring.
- Unit tests: stubbing `process.argv[1]` with a fake PREFIX structure confirmed path resolution.
- Manual verification: `a16n plugins` shows the cursorrules third-party plugin.

Pre-existing timeout failures in `packages/glob-hook/test/cli.test.ts` (12 tests) are unrelated to this change.

## LESSONS LEARNED

- **Symlinked installs break `import.meta.url`-based path resolution** — any code that walks up from `import.meta.url` to find its own package tree needs a fallback for the `npm link` case.
- **`process.argv[1]` preserves the symlink path** — useful for finding where the binary was invoked from rather than where it physically lives.
- **Archive docs can lie** — the earlier archive `20260215-plugin-discovery.md` claimed the CLI already called `discoverAndRegisterPlugins()`. Always verify claims against the actual source.

## PROCESS IMPROVEMENTS

- When building discovery/auto-registration infrastructure, wire it into the entry point in the same PR. Infrastructure without integration is invisible.
- When testing path resolution logic, always test the `npm link` / symlink case — it's a common developer workflow that breaks `import.meta.url` assumptions.

## TECHNICAL IMPROVEMENTS

None beyond the implementation notes above.

## NEXT STEPS

None.
