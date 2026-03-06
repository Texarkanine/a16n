# Active Context

## Current Task: CLI Coverage Hardening
**Phase:** REFLECT - COMPLETE

## What Was Done
- Added 10 behavioral unit tests (B1-B10) in `packages/cli/test/commands/convert.test.ts`
- Excluded `io.ts` from coverage in `packages/cli/vitest.config.ts`
- Documented E2E subprocess coverage limitation in `packages/cli/test/cli.test.ts`
- Coverage: 78% → 87% overall, convert.ts 64% → 82% (functions 100%)

## Reflection Key Insight
- vitest `vi.mock` at describe-level persists call state across sibling `it` blocks — always pair with `vi.clearAllMocks()` in `beforeEach` when asserting `not.toHaveBeenCalled`

## Next Step
- Archive when ready
