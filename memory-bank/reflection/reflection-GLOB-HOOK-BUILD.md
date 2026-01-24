# Reflection: GLOB-HOOK-BUILD

**Task ID**: GLOB-HOOK-BUILD  
**Complexity**: Level 3 (Intermediate)  
**Date**: 2026-01-24  
**Status**: Implementation Complete

---

## Summary

Built `@a16n/glob-hook`, a CLI tool for deterministic glob-based file path matching in Claude Code hooks. The package enables Phase 2 FileRule support by bridging the gap between Cursor's glob patterns and Claude's hook system.

**Deliverables**:
- 4 source modules (types, matcher, io, CLI)
- 37 passing tests (14 matcher, 11 io, 12 CLI integration)
- Comprehensive README documentation
- Draft PR #2 ready for review

---

## What Went Well

### 1. TDD Approach Worked Effectively
Writing tests first for both the matcher and I/O modules caught design issues early. The matcher tests revealed that `matchBase: true` in micromatch options breaks directory patterns - discovered through red-green-refactor cycle rather than production debugging.

### 2. Clear Planning Documents
The implementation plan (`planning/glob-hook/IMPLEMENTATION_PLAN.md`) provided excellent task breakdown. Having acceptance criteria defined upfront made E2E test writing straightforward - just translate AC1-AC7 directly to test cases.

### 3. Monorepo Integration Was Smooth
Following existing package patterns (`@a16n/models` as template) made setup trivial. The monorepo tooling (pnpm workspaces, turborepo) handled the new package without issues.

### 4. Error Handling Philosophy
The "always exit 0, errors to stderr" design decision proved correct. It ensures Claude hooks never fail due to our tool, making the CLI robust for production use.

---

## Challenges Encountered

### 1. micromatch `matchBase` Option Gotcha
**Problem**: Initial implementation used `matchBase: true` which broke directory patterns like `src/components/**`.

**Root Cause**: `matchBase` is designed for simple patterns (e.g., `*.tsx`) but interferes with path-prefixed patterns.

**Solution**: Removed `matchBase: true`. Testing showed all required patterns work correctly with just `dot: true`.

**Lesson**: Always test glob libraries with full pattern variety before committing to options.

### 2. Stdin Reading in Node.js Tests
**Problem**: CLI integration tests timed out at 5 seconds when using `spawn()` to run the CLI.

**Root Cause**: The initial stdin reading implementation used a 5-second timeout fallback that fired even when data was received, because `process.stdin.resume()` wasn't called.

**Solution**: Rewrote `readAllStdin()` to properly use `Buffer` chunks and call `stdin.resume()`. Removed the timeout fallback in favor of proper stream handling.

**Lesson**: Node.js stdin in child processes needs explicit `resume()` when spawned.

### 3. TypeScript Strict Null Checks
**Problem**: `process.argv` array access returned `string | undefined`, not assignable to `string | null`.

**Solution**: Added nullish coalescing: `args[++i] ?? null`

**Lesson**: Minor but common TypeScript pattern - always handle `undefined` from array access.

---

## Lessons Learned

### Technical

1. **micromatch is the right choice**: Battle-tested, fast, comprehensive glob support. The `dot: true` option for dotfile matching was essential.

2. **No CLI framework needed**: Raw `process.argv` parsing is sufficient for simple CLIs. Avoided adding commander/yargs dependency for 2 arguments.

3. **JSON output only to stdout**: Separating errors (stderr) from output (stdout) is critical for pipe-based CLIs. Claude reads stdout expecting valid JSON.

4. **Test timeout configuration**: CLI tests with `tsx` startup (~3s) need longer timeouts. Setting `testTimeout: 15000` in vitest config prevents flaky failures.

### Process

1. **Clear acceptance criteria accelerate testing**: AC1-AC7 mapped directly to test cases. No ambiguity about what "done" means.

2. **Task dependency graph was accurate**: Tasks 3 and 4 (matcher, io) really could run in parallel after Task 2 (types).

3. **TDD for libraries, E2E for CLIs**: Unit tests for pure functions (matcher, io), integration tests for full CLI - this split worked well.

---

## Technical Improvements for Future

### 1. Consider `--debug` Flag
Add optional verbose logging mode for debugging hook integration issues. Currently errors only go to stderr with minimal context.

### 2. Pattern Validation
Could validate glob patterns upfront and warn about common mistakes (e.g., missing `**` prefix).

### 3. Performance Measurement
Add timing metrics for hook latency debugging. Claude hooks should be fast (<100ms).

---

## Process Improvements

### 1. Document micromatch Options Early
Should have tested micromatch options during planning phase, not discovered the `matchBase` issue during implementation.

### 2. CLI Test Timeout in Template
Add default 15s timeout to vitest config template for packages with CLI tests.

---

## Metrics

| Metric | Value |
|--------|-------|
| Tasks | 7 |
| Tests | 37 |
| Source Files | 4 |
| Lines of Code | ~350 |
| Build Time | ~3s |
| Test Time | ~38s |

---

## Next Steps

1. **Merge PR #2** after review
2. **Phase 2 continuation**: Implement FileRule emission in `@a16n/plugin-claude` using glob-hook
3. **Integration testing**: End-to-end Cursor → Claude conversion with FileRules

---

## References

- PR: https://github.com/Texarkanine/a16n/pull/2
- Planning: `planning/glob-hook/IMPLEMENTATION_PLAN.md`
- Tech Brief: `planning/glob-hook/TECH_BRIEF.md`
