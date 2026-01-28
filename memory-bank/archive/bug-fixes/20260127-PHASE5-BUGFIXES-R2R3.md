# TASK ARCHIVE: Phase 5 Bug Fixes Rounds 2-3

## METADATA

| Field | Value |
|-------|-------|
| Task ID | PHASE5-BUGFIXES-R2R3 |
| Date | 2026-01-27 |
| Complexity Level | Level 2 (Bug Fix) |
| Parent Task | PHASE5-BUGFIXES |
| Branch | phase-5 |

## SUMMARY

Fixed 4 additional bugs discovered during continued manual testing. These issues emerged after Round 1 fixes, revealing deeper edge cases in rule classification and gitignore handling.

## BUGS FIXED

| Item | Severity | Description | Fix |
|------|----------|-------------|-----|
| B5 | Medium | Empty globs with description misclassified | Check parsed globs length, not raw value |
| B6 | Low | Dry-run match mode lacked per-file details | Added destination info to output |
| B7 | High | Match mode didn't route to same gitignore source | Added `getIgnoreSource()` function |
| B8 | High | Semaphore section replaced instead of accumulated | Changed to merge with Set deduplication |

## IMPLEMENTATION

### Key Technical Solutions

1. **`getIgnoreSource()` Function** - Uses `git check-ignore --verbose` to determine WHERE a file is ignored from (.gitignore vs .git/info/exclude)

2. **Semaphore Accumulation Logic**:
   ```typescript
   const allEntries = new Set([...existingEntries, ...entries]);
   mergedEntries = [...allEntries].sort();
   ```
   - Extracts existing entries from semaphore section
   - Merges with new entries using Set (automatic deduplication)
   - Sorts alphabetically for deterministic output

3. **Classification Fix**:
   ```typescript
   // Before (buggy): if (frontmatter.globs) { ... }
   // After (correct):
   const globs = parseGlobs(frontmatter.globs);
   if (globs.length > 0) { ... }
   ```

### Files Modified

| File | Changes |
|------|---------|
| `packages/plugin-cursor/src/discover.ts` | B5: Check parsed globs length |
| `packages/cli/src/index.ts` | B6, B7: Per-file output, destination routing |
| `packages/cli/src/git-ignore.ts` | B7, B8: getIgnoreSource(), accumulation |

## TESTING

- 11 new tests added:
  - 5 tests for `getIgnoreSource()`
  - 2 integration tests for match mode routing
  - 4 tests for semaphore accumulation/deduplication/sorting
- 289 total tests passing

## LESSONS LEARNED

### Technical
- Truthy checks don't validate content: `if (value)` is truthy for empty strings from YAML
- Match mode requires full context: WHERE source is ignored, not just IF
- Idempotency requires accumulation, not replacement

### Process
- Test with repeated runs before marking complete
- Document classification precedence in code comments
- Validate parsed values, not raw values

### Key Insight
> "For tools that users run repeatedly, state management should accumulate rather than replace. Users expect: running twice doesn't break anything, new entries are added, existing entries are preserved, duplicates are deduplicated."

## DESIGN NOTE

Discussed whether preserving Cursor source paths in Claude output headers is good design:
```markdown
## From: .cursor/rules/style.mdc
```

**Assessment:** Mild smell, mostly YAGNI. Helps with provenance tracking but is a leaky abstraction. Worth revisiting if bidirectional sync becomes a priority.

## METRICS

| Metric | Value |
|--------|-------|
| Bugs Fixed | 4 (B5-B8) |
| New Tests | 11 |
| Files Modified | 6 |
| Time Spent | ~1 hour |

## CUMULATIVE BUG FIX SUMMARY

| Round | Bugs | Status |
|-------|------|--------|
| Round 1 | B1-B4, E1 | ✅ Complete |
| Round 2 | B5-B7 | ✅ Complete |
| Round 3 | B8 | ✅ Complete |
| **Total** | **8 bugs + 1 enhancement** | ✅ All Fixed |

---

**Phase 5 bug fixes complete.** All discovered issues resolved.
