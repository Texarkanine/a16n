# Task: CLI Coverage Hardening

* Task ID: cli-coverage-hardening
* Complexity: Level 2
* Type: Simple Enhancement (test infrastructure + test cases)

Improve correctness-oriented test coverage for `packages/cli` by: (1) excluding noise from coverage reports, (2) investigating E2E subprocess coverage feasibility, and (3) adding unit tests for safety-critical behaviors in `handleDeleteSource` and `handleGitIgnoreMatch`.

## Test Plan (TDD)

### Behaviors to Verify

**handleDeleteSource safety guards:**
- B1: Source with path resolving outside project root (`../../escape.txt`) → refused deletion, error emitted, no crash
- B2: Sources marked as `WarningCode.Skipped` → preserved (not deleted), even when other sources ARE deleted
- B3: `fs.unlink` throws on a valid source → error reported via IO, other sources still processed, no crash

**handleGitIgnoreMatch new-file routing (happy paths):**
- B4: All sources ignored via `.gitignore` → output routed to `.gitignore` (addToGitIgnore called)
- B5: All sources ignored via `.git/info/exclude` → output routed to `.git/info/exclude` (addToGitExclude called)
- B6: All sources tracked (none ignored) → output NOT ignored (no addToGitIgnore/addToGitExclude called)
- B7: Mixed sources (some ignored, some tracked) → `GitStatusConflict` warning with `skip` resolution
- B8: Sources ignored by different files (`.gitignore` vs `.git/info/exclude`) → conflict detected

**handleGitIgnoreMatch existing-file conflict detection:**
- B9: Existing tracked output + ignored sources → `GitStatusConflict` warning emitted (skip mode)
- B10: Existing ignored output + tracked sources → `GitStatusConflict` warning emitted (skip mode)

### Test Infrastructure

- Framework: Vitest (existing)
- Test location: `packages/cli/test/commands/convert.test.ts` (extend existing file)
- Conventions: `describe` blocks per feature, mock engine/IO/git helpers, `beforeEach`/`afterEach` with tmp dirs
- New test files: none (all additions go into existing `convert.test.ts`)
- Existing mock pattern: `vi.mock('../../src/git-ignore.js', ...)` with individually-mocked git functions

## Implementation Plan

### Step 0: Coverage config — exclude interface-only files
- Files: `packages/cli/vitest.config.ts`
- Changes: Add `'src/commands/io.ts'` to `coverage.exclude` array
- No TDD cycle needed — this is a config change verified by running coverage

### Step 1: E2E coverage investigation — document findings
- Research: vitest issue #7064 confirms subprocess coverage is unsupported (p2-nice-to-have)
- `NODE_V8_COVERAGE` workaround exists but requires custom merge tooling — not worth the complexity
- Deliverable: Document finding in code comment in `cli.test.ts` and in the plan report

### Step 2: Stub new test cases in convert.test.ts
- Files: `packages/cli/test/commands/convert.test.ts`
- Changes: Add two new `describe` blocks with empty test stubs:
  - `describe('handleDeleteSource safety guards')` — stubs for B1, B2, B3
  - `describe('handleGitIgnoreMatch routing')` — stubs for B4, B5, B6, B7, B8, B9, B10
- Add missing imports: `isGitTracked`, `isGitIgnored`, `addToGitIgnore`, `addToGitExclude`, `updatePreCommitHook` from git-ignore.js

### Step 3: Implement handleDeleteSource tests (B1, B2, B3)
- Files: `packages/cli/test/commands/convert.test.ts`
- Changes: Fill out B1 (path traversal), B2 (skippedSources), B3 (unlink failure)
- These tests use real `tmpDir` with actual files on disk (following existing delete-source test pattern)
- B1 requires a mock engine returning `sourcePath` that resolves outside root
- B2 requires a mock engine with both converted + skipped sources (skipped via WarningCode.Skipped warning)
- B3 requires a source file whose permissions prevent deletion (or mock fs.unlink)
- Run tests — all 3 should FAIL (no implementation changes needed; the code already exists, so they should actually PASS — this is coverage addition for existing code)

### Step 4: Implement handleGitIgnoreMatch routing tests (B4-B10)
- Files: `packages/cli/test/commands/convert.test.ts`
- Changes: Fill out B4-B10 within the existing `describe('git-ignore match mode')` block (which already has the `vi.mock` for git-ignore.js)
- B4: mock `getIgnoreSource` → `.gitignore` for all sources, verify `addToGitIgnore` called
- B5: mock `getIgnoreSource` → `.git/info/exclude`, verify `addToGitExclude` called
- B6: mock `getIgnoreSource` → `null` for all sources, verify neither called
- B7: mock mixed `getIgnoreSource` results, verify `GitStatusConflict` warning
- B8: mock `getIgnoreSource` → `.gitignore` for one, `.git/info/exclude` for another, verify conflict
- B9: mock `isGitTracked` → true, `getIgnoreSource` → `.gitignore`, `isNewFile: false`, verify conflict warning
- B10: mock `isGitTracked` → false, `isGitIgnored` → true, `getIgnoreSource` → null, `isNewFile: false`, verify conflict warning
- Run tests — all should PASS (exercising existing code paths)

### Step 5: Verify
- Run full test suite: `pnpm test` in packages/cli
- Run coverage: `pnpm test:coverage` in packages/cli
- Verify `io.ts` no longer in report, `convert.ts` coverage has increased
- Run lint + typecheck

## Technology Validation

No new technology — validation not required. All changes use existing vitest, vi.mock patterns.

## Dependencies

- None. All changes are within `packages/cli`.

## Challenges & Mitigations

- **B3 (unlink failure)**: Testing filesystem errors in a cross-platform way. Mitigation: Use `vi.spyOn(fs, 'unlink')` or create a read-only file. The existing test pattern creates real files, so we can use `fs.chmod` to make a file undeletable, or spy on fs.unlink for this specific test.
- **Mock scope for git-ignore functions**: The `vi.mock` for git-ignore.js is scoped to the `describe('git-ignore match mode')` block. New handleGitIgnoreMatch tests must go INSIDE that block. handleDeleteSource tests don't need git mocks and can go in a separate block.
- **Mock reset between tests**: Each test must call `vi.mocked(fn).mockResolvedValue(...)` or `mockResolvedValueOnce(...)` to avoid interference. The existing tests already follow this pattern.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA
