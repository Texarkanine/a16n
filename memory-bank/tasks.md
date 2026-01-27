# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

| Field | Value |
|-------|-------|
| **Task ID** | PHASE5-BUGFIXES-2 |
| **Title** | Phase 5 Bug Fixes - Round 2 |
| **Complexity** | Level 2 (Simple Enhancement) |
| **Type** | Bug Fix |
| **Parent** | PHASE5-BUGFIXES |
| **Estimated Effort** | 1-2 hours |
| **Build Status** | ✅ Complete |
| **Reflection Status** | ⏳ Pending |

## Summary

Fixed all 8 bugs discovered during Phase 5 implementation and testing (all complete).

## New Bug Report (Round 3)

### Bug 8: Semaphore section replaces instead of accumulates (High)

**Symptom:** When running conversion multiple times with `--gitignore-output-with match`, the semaphore section loses previously added entries. Only the newest files are kept.

**Execution trace:**
```
# First run - creates CLAUDE.md, skills, etc. All added to .git/info/exclude
# Second run - user added a FileRule (helm-templates.mdc)
$ a16n convert --from cursor --to claude --gitignore-output-with match --verbose

[verbose] No new files to manage (all outputs are edits to existing files)
# But .git/info/exclude only has:
# .a16n/rules/helm-templates.md
# .claude/settings.local.json
# Missing: CLAUDE.md, .claude/skills/*, etc.
```

**Expected:** Semaphore section should accumulate entries across runs. Previously added files should remain.

**Root Cause:** In `git-ignore.ts`, `updateSemaphoreSection()` at lines 316-324:
```typescript
if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
  // Replace existing semaphore section  <-- BUG: REPLACES instead of MERGES
  result = [
    ...lines.slice(0, beginIndex),
    SEMAPHORE_BEGIN,
    ...entries,  // <-- Only new entries, loses existing ones
    SEMAPHORE_END,
    ...lines.slice(endIndex + 1),
  ];
}
```

**Fix:** Modify `updateSemaphoreSection()` to:
1. Extract existing entries from the semaphore section
2. Merge them with new entries (union, deduplicated)
3. Write the merged list

---

## New Bug Reports (Round 2)

### Bug 5: FileRule vs AgentSkill Classification (Medium)

**Symptom:** When a Cursor rule has empty `globs:` but has `description:`, it's classified as FileRule instead of AgentSkill. The Claude emit then skips it with "FileRule skipped due to empty globs".

**Example input:**
```yaml
---
description: when to do a thing properly
globs: 
alwaysApply: false
---

rule content...
```

**Expected:** Should be classified as AgentSkill (has description, no valid globs).

**Root Cause:** In `packages/plugin-cursor/src/discover.ts` line 86:
```typescript
if (frontmatter.globs) {  // truthy even for whitespace-only string
  const globs = parseGlobs(frontmatter.globs);
  return { ... } as FileRule;  // BUG: doesn't check if globs array is non-empty
}
```

**Correct precedence (per Cursor docs):**
1. `alwaysApply: true` → GlobalPrompt
2. `globs` (non-empty after parsing) → FileRule
3. `description` → AgentSkill
4. None of above → manual rule (fallback to GlobalPrompt)

**Fix:** Check if `parseGlobs()` returns a non-empty array before classifying as FileRule.

---

### Bug 6: Dry-run match mode missing per-file details (Low) ✅ Fixed

---

### Bug 7: Match mode uses wrong gitignore destination (High)

**Symptom:** When source files are ignored via `.git/info/exclude`, the `match` mode incorrectly adds output files to `.gitignore` instead of `.git/info/exclude`.

**Execution trace:**
```
$ cat .git/info/exclude
.cursor/rules/local/

$ a16n convert --from cursor --to claude --dry-run --gitignore-output-with match
Would update .gitignore (6 entries)        # WRONG! Should be .git/info/exclude
  CLAUDE.md → .gitignore                   # WRONG!
```

**Expected:** Output files should go to the SAME ignore file as their source. If source is ignored via `.git/info/exclude`, output should also go to `.git/info/exclude`.

**Root Cause:** In `packages/cli/src/index.ts` match mode:
1. `isGitIgnored()` only returns boolean - doesn't tell us WHERE the source is ignored
2. Always calls `addToGitIgnore()` regardless of where source was ignored

**Fix:**
1. Add `getIgnoreSource()` function using `git check-ignore --verbose`
2. Update match mode to route outputs to the same destination as source
3. May need to track multiple destinations if sources come from different ignore files

**git check-ignore --verbose output format:**
```
<source>:<linenum>:<pattern><TAB><pathname>
```
Example: `.git/info/exclude:5:.cursor/rules/local/    .cursor/rules/local/foo.mdc`

---

### Bug 6 (Original): Dry-run match mode missing per-file details (Low)

**Symptom:** When using `--gitignore-output-with match` in dry-run, output shows:
```
Would update .gitignore (X entries)
```

But doesn't show WHICH files would be gitignored and to WHICH destination.

**Expected:** Dry-run with match mode should show per-file details:
```
Would gitignore:
  CLAUDE.md → .gitignore
  .a16n/rules/local.md → .gitignore
```

**Root Cause:** In `packages/cli/src/index.ts` lines 231-236, the output only shows summary, not per-file breakdown.

**Fix:** When `--gitignore-output-with match` and `--dry-run`, show which files would be added to which gitignore destination.

---

## Previous Bug Reports (Round 1 - All Fixed)

### Bug 1: Dry-run doesn't show planned git changes (Medium) ✅

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

## Implementation Checklist (Round 2)

### Bug 5 Fix: FileRule vs AgentSkill classification ✅
- [x] Add test for rule with empty `globs:` and `description:` → should be AgentSkill
- [x] Add test for rule with valid globs to verify no regression
- [x] Fix `classifyRule()` in `packages/plugin-cursor/src/discover.ts` to check parsed globs length
- [x] Update classification comment/docstring for clarity
- [x] Verify no regression for rules with valid globs

### Bug 6 Fix: Dry-run match mode per-file details ✅
- [x] Add test for dry-run match mode showing per-file details
- [x] Update CLI output to show per-file gitignore destinations in match mode
- [x] Only show detailed output for match mode (other modes are straightforward)

### Bug 7 Fix: Match mode gitignore destination attribution ✅
- [x] Add `getIgnoreSource()` function to `git-ignore.ts` using `git check-ignore --verbose`
- [x] Add tests for `getIgnoreSource()` returning correct source file
- [x] Update match mode in CLI to:
  - [x] Get ignore source for each source file
  - [x] Group output files by destination (`.gitignore` vs `.git/info/exclude`)
  - [x] Add outputs to correct destination(s)
- [x] Add integration test for match mode routing to `.git/info/exclude`
- [x] Update dry-run output to show correct destination per file

### Bug 8 Fix: Semaphore section accumulation ✅
- [x] Add test for semaphore section preserving existing entries on subsequent runs
- [x] Add test for deduplication (same entry added twice should appear once)
- [x] Add test for sorted entries (deterministic output)
- [x] Add test for addToGitExclude accumulation
- [x] Modify `updateSemaphoreSection()` to:
  - [x] Extract existing entries from between semaphore markers
  - [x] Merge with new entries (union)
  - [x] Deduplicate entries (using Set)
  - [x] Sort entries alphabetically
  - [x] Write merged list
- [x] Verify all existing tests still pass (289 tests)

---

## Previous Implementation Checklist (Round 1 - All Complete)

### Bug 1 Fix: Dry-run git preview ✅
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

## Files to Modify (Round 2 + Round 3)

| File | Bug(s) | Changes |
|------|--------|---------|
| `packages/plugin-cursor/src/discover.ts` | B5 ✅ | Check parsed globs length before classifying as FileRule |
| `packages/plugin-cursor/test/discover.test.ts` | B5 ✅ | Add tests for empty/whitespace globs with description |
| `packages/cli/src/index.ts` | B6 ✅, B7 ✅ | Show per-file details; route to correct destination |
| `packages/cli/test/cli.test.ts` | B6 ✅, B7 ✅ | Add tests for match mode per-file output and routing |
| `packages/cli/src/git-ignore.ts` | B7 ✅, B8 | Add `getIgnoreSource()`; fix semaphore accumulation |
| `packages/cli/test/git-ignore.test.ts` | B7 ✅, B8 | Add tests for `getIgnoreSource()` and accumulation |

## Files Modified (Round 1 - Complete)

| File | Bug(s) / Enhancement | Changes |
|------|---------------------|---------|
| `packages/cli/src/index.ts` | B1, B3 | Refactor git logic, debug paths |
| `packages/plugin-claude/src/emit.ts` | B4, E1 | Validate globs, change `.txt` → `.md` |
| `packages/cli/test/git-ignore.test.ts` | B1, B2 | Add dry-run and glob tests |
| `packages/plugin-claude/test/emit.test.ts` | B4, E1 | Add empty globs test, update `.md` expectations |

## Test Plan (Round 2)

### Bug 5 Tests ✅
```
- Rule with `globs:` (empty string) + `description:` → AgentSkill (not FileRule)
- Rule with `globs: ` (whitespace) + `description:` → AgentSkill (not FileRule)
- Rule with valid `globs: **/*.ts` → FileRule (no regression)
- Rule with valid `globs: **/*.ts` + `description:` → FileRule (globs takes precedence)
```

### Bug 6 Tests ✅
```
- Dry-run with --gitignore-output-with match shows per-file details
- Output format: "  <filename> → <destination>"
- Only match mode shows per-file details (other modes show summary)
```

### Bug 7 Tests ✅
```
Unit tests for getIgnoreSource():
- Returns '.gitignore' when file is ignored via .gitignore
- Returns '.git/info/exclude' when file is ignored via .git/info/exclude
- Returns null when file is not ignored
- Works with glob patterns (e.g., 'local/' matches 'local/foo.txt')

Integration tests for match mode:
- Source in .git/info/exclude → output goes to .git/info/exclude
- Source in .gitignore → output goes to .gitignore
- Mixed sources → outputs grouped by destination
- Dry-run shows correct destination per file
```

### Bug 8 Tests
```
Unit tests for updateSemaphoreSection accumulation:
- addToGitIgnore preserves existing entries when adding new ones
- addToGitExclude preserves existing entries when adding new ones
- Duplicate entries are deduplicated (same file added twice → appears once)
- Order of entries is deterministic (sorted alphabetically)
- Entries from outside semaphore section are not affected
```

---

## Test Plan (Round 1 - Complete)

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
