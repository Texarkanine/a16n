# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

| Field | Value |
|-------|-------|
| **Task ID** | PHASE5-BUGFIXES |
| **Title** | Phase 5 Bug Fixes |
| **Complexity** | Level 2 (Simple Enhancement) |
| **Type** | Bug Fix |
| **Parent** | PHASE5-GITIGNORE |
| **Estimated Effort** | 2-4 hours |
| **Build Status** | ✅ Complete |
| **Reflection Status** | ✅ Complete |

## Summary

Fix 4 bugs discovered during manual testing of Phase 5 git-ignore output management feature, plus 1 enhancement for better UX.

## Bug Reports

### Bug 1: Dry-run doesn't show planned git changes (Medium)

**Symptom:** When using `--dry-run` with any `--gitignore-output-with` style other than `none`, no information about planned git changes is shown.

**Root Cause:** Line 88 in `packages/cli/src/index.ts` has condition `!options.dryRun` which completely skips git management logic in dry-run mode.

**Expected:** Dry-run should show what git changes WOULD be made, similar to how it shows files that WOULD be written.

**Fix:** Calculate planned git changes but don't write them. Add dry-run output for git operations.

---

### Bug 2: Glob patterns in exclude file not honored (High)

**Symptom:** User had `.cursor/rules/local/` in `.git/info/exclude`, converted rules from that directory, but output was not ignored.

**Root Cause Analysis:**
1. `isGitIgnored()` uses `git check-ignore` which DOES honor glob patterns ✓
2. Issue is the `match` style only ignores output files whose SOURCE files are ignored
3. The current logic checks if source `.cursor/rules/local/dev.mdc` is ignored
4. `git check-ignore` works on existing paths - if source was never committed, it may not show as "ignored" properly
5. **Deeper issue:** We check `isGitIgnored(source)` but should be checking the actual file on disk

**Expected:** If `.cursor/rules/local/` is in any gitignore file and a source rule lives under that path, its output should be ignored.

**Fix:** Ensure `git check-ignore` is called with the actual source path (relative to repo root). Test with actual git repo scenarios.

---

### Bug 3: Style `exclude` not writing anything (High)

**Symptom:** After reset and re-run with `--gitignore-output-with exclude`, nothing was written to `.git/info/exclude`.

**Root Cause Analysis:**
1. Line 92 filters: `result.written.filter(w => w.isNewFile)`
2. `isNewFile` is determined by `fs.access()` BEFORE writing (checks if file exists)
3. If output files already existed from a previous run, `isNewFile = false`
4. With `newFiles.length === 0`, the code logs "No new files to manage" and exits early

**Expected:** On a clean conversion (after `git checkout .`), new output files should have `isNewFile: true`.

**Investigation needed:** 
- Are paths absolute vs. relative causing issues?
- Is the `fs.access()` check happening at the wrong time?
- The plugin checks existence, writes, then reports `isNewFile` - but maybe the timing is off

**Fix:** Debug the exact file paths being checked. Ensure relative paths match.

---

### Bug 4: Empty `globs:` frontmatter creates invalid hook (Medium)

**Symptom:** Cursor rules with `globs: ` (empty value) in frontmatter are converted to Claude `settings.local.json` with `--globs ""` which is invalid.

**Root Cause:** `buildHookConfig()` in `packages/plugin-claude/src/emit.ts` doesn't check if `fileRule.globs` is empty or contains only empty strings.

**Expected:** FileRules with no valid glob patterns should either:
1. Be skipped entirely (not emitted as a hook), or
2. Be converted to GlobalPrompt type instead

**Fix:** Add validation in Claude plugin emit to skip/convert FileRules with empty globs.

---

### Enhancement 1: FileRule files use .txt instead of .md (Low)

**Symptom:** When Claude plugin emits FileRules to `.a16n/rules/`, it uses `.txt` extension instead of `.md`.

**Root Cause:** Line 218 in `packages/plugin-claude/src/emit.ts` calls `getUniqueFilename(baseName, usedFilenames, '.txt')`.

**Expected:** FileRule content comes from Cursor `.mdc` files (markdown), so `.md` extension provides:
- Proper syntax highlighting in IDEs
- Consistent with source format
- Better UX for developers editing rules

**Fix:** Change `.txt` → `.md` in `getUniqueFilename()` call.

**Why not detect markdown?** Heuristics are complex and fragile. Assuming markdown is safe - even non-markdown content won't break with `.md` extension.

**Why not `.claude/.a16n/`?** Keep `.a16n/` at project root for tool-agnostic design. Enables round-tripping and future tool support.

---

## Implementation Checklist

### Bug 1 Fix: Dry-run git preview
- [x] Refactor git management to separate "plan" from "execute"
- [x] In dry-run mode, run planning phase and output planned changes
- [x] Add test for dry-run showing git changes
- [x] Added `EmitOptions` interface with `dryRun` parameter to plugin interface
- [x] Updated Claude and Cursor plugins to support dryRun

### Bug 2 Fix: Git check-ignore path handling
- [x] Debug actual paths being passed to `git check-ignore`
- [x] Ensure paths are relative to git root
- [x] Add test with real git repo and glob patterns
- [x] Added tests for directory globs (`local/`) and wildcard globs (`*.local.txt`)

### Bug 3 Fix: isNewFile false positive
- [x] Debug path resolution in plugin emit vs. CLI
- [x] Check if absolute vs. relative paths cause mismatch
- [x] Fixed: Convert absolute paths to relative paths in CLI before passing to git functions
- [x] Using `path.relative(resolvedPath, w.path)` for all git operations

### Bug 4 Fix: Empty globs validation
- [x] Add validation in Claude plugin for empty globs
- [x] Skip FileRule hook creation if globs are empty/invalid
- [x] Emit warning about skipped FileRule (WarningCode.Skipped)
- [x] Add test for empty globs scenario (5 new tests added)

### Enhancement 1: Use .md extension for FileRule files
- [x] Change `.txt` → `.md` in Claude plugin emit
- [x] Update test expectations for `.md` extension
- [x] Verify syntax highlighting works in IDEs

---

## Files to Modify

| File | Bug(s) / Enhancement | Changes |
|------|---------------------|---------|
| `packages/cli/src/index.ts` | B1, B3 | Refactor git logic, debug paths |
| `packages/plugin-claude/src/emit.ts` | B4, E1 | Validate globs, change `.txt` → `.md` |
| `packages/cli/test/git-ignore.test.ts` | B1, B2 | Add dry-run and glob tests |
| `packages/plugin-claude/test/emit.test.ts` | B4, E1 | Add empty globs test, update `.md` expectations |

## Test Plan

### Bug 1 Tests
```
✓ dry-run with --gitignore-output-with ignore shows planned .gitignore changes
✓ dry-run with --gitignore-output-with exclude shows planned exclude changes
✓ dry-run does NOT write to gitignore files
```

### Bug 2 Tests
```
✓ source under `.cursor/rules/local/` with `local/` in .git/info/exclude → output ignored
✓ glob pattern `*.local.mdc` matches and ignores correctly
```

### Bug 3 Tests
```
✓ fresh conversion creates new files with isNewFile: true
✓ re-conversion after reset still has isNewFile: true (files were deleted)
✓ re-conversion without reset has isNewFile: false (files exist)
```

### Bug 4 Tests
```
✓ FileRule with `globs: ` (empty) is NOT converted to hook
✓ FileRule with `globs: []` (empty array) is NOT converted to hook
✓ FileRule with valid globs is converted correctly
```

### Enhancement 1 Tests
```
✓ FileRule emitted to `.a16n/rules/foo.md` (not .txt)
✓ Multiple FileRules get unique .md names (foo.md, foo-2.md, etc.)
✓ Existing tests updated for .md extension
```

## Verification Command

```bash
pnpm format && pnpm lint -- --fix && pnpm build && pnpm test -- --silent
```

## Debugging Notes

### To Debug Bug 3:
1. Add `console.error()` to `packages/plugin-claude/src/emit.ts` before `fs.access()` calls
2. Run conversion and check:
   - What path is being checked?
   - Is it absolute or relative?
   - Does `fs.access()` succeed or fail?
3. Compare with the path in `result.written[].path`
