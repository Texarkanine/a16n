# Active Context

## Current Focus

**Architectural Redesign - Foundation Patterns** (Level 4 System-Wide)

Planning phase for major architectural refactoring to transform incrementally-added features (source tracking, split roots, path rewriting) into foundational design patterns.

## What This Is

A comprehensive redesign of the engine's core architecture to eliminate technical debt and create elegant abstractions:

1. **PluginRegistry** - Replace dual Maps with unified metadata management
2. **PluginLoader** - Separate discovery, conflict resolution, and registration
3. **Workspace Abstraction** - Enable remote/virtual workspaces beyond local filesystem
4. **Transformation Pipeline** - Make content transformations composable and extensible
5. **CLI Restructuring** - Separate structure from execution for better testability

## Why Now

The recent test fixes revealed architectural pain points:
- Dual Maps (`plugins` + `pluginSources`) that must stay in sync
- Mixed concerns (discovery + registration in one method)
- Hardcoded plugin knowledge in engine (path patterns)
- Double emission for path rewriting (wasteful)
- Split roots as afterthought (confusing fallback logic)

These issues compound over time. Addressing them now prevents future complexity.

## Planning Complete

✅ **Tasks.md updated** with comprehensive Level 4 plan:
- 6 implementation phases (7 milestones including planning)
- ~450 tasks organized by component
- 3 creative phases identified for key decisions
- Risk assessment and mitigation strategies
- Backward compatibility strategy (critical for ecosystem)
- Test strategy with coverage targets
- Dependency graph showing critical path

✅ **Creative Phase Document Created** (`memory-bank/creative/creative-architectural-redesign.md`):
- Detailed rationale for each component redesign
- Problem context and "why we're pivoting"
- Benefits and trade-offs analysis
- Use case examples and design decisions
- Cross-cutting concerns (backward compatibility, testing, performance)
- Migration guide for plugin authors

## Key Architectural Decisions

### Component 1: PluginRegistry
- **Single source of truth** for plugin metadata
- Tracks: plugin, source, registeredAt, version, installPath
- Natural extension point for lifecycle hooks

### Component 2: PluginLoader
- **Separation of concerns**: discovery → conflict resolution → registration
- **Strategy pattern** for conflict resolution (PREFER_BUNDLED, PREFER_INSTALLED, FAIL, NAMESPACE)
- Testable in isolation

### Component 3: Workspace
- **Interface abstraction** for file operations
- Implementations: LocalWorkspace, ReadOnlyWorkspace, MemoryWorkspace
- Enables testing without filesystem, supports remote workspaces

### Component 4: Transformation Pipeline
- **Composable transformations** instead of hardcoded features
- PathRewritingTransformation uses plugin-provided pathPatterns
- Single emission (efficient)
- Extensible for future transformations

### Component 5: CLI Restructuring
- **ProgramBuilder** separates CLI structure from execution
- Command executors testable without Commander
- Result formatters reusable across interfaces

## Critical Success Factors

1. **Backward Compatibility** - Existing plugins MUST NOT break
   - Overloads for old APIs (string paths) and new APIs (workspaces)
   - 2 major version overlap before removal
   - Deprecation warnings, not errors

2. **TDD Discipline** - Every phase follows strict TDD
   - Stub → Test → Implement → Verify
   - No implementation without failing tests first

3. **Zero Regressions** - All existing tests must pass
   - Benchmark performance (no >10% degradation)
   - Existing plugins work unchanged

4. **Incremental Delivery** - Each phase can be merged independently
   - Reduces risk
   - Provides value incrementally
   - Enables rollback if needed

## Dependencies & Critical Path

```
M1 (Planning) → M2 (Registry) → M3 (Loader) → M5 (Transformations) → M6 (CLI) → M7 (Integration)
                     ↓
                M4 (Workspace) → M5
```

**Critical path:** M1 → M2 → M3 → M5 → M6 → M7 (7 weeks)
**Parallel work:** M4 (Workspace) can start after M2, run parallel to M3

## Creative Phases Required

Before implementation begins, need to resolve 3 design questions:

1. **Workspace API Design** (before Phase 3a)
   - Streaming support for large files?
   - Error propagation strategy?

2. **Transformation Composition** (before Phase 4a)
   - Explicit ordering vs dependency graph?
   - How to handle transformation conflicts?

3. **CLI Backward Compatibility** (before Phase 5a)
   - Deprecation timeline?
   - Warnings vs hard errors?

## Next Steps

1. ✅ **Plan complete** - Comprehensive Level 4 plan in tasks.md
2. **Review with stakeholders** - Get buy-in on approach and timeline
3. **Creative phases** - Create documents for 3 decision points
4. **Begin Phase 1a** - PluginRegistry design and test stubbing

## Notes

- This is the largest refactoring since project inception
- Estimated 7 weeks (1 week per milestone)
- High impact: touches 5 core components
- High risk: must maintain backward compatibility
- High reward: eliminates technical debt, enables future features
- Consider feature flags for gradual rollout
- Each phase independently valuable (can stop/pause between phases)
