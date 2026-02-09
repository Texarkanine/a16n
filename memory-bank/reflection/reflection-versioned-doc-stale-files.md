# Bug Fix Reflection: Versioned Doc Generation Stale Files

## Summary
Fixed a bug where `checkoutAllPackagesFromCommit()` in `generate-versioned-api.ts` left stale tracked files on disk when checking out historical versions, causing TypeDoc compilation failures for engine@0.1.0–0.4.0 (4 of 39 versioned doc generations).

## Implementation
Added a `removeStaleFiles()` helper that uses `git ls-tree` to diff the file list at HEAD vs the target commit, then `unlink`s tracked files that shouldn't exist at the historical version. This is called after each `git checkout` in `checkoutAllPackagesFromCommit()`.

Key insight: `git checkout <commit> -- <path>` only restores files present at `<commit>` — it does NOT remove tracked files added in later commits. And `git clean -fd` only removes untracked files, so it can't help either. The correct approach is an explicit file-list diff.

## Testing
- All 34 docs unit tests pass
- Full integration: 39/39 versioned doc generations succeed (was 35/39)
- Full workspace test suite: 653 tests pass across all 8 packages

## Additional Notes
- The stale file was `packages/engine/src/path-rewriter.ts`, added in engine@0.5.0 (`943b9ce`). It referenced `WarningCode.OrphanPathRef` from models, which didn't exist at older tagged commits.
- TypeDoc picked up the stale file via the engine tsconfig's `"include": ["src/**/*"]` glob, not via an import chain.
- This was a pre-existing bug unrelated to the CLI docs fix on this branch — engine source was never modified.
- First attempted `git clean -fd` which silently did nothing (files were tracked). Diagnosis required understanding the nuance between tracked vs untracked files in git's working tree.
