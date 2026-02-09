# Current Task

## Active Task: Fix CLI Docs Showing Same Content For All Versions

**Complexity:** Level 1 (Simple Fix)
**Branch:** `cli-docs`
**Status:** Reflection Complete

### Completion Status

- [x] Implementation complete
- [x] Testing complete (35/35 docs tests pass)
- [x] Reflection complete
- [ ] Archiving

### Reflection Highlights

- **What Went Well**: Root cause identified clearly via plan analysis; TDD process caught the bug in the test before the fix was applied; fix is minimal and surgical (two lines changed, one import added).
- **Challenges**: The bug was subtle — pnpm silently exits with code 0 when no packages match a filter, producing no error. The stale dist issue compounded this by making it appear that builds were succeeding.
- **Lessons Learned**: Always verify pnpm filter names match actual `package.json` names. Pnpm's silent no-match behavior is a footgun. Adding regression tests that cross-reference config values against their source of truth is an effective guard against drift.

### Files Changed

| File | Change |
|------|--------|
| `packages/docs/scripts/generate-cli-docs.ts` | Fixed pnpm filter name (`@a16njs/cli` -> `a16n`), added dist cleanup before each build |
| `packages/docs/test/generate-cli-docs.test.ts` | Added regression test verifying filter name matches CLI package.json |

## Completed Bug Fixes

- [x] [Level 1] Fixed: Versioned doc generation stale files (Completed: 2026-02-09)
  - Issue: `git checkout` doesn't remove stale tracked files from later commits
  - Root Cause: `git checkout <commit> -- <path>` only restores files, doesn't remove extras
  - Solution: Added `removeStaleFiles()` helper using `git ls-tree` diffing
  - Files: `packages/docs/scripts/generate-versioned-api.ts`
