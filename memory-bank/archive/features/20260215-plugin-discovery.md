# TASK ARCHIVE: Plugin Auto-Discovery

## METADATA
- **Task ID:** plugin-discovery
- **Date Completed:** 2026-02-15
- **Complexity Level:** 3 (Feature)
- **Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)

## SUMMARY

Implemented auto-discovery of third-party `a16n-plugin-*` packages in `@a16njs/engine`. The system scans `node_modules` directories, dynamically imports matching packages, validates exports against the `A16nPlugin` interface, and registers valid plugins. Bundled plugins take precedence in conflicts. The CLI calls `engine.discoverAndRegisterPlugins()` on startup.

## REQUIREMENTS

- Discover `a16n-plugin-*` packages from `node_modules` directories
- Validate discovered packages at runtime against the plugin interface
- Handle conflicts between bundled and installed plugins (bundled wins)
- Track plugin source (`'bundled' | 'installed'`) in the engine's plugin map
- Never crash on invalid plugins — skip with error info
- Work for both global installs and monorepo layouts

## IMPLEMENTATION

### Architecture Decisions (from Creative Phase)
- **Explicit async method** (`engine.discoverAndRegisterPlugins()`) over constructor option or static factory — keeps engine sync-constructable
- **`import.meta.url` path walking** over `npm root -g` subprocess — faster, no process spawn; also checks `node_modules` as child directory at each ancestor level for monorepo support
- **Runtime validation** of 5 structural fields (id, name, supports, discover, emit)
- **`resolvePluginEntry()`** reads `main` from `package.json`, falling back to `index.js`

### Key Implementation Details
- `discoverInstalledPlugins()` is standalone exported function (testable independently)
- `getDefaultSearchPaths()` walks up from `import.meta.url` checking for `node_modules` as both ancestor (global) and child (monorepo), collecting all matches
- Search paths customizable via options for testing
- Engine's internal plugin map refactored from `Map<string, A16nPlugin>` to `Map<string, { plugin, source }>`

### Files Changed
- **New:** `packages/engine/src/plugin-discovery.ts`, `packages/engine/test/plugin-discovery.test.ts`
- **Modified:** `packages/engine/src/index.ts` (integration), `packages/cli/src/index.ts` (3 lines — async IIFE + discovery call)

## TESTING

- 26 new tests (20 discovery + 6 engine integration)
- Tests create real ESM packages in temp directories (not mocks) to exercise actual `import()` paths
- Phase 5 cross-repo integration with `a16n-plugin-cursorrules` found 2 bugs:
  1. Hardcoded `index.js` entry point — fixed with `resolvePluginEntry()`
  2. `getDefaultSearchPaths()` didn't work in monorepo layout — fixed to check for `node_modules` as child directory
- 694 total tests passing, zero regressions

## LESSONS LEARNED

- Unit tests with simplified fixtures miss real-world package layouts — at least one test should use realistic `"main": "./dist/index.js"` structure
- Testing dynamic imports requires real packages, not mocks — `pathToFileURL()` requirement was caught this way
- Cross-repo integration testing should be mandatory, not optional — found 2 significant bugs unit tests missed
- `pnpm link` at monorepo root is the correct approach (not sub-package linking)

## REFERENCES

- Creative phase: `creative-plugin-discovery.md` (content preserved in this archive above)
- Reflection: `reflection-plugin-discovery.md` (content preserved in this archive above)
