# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

**Phase 6: CLI Polish** - Dry-run output wording and `--delete-source` flag

## Complexity Assessment

**Level 2** - Standard feature with clear requirements

- Clear acceptance criteria (9 ACs in spec)
- Well-defined scope with two independent features
- Familiar codebase patterns
- No architectural decisions needed
- Estimated effort: ~5 hours

## Implementation Plan

### Feature 6A: Dry-Run Output Wording

**Goal:** Change output verbs to use "Would" prefix in dry-run mode consistently.

**Current State (line 451 in `packages/cli/src/index.ts`):**
```typescript
console.log(`Wrote: ${file.path}`);
```

**Target State:**
```typescript
const writePrefix = options.dryRun ? 'Would write' : 'Wrote';
console.log(`${writePrefix}: ${file.path}`);
```

**Git changes already correct** (line 457):
```typescript
const prefix = options.dryRun ? 'Would update' : 'Git: Updated';
```

### Feature 6B: `--delete-source` Flag

**Goal:** Delete source files after successful conversion (for permanent migration).

**Algorithm:**
1. Collect all sources that contributed to successful outputs (`WrittenFile.sourceItems`)
2. Collect all sources involved in skips (`Warning.sources` where `code === 'skipped'`)
3. Sources to delete = used sources - skipped sources
4. Delete files (or report "Would delete" in dry-run)

**Key Constraint:** If ANY part of a source was skipped, preserve entire source.

---

## Test Plan

### Test Locations

| Test Type | Location | Description |
|-----------|----------|-------------|
| CLI tests | `packages/cli/test/cli.test.ts` | Tests for flag acceptance, output format |
| Integration tests | `packages/cli/test/integration/integration.test.ts` | E2E tests with fixtures |

### Test Cases to Add

#### AC1: Dry-Run Shows "Would" Prefix
- **Test:** `it('should show "Would write:" in dry-run mode')`
- **File:** `cli.test.ts`
- **Behavior:** Dry-run output contains "Would write:" not "Wrote:"

#### AC2: Normal Mode Shows Current Verbs
- **Test:** `it('should show "Wrote:" in normal mode')`
- **File:** `cli.test.ts`
- **Behavior:** Normal mode output contains "Wrote:"

#### AC3: `--delete-source` Deletes Used Sources
- **Test:** `it('should delete source files with --delete-source')`
- **File:** `cli.test.ts` or `integration.test.ts`
- **Behavior:** Source files are deleted after conversion

#### AC4: `--delete-source` Preserves Skipped Sources
- **Test:** `it('should preserve sources with skips when using --delete-source')`
- **File:** `cli.test.ts` or `integration.test.ts`
- **Behavior:** Sources involved in skips are NOT deleted

#### AC5: `--delete-source` Preserves Sources with Partial Skips
- **Test:** `it('should preserve sources with partial skips')`
- **File:** `integration.test.ts`
- **Behavior:** `.cursorignore` with negation patterns is preserved

#### AC6: `--delete-source` with Multiple Sources to Single Output
- **Test:** `it('should delete multiple sources that merge into single output')`
- **File:** `integration.test.ts`
- **Behavior:** Both `a.mdc` and `b.mdc` deleted when merged to `CLAUDE.md`

#### AC7: `--delete-source` Dry-Run Shows What Would Be Deleted
- **Test:** `it('should show "Would delete:" in dry-run with --delete-source')`
- **File:** `cli.test.ts`
- **Behavior:** Dry-run + delete-source shows planned deletions

#### AC8: `--delete-source` Without Flag Does Nothing
- **Test:** `it('should not delete sources without --delete-source flag')`
- **File:** `cli.test.ts`
- **Behavior:** Sources preserved when flag not used

#### AC9: JSON Output Includes Deleted Files
- **Test:** `it('should include deletedSources in JSON output')`
- **File:** `cli.test.ts`
- **Behavior:** JSON includes `deletedSources` array

---

## Implementation Tasks

### Task 1: Stub Tests (TDD Step 2)
- [ ] Add test cases with empty implementations in `cli.test.ts`
- [ ] Document behaviors to test

### Task 2: Implement Tests (TDD Step 3)
- [ ] Fill in test implementations
- [ ] Run tests, verify they fail

### Task 3: Implement Dry-Run Wording (6A)
- [ ] Modify line 451 in `packages/cli/src/index.ts`
- [ ] Run tests, verify AC1/AC2 pass

### Task 4: Add `--delete-source` Flag
- [ ] Add `.option('--delete-source', ...)` to commander
- [ ] Run tests, verify flag is accepted

### Task 5: Implement Source Collection Logic
- [ ] Create `getSourcesToDelete()` function
- [ ] Collect from `WrittenFile.sourceItems`
- [ ] Exclude sources in warnings with `code === 'skipped'`

### Task 6: Implement File Deletion
- [ ] Add deletion loop after git-ignore management
- [ ] Support dry-run (log only)
- [ ] Add `deletedSources` to result

### Task 7: Extend ConversionResult Type
- [ ] Add `deletedSources?: string[]` to `ConversionResult` in engine

### Task 8: CLI Output for Deleted Files
- [ ] Show "Deleted:" or "Would delete:" in output
- [ ] Include in JSON output

### Task 9: Final Verification
- [ ] Run all tests: `pnpm test`
- [ ] Run lint: `pnpm lint`
- [ ] Run build: `pnpm build`
- [ ] Manual verification of all 9 ACs

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/cli/src/index.ts` | Add flag, implement deletion, update output wording |
| `packages/engine/src/index.ts` | Add `deletedSources` to `ConversionResult` |
| `packages/cli/test/cli.test.ts` | Add tests for dry-run wording and delete-source |
| `packages/cli/test/integration/integration.test.ts` | Add integration tests for delete-source |

---

## Definition of Done

- [ ] All 9 acceptance criteria pass (AC1-AC9)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes (all packages)
- [ ] `pnpm lint` passes
- [ ] Dry-run output uses "Would write:" prefix consistently
- [ ] `--delete-source` flag deletes used sources
- [ ] `--delete-source` preserves sources involved in skips
- [ ] JSON output includes `deletedSources` when applicable
- [ ] No TODO comments in shipped code
- [ ] Changeset created for version bump
