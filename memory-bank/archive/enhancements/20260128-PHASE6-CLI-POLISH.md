# Enhancement Archive: Phase 6 - CLI Polish

## Summary

Implemented two CLI polish features: (1) consistent "Would" prefix for dry-run output, changing "Wrote:" to "Would write:" to match existing git-ignore patterns, and (2) a `--delete-source` flag for permanent source file migration with conservative skip preservation logic.

## Date Completed

2026-01-28

## Key Files Modified

- `packages/cli/src/index.ts` - Added dry-run prefix logic, --delete-source flag, deletion logic, and output formatting
- `packages/engine/src/index.ts` - Extended ConversionResult interface with `deletedSources?: string[]`
- `packages/cli/test/cli.test.ts` - Added 9 new test cases for Phase 6 features (AC1-AC9)

## Requirements Addressed

1. **AC1**: Dry-run output shows "Would write:" prefix
2. **AC2**: Normal mode output shows "Wrote:" prefix  
3. **AC3**: `--delete-source` deletes used source files after conversion
4. **AC4**: `--delete-source` preserves sources with skips
5. **AC5**: `--delete-source` preserves sources with partial skips
6. **AC6**: `--delete-source` deletes multiple sources merging to single output
7. **AC7**: Dry-run + `--delete-source` shows "Would delete:" messages
8. **AC8**: Sources preserved when flag not used
9. **AC9**: JSON output includes `deletedSources` array

## Implementation Details

### Feature 6A: Dry-Run Output Wording

Modified the file write output loop (line 454-456 in `packages/cli/src/index.ts`) to use conditional prefix:

```typescript
const writePrefix = options.dryRun ? 'Would write' : 'Wrote';
console.log(`${writePrefix}: ${file.path}`);
```

This matches the existing pattern used for git-ignore changes.

### Feature 6B: `--delete-source` Flag

**CLI Option:**
- Added `.option('--delete-source', 'Delete source files after successful conversion (skipped sources are preserved)')`

**Source Collection Algorithm:**
1. Collect all sources from `WrittenFile.sourceItems[].sourcePath`
2. Collect all sources from `Warning.code === 'skipped'` warnings
3. Sources to delete = used sources - skipped sources (conservative: preserve ANY file with ANY skip)

**Deletion Logic:**
- Executes after git-ignore management but before output
- Respects dry-run mode (logs "Would delete" without actual deletion)
- Handles file deletion errors gracefully (logs but continues)
- Adds deleted sources to `result.deletedSources` array

**Output:**
- Shows "Deleted:" or "Would delete:" for each file
- Includes `deletedSources` in JSON output

## Testing Performed

**Test Framework:** Vitest with CLI spawn integration tests

**Test Coverage:**
- 2 tests for dry-run wording (AC1, AC2)
- 7 tests for `--delete-source` flag (AC3-AC9)
- All 42 CLI tests passing
- Total: 289 tests passing across all 6 packages (no regressions)

**Key Test Scenarios:**
- Simple deletion (cursor rules → claude)
- Skip preservation (skills with hooks are not convertible)
- Partial skip preservation (mix of convertible and skipped sources)
- Multiple sources merging to single output
- Dry-run behavior
- JSON output format

**TDD Process:**
1. Stubbed test cases with documentation
2. Implemented tests (verified failures: 5 failing as expected)
3. Implemented features
4. All tests passing

## Lessons Learned

### What Went Well
- TDD discipline caught design issues early (`.claudeignore` assumption)
- QA pre-validation confirmed environment readiness
- Conservative deletion design simplified logic and reduced risk
- Pattern consistency with existing code maintained readability
- Zero regressions demonstrated good isolation

### Challenges
- Initial skip test design used non-existent `.claudeignore` file
- Needed to trace plugin internals to understand actual skip scenarios
- Creating realistic test data required understanding plugin behavior

### Solutions
- Used `Grep` to find `WarningCode.Skipped` usage patterns
- Redesigned tests using actual skip scenarios (skills with hooks)
- Read plugin source code for accurate behavior understanding

### Technical Insights
- `WrittenFile.sourceItems` array tracks sources effectively
- `Warning` interface with `sources` array provides exactly what's needed
- Conservative deletion (preserve any file with any skip) is correct trade-off
- Type extensions (`deletedSources?: string[]`) propagate cleanly

### Process Insights
- QA validation gates provide valuable safety net
- TDD reveals design issues before implementation
- Clear acceptance criteria enable fast implementation
- Time variance: 40% faster than estimated (3 hours vs 5 hours estimated)

### Action Items for Future
1. Consider extracting `options.dryRun ? 'Would X' : 'X'` pattern helper
2. Document skip scenarios in each plugin for future testing
3. Add integration tests for combined `--delete-source` + git-ignore behavior
4. Consider performance optimization for large projects (Set-based skip lookup)

## Related Work

- Phase 5: Git ignore output management (foundation for output routing)
- Code Review 10: Source tracking implementation (provides `sourceItems` data)
- Phase 3: CLI polish (previous enhancement to CLI experience)

## Notes

- Implementation was 40% faster than estimated due to clear specs and TDD process
- No changes needed to plugin code - all changes isolated to CLI and engine
- Conservative deletion approach was validated as correct during reflection
- CI handles versioning - no manual changeset creation needed
