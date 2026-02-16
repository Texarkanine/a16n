# TASK ARCHIVE: Architectural Redesign - Foundation Patterns

## METADATA
- **Task ID:** architectural-redesign
- **Date Completed:** 2026-02-15
- **Complexity Level:** 4 (System-Wide Architecture)
- **Milestones:** ARCH-M1 through ARCH-M7, all complete

## SUMMARY

Comprehensive architectural redesign of the a16n conversion engine, transforming incrementally-grown features into foundational patterns. Replaced monolithic engine internals with five composable subsystems: Plugin Registry, Plugin Loader, Workspace Abstraction, Transformation Pipeline, and CLI Restructuring. Strict TDD throughout, zero regressions, 120+ new tests added, 804 total tests passing.

## REQUIREMENTS

- Replace dual-Map plugin storage with unified `PluginRegistry`
- Separate plugin discovery, conflict resolution, and registration into `PluginLoader`
- Create `Workspace` abstraction for file operations (local/remote/virtual)
- Replace hardcoded path rewriting with composable `TransformationPipeline`
- Extract CLI command handlers for unit testability
- Maintain 100% backward compatibility throughout

## IMPLEMENTATION

### Component 1: Plugin Registry (ARCH-M2)
- Unified `PluginRegistry` class backed by single `Map<string, PluginRegistration>`
- Replaced dual Maps (`plugins` + `pluginSources`) — eliminates sync-drift bug class
- 123 lines of production code, 21 tests
- Key insight: dual Maps with same key type are always a code smell

### Component 2: Plugin Loader (ARCH-M3)
- Extracted conflict resolution from engine into `PluginLoader`
- `PluginConflictStrategy` enum for configurable behavior
- `loadInstalled()` + `resolveConflicts()` methods
- 14 tests

### Component 3: Workspace Abstraction (ARCH-M4, plus deferred 3c/3d)
- `Workspace` + `WorkspaceEntry` interfaces in `@a16njs/models` (lowest dependency level)
- `LocalWorkspace` implementation in models (moved from engine)
- `toWorkspace()` helper for `string | Workspace` union type parameters
- All 3 plugins accept `string | Workspace` — backward compatible
- Engine creates `LocalWorkspace` internally, passes to plugins
- 52 tests (45 workspace + 2 resolveRoot + 5 integration)
- Key insight: interfaces belong at lowest dependency level; implementations can live higher

### Component 4: Transformation Pipeline (ARCH-M5)
- `ContentTransformation` interface with `TransformationContext`
- `trialEmit` pattern: dryRun emit builds path mappings, single real emission
- Eliminated double-emission and hardcoded plugin knowledge
- Plugin-provided `pathPatterns` metadata replaces engine-hardcoded paths
- 9 transformation tests + 153 engine tests

### Component 5: CLI Restructuring (ARCH-M6)
- `CommandIO` interface for I/O abstraction
- `createProgram(engine)` factory for testability
- `isMainModule` guard prevents `program.parse()` during test imports
- Extracted `handleConvert` and `handleDiscover` command handlers
- 24 new unit tests + 131 existing integration tests

### Architecture Decisions (from Creative Phase)
- **Strategy Pattern** for conflict resolution
- **Decorator Pattern** for workspace implementations
- **Pipeline Pattern** for content transformations
- **Union types** (`string | Workspace`) for non-breaking interface evolution
- **Trial emit** for transformations needing output path knowledge

## TESTING

- 120+ new tests added across all 5 components
- 804 total tests, all passing, zero regressions
- Dual-layer strategy: mock-based unit tests (fast, isolated) + integration tests (real plugins, real filesystem)
- Phase gates: full suite verification between every phase

## CHALLENGES & SOLUTIONS

1. **Gutted CLI in planning commit** — 39 tests failing; restored from main via `git checkout main -- packages/cli/src/index.ts`
2. **pnpm monorepo rebuild ordering** — Interface changes require full dependency chain rebuild; always use `pnpm run build` not targeted builds
3. **Mock IO closure bug** — Spread operator copies primitives at spread time; used getters for mutable shared state
4. **Circular dependency risk** — Moved Workspace interfaces from engine to models; engine re-exports for backward compat
5. **Phases 3c/3d deferred** — Plugin interface changes deferred until after transformation pipeline defined actual needs; completed as final phase

## LESSONS LEARNED

### Architecture
- Interfaces should live at the lowest dependency level (models, not engine)
- Backward compatibility via union types (`string | Workspace`) enables gradual migration
- Trial emit eliminates double emission — general pattern for "need to know output before generating it"
- Plugin-provided metadata replaces engine-hardcoded knowledge — new plugins work automatically

### Process
- TDD is essential for safe architectural refactoring — zero regressions across 7 milestones
- Phase gates prevent cascading failures
- Creative phase highly valuable for Level 4 tasks — prevents false starts
- Deferring work is valid when later phases provide needed context
- Never gut implementation files in planning commits

### Technical
- Dual Maps with same key type should always be consolidated
- `pnpm run build` (full) after interface changes, not targeted builds
- Don't use spread operator for objects with mutable shared state (use getters)

## PHASE 1 REGISTRY REFLECTION (preserved)

Phase 1 was the foundation — 21 tests, 123 lines, zero regressions. TDD overhead was ~5 minutes; payoff was immediate (zero bugs in implementation). The stub-first approach forced clear API surface thinking before implementation. Integration into engine required changing only 4 methods. `PluginRegistry` has no dependency on `A16nEngine` — clean separation enabling Phase 2.

## REFERENCES

- Creative phase: `creative-architectural-redesign.md` (52.5KB design document — content preserved in project git history)
- Phase 1 reflection: `reflection-arch-phase1.md` (content summarized above)
- Full reflection: `reflection-architectural-redesign.md` (content preserved in this archive)
