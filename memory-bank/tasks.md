# Current Task

## Active Task: Fix Versioned Doc Generation Stale Files

**Complexity:** Level 1 (Simple Fix)
**Branch:** `cli-docs`
**Status:** Reflection Complete

### Completion Status

- [x] Implementation complete
- [x] Testing complete (653 tests pass across 8 packages; 39/39 versioned generations)
- [x] Reflection complete
- [ ] Archiving

### Reflection Highlights

- **What Went Well**: Correct root cause identified quickly via `git ls-tree` analysis; fix is minimal and surgical (one new helper function).
- **Challenges**: Initial fix attempt (`git clean -fd`) failed silently because the stale files were tracked, not untracked. Required understanding the nuance of git's checkout behavior with directory paths.
- **Lessons Learned**: `git checkout <commit> -- <path>` only restores files from the target commit — it does not remove tracked files added in later commits. `git clean` only handles untracked files. Explicit file-list diffing via `git ls-tree` is the correct approach for ensuring a clean historical checkout.

### Files Changed

| File | Change |
|------|--------|
| `packages/docs/scripts/generate-versioned-api.ts` | Added `removeStaleFiles()` helper; call from `checkoutAllPackagesFromCommit()` |
