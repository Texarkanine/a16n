# TASK ARCHIVE: CodeRabbit Nitpick Fixes (Post-Rearchitecture)

## METADATA
- **Task ID:** coderabbit-nitpicks
- **Date:** 2026-02-16
- **Complexity:** Level 2 (Simple Enhancement)
- **Branch:** `nitpicks-postrearch`
- **Files Modified:**
  - `packages/cli/src/commands/convert.ts`
  - `packages/cli/test/commands/convert.test.ts`
  - `packages/models/src/warnings.ts`
  - `packages/cli/src/output.ts`

---

## SUMMARY

Addressed five CodeRabbit review comments on the rearchitecture merge. Three were valid and fixed; two were rejected as not worth the cost. All fixes are internal/defensive improvements with no user-facing behavior change.

---

## REQUIREMENTS

Fix the following CodeRabbit findings in `packages/cli/src/commands/convert.ts`:

1. **Default branch in `applyConflictResolution`** — switch statement silently dropped unknown resolution values
2. **Over-parameterized `routeConflict`/`routeConflictSimple`** — 11-12 positional params with identical `string[]` types
3. **Sequential `removeFrom*` calls** — single try/catch meant first failure aborted remaining removals
4. **Semantically wrong `WarningCode.Approximated`** in removal catch blocks — `Approximated` means "translated imperfectly", not "operation failed"

Rejected findings:
- **`vi.mock` hoisting comment/move** — mock doesn't interfere with other tests; `vi.doMock` + `beforeEach` alternative doesn't work with static top-level imports; not worth the noise

---

## IMPLEMENTATION

### Fix 1: Default branch in `applyConflictResolution`
Added `default: throw new Error(...)` to the switch statement at the end of `applyConflictResolution`. The error message includes both the unknown resolution value and the `relativePath` for diagnosability.

### Fix 2: `ConflictRouteContext` refactor
Defined a `ConflictRouteContext` interface grouping:
- `conflictResolution: string`
- `result: ConversionResult`
- `filesToGitignore/Exclude/Hook/Commit: string[]`
- `verbose: (msg: string) => void`

Parameter count reductions:
- `routeConflict`: 11 → 5 params
- `routeConflictSimple`: 10 → 4 params
- `applyConflictResolution`: 6 → 3 params (then further to 2 after the redundant `resolution` param was removed in a follow-up — `ctx.conflictResolution` is used directly)

Context object constructed once in `handleGitIgnoreMatch` after the accumulator arrays are declared, passed to all three call sites.

### Fix 3: Independent try/catches for `removeFrom*`
Replaced the single sequential block with three independent try/catch blocks. Each failure pushes a warning to `result.warnings` rather than aborting the remaining removals. This ensures all three cleanup operations are always attempted.

### Fix 4: `WarningCode.OperationFailed`
Added `OperationFailed = 'operation-failed'` to the `WarningCode` enum in `packages/models/src/warnings.ts`. Updated the three catch blocks in convert.ts to use this code. Added the `'✗'` icon entry to the `ICONS` record in `packages/cli/src/output.ts` (required by the exhaustive `Record<WarningCode, string>` type).

---

## TESTING

**New tests added** (in `packages/cli/test/commands/convert.test.ts`, `describe('git-ignore match mode')`):

- **`should error on unknown conflict resolution value`** — mocks `isGitRepo → true`, `getIgnoreSource → ['.gitignore', null]` (mixed status triggers `routeConflictSimple → applyConflictResolution`), sets `ifGitignoreConflict: 'badvalue'`. Asserts `exitCode === 1` and error output contains `'badvalue'`.

- **`should attempt all removals even if one fails`** — mocks `removeFromGitIgnore → throws`, `removeFromGitExclude/PreCommitHook → resolve`. Sets `ifGitignoreConflict: 'commit'`. Asserts all three functions were called and the failure warning surfaces in `io.logs`.

**Mocking strategy:** `vi.mock('../../src/git-ignore.js', importOriginal)` with selective overrides. Note: `vi.mock` is hoisted by Vitest regardless of lexical position inside a `describe` block — it applies file-wide, but doesn't affect other tests since none of them exercise git-ignore code paths.

**Verification:**
- Build: pass (tsc, monorepo-wide)
- Tests: 161/161 pass in CLI package; full monorepo pass

---

## LESSONS LEARNED

- **Context objects over long param lists:** Apply proactively when >~5 params of the same type accumulate. The reduction (11→5, 10→4) pays immediate readability dividends.
- **Independent error handling for logically-independent async operations:** Even when awaited sequentially, if operations don't depend on each other, each needs its own try/catch. A shared catch creates silent coupling.
- **Exhaustive switches with `default: throw`:** Essential for any switch over a string that comes from user input or options — catches programming errors early and produces diagnosable error messages.
- **Semantic accuracy in warning codes:** `Approximated` means translation quality, not operational failure. Having the right code matters for consumers filtering or acting on warning codes.
- **`vi.mock` hoisting is file-scoped:** Placing it inside a `describe` doesn't scope it — it hoists to file top. The `vi.doMock` alternative requires dynamic imports and is significantly more complex. If file-scoped mocking creates test interference, the right solution is a separate test file, not `vi.doMock`.

---

## REFERENCES

- Reflection: `memory-bank/reflection/reflection-coderabbit-nitpicks.md` (archived)
- Source: `packages/cli/src/commands/convert.ts`
- Models: `packages/models/src/warnings.ts`
