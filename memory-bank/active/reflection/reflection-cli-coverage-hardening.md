---
task_id: cli-coverage-hardening
date: 2026-03-06
complexity_level: 2
---

# Reflection: CLI Coverage Hardening

## Summary

Added 10 behavioral unit tests for `handleDeleteSource` and `handleGitIgnoreMatch`, excluded `io.ts` from coverage, and documented the E2E subprocess coverage limitation. All 174 tests pass; coverage rose from 78% to 87% overall and 64% to 82% on `convert.ts`.

## Requirements vs Outcome

All four requirements delivered:
1. `io.ts` excluded from coverage ✅
2. E2E coverage question answered (not feasible with vitest today, documented) ✅
3. `handleDeleteSource` unit tests (B1-B3) ✅
4. `handleGitIgnoreMatch` unit tests (B4-B10) ✅

No requirements dropped or added. The user's explicit constraint (don't test output.ts rendering) was respected.

## Plan Accuracy

The plan was accurate in sequence, file list, and scope. One minor addition during build: `beforeEach(() => vi.clearAllMocks())` in the routing describe block — mock state leaking between tests sharing the parent `vi.mock` scope. This was flagged as a known risk in the challenges section but the specific mitigation (clearAllMocks) wasn't prescribed.

The B3 approach (use naturally-missing file to trigger ENOENT instead of mocking `fs.unlink`) worked exactly as planned during preflight refinement — no fs spying needed.

## Build & QA Observations

Build was clean except for the mock-leaking issue in the first run of B4-B10 (2 of 7 failed). Root-caused in <1 minute, fixed with clearAllMocks. QA found no substantive issues — build was clean.

## Insights

### Technical
- vitest's `vi.mock` at describe-block level creates a persistent mock scope — but mock *call state* accumulates across sibling `it` blocks within that scope. Always pair describe-level `vi.mock` with per-test `vi.clearAllMocks()` when asserting on `not.toHaveBeenCalled`.

### Process
- Nothing notable — the two-phase analysis→implementation approach (L1 advisory → L2 build) worked well for this kind of "analyze then act" task.

### Million-Dollar Question

If behavioral test coverage had been a foundational assumption from the start, the `handleGitIgnoreMatch` function would have been designed with a clearer separation between "compute the routing plan" (pure function: sources → routing decisions) and "execute the plan" (side effects: write to gitignore/exclude). The current design interleaves computation and execution in a single loop, making it harder to test routing logic without mocking all the git I/O functions. A `planGitIgnoreRouting(...)` → `applyGitIgnoreRouting(...)` split would make the routing logic testable with zero mocks. Not worth refactoring now, but worth considering if the function grows further.
