# Creative Phase: Plugin Auto-Discovery Architecture

## Context

- **Requirement:** Third-party plugins (`a16n-plugin-*`) must be automatically discovered and registered
- **Constraint:** Discovery must live in `@a16njs/engine`, be toggle-able, and not break existing behavior
- **Constraint:** Must work for globally installed packages (`npm install -g`)
- **Constraint:** Invalid plugins must never crash the CLI

## Design Decision: Discovery API Shape

### Option A: Constructor option (`autoDiscover: true`)
- **Rejected.** Constructor would need to be async, which is a major API break and awkward in JS.

### Option B: Explicit async method on engine
- **Chosen.** `engine.discoverAndRegisterPlugins(options?)` — callers opt in, engine stays sync-constructable.

### Option C: Static factory `A16nEngine.create()`
- Considered but rejected — adds complexity for no clear benefit over Option B.

## Design Decision: Search Path Resolution

### Option A: `npm root -g` subprocess
- Simple, reliable, cross-platform via npm
- **Con:** Spawns a subprocess (slow for every CLI invocation)

### Option B: `import.meta.url` path walking
- Walk up from engine's `import.meta.url` to find the parent `node_modules` directory
- Works for global installs (engine is in `<global>/node_modules/@a16njs/engine/dist/`)
- No subprocess needed
- **Con:** Assumes standard npm directory layout

### Option C: `createRequire` + `require.resolve.paths`
- Node.js built-in, respects NODE_PATH and all resolution rules
- **Con:** More complex, may include irrelevant paths

### Decision: Start with Option B (path walking) with Option A as fallback.

The engine knows where it's installed via `import.meta.url`. Walking up to find the `node_modules` parent is fast and doesn't spawn a process. If that fails (non-standard layout), fall back to `npm root -g`. Also scan `process.cwd() + '/node_modules'` for local installs.

## Design Decision: Validation Strategy

Validate discovered packages with runtime checks:
1. `typeof mod.default === 'object' && mod.default !== null`
2. `typeof mod.default.id === 'string'`
3. `typeof mod.default.name === 'string'`
4. `Array.isArray(mod.default.supports)`
5. `typeof mod.default.discover === 'function'`
6. `typeof mod.default.emit === 'function'`

Skip (don't crash) if any check fails. Return error info to caller.

## Implementation Notes

- `discoverInstalledPlugins()` is a standalone exported function (useful for testing, tooling)
- `engine.discoverAndRegisterPlugins()` is the high-level method that calls it and registers results
- Search paths are customizable via options (for testing and special deployment scenarios)
- Default search paths: derived from `import.meta.url` + `process.cwd()/node_modules`
