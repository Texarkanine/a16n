# Active Context

## Current Task: CLI Coverage Hardening
**Phase:** BUILD - COMPLETE

## What Was Done
- Excluded `src/commands/io.ts` from coverage in `packages/cli/vitest.config.ts`
- Documented E2E coverage limitation in `packages/cli/test/cli.test.ts` (vitest#7064)
- Added 10 new behavioral unit tests (B1-B10) in `packages/cli/test/commands/convert.test.ts`:
  - B1-B3: handleDeleteSource safety guards (path traversal, skippedSources, unlink failure)
  - B4-B10: handleGitIgnoreMatch routing (gitignore, exclude, tracked, mixed-status, different-files, existing-file conflicts)

## Files Modified
- `packages/cli/vitest.config.ts` — added io.ts to coverage exclude
- `packages/cli/test/cli.test.ts` — added NOTE about E2E coverage limitation
- `packages/cli/test/commands/convert.test.ts` — added 10 new tests, 3 new imports

## Coverage Impact
- Overall: 78.19% → 86.59% (+8.4pp)
- convert.ts: 64.38% → 81.83% (+17.5pp), functions 88.88% → 100%
- io.ts removed from report (pure interface)

## Deviations from Plan
- Added `beforeEach(() => vi.clearAllMocks())` inside the routing describe block — needed to prevent mock state leaking between tests in the shared vi.mock scope. Standard vitest practice.

## Next Step
- QA review
