# TASK ARCHIVE: Phase 5 - Git Ignore Output Management (Core)

## METADATA

| Field | Value |
|-------|-------|
| Task ID | PHASE5-GITIGNORE |
| Date Started | 2026-01-26 |
| Date Completed | 2026-01-27 |
| Complexity Level | Level 3 (Intermediate Feature) |
| Branch | phase-5 |

## SUMMARY

Implemented `--gitignore-output-with <style>` CLI flag with 5 styles (`none`, `ignore`, `exclude`, `hook`, `match`) to automatically manage git-ignore status of converted output files. This is the core Phase 5 feature that enables users to control whether generated AI rule files are tracked in git.

## REQUIREMENTS

### Problem Statement
Users needed control over whether converted output files (e.g., `CLAUDE.md`, `.cursor/rules/*.mdc`) are tracked in git or ignored. Different workflows require different approaches:
- Some want outputs ignored (ephemeral, regenerated)
- Some want outputs tracked (versioned, shared)
- Some want to match source behavior

### Solution: 5 Styles

| Style | Behavior |
|-------|----------|
| `none` | Default. No git management |
| `ignore` | Add new outputs to `.gitignore` |
| `exclude` | Add new outputs to `.git/info/exclude` |
| `hook` | Add pre-commit hook to auto-reset outputs |
| `match` | Mirror source file's git status to output |

## IMPLEMENTATION

### Components Built

1. **CLI Flag** - `--gitignore-output-with <style>` option on convert command
2. **WrittenFile.isNewFile** - Track whether output is new or overwriting existing
3. **Git Utilities Module** (`git-ignore.ts`) - 6 functions:
   - `isGitRepo()` - Check for .git directory
   - `isGitIgnored()` - Use git check-ignore
   - `isGitTracked()` - Use git ls-files
   - `addToGitIgnore()` - Append with semaphore pattern
   - `addToGitExclude()` - Append to .git/info/exclude
   - `updatePreCommitHook()` - Create/update executable hook
4. **ConversionResult.gitIgnoreChanges** - Report git changes in JSON output
5. **BoundaryCrossing Warning** - Warn when source crosses .gitignore/.git/info/exclude boundary

### Files Modified

| File | Changes |
|------|---------|
| `packages/models/src/types.ts` | Added `isNewFile` to WrittenFile |
| `packages/plugin-claude/src/emit.ts` | Track isNewFile |
| `packages/plugin-cursor/src/emit.ts` | Track isNewFile |
| `packages/cli/src/index.ts` | Add flag, implement all 5 styles |
| `packages/cli/src/git-ignore.ts` | New module with 6 functions |
| `packages/cli/src/output.ts` | Format git changes for display |

## TESTING

- 20 unit tests for git utilities
- Plugin emit tests updated for `isNewFile`
- 232 tests passing at completion

## LESSONS LEARNED

### Technical
- `git check-ignore` is authoritative for ignore status but requires valid git repo
- Glob patterns in `.gitignore` can match files without explicit listing
- `fs.access()` is cleanest way to check file existence in Node.js
- Semaphore pattern (from ai-rizz) works well for tool-managed sections

### Process
- Manual testing is essential even with high test coverage
- Spec review should include "how will we verify each AC?"
- Bug discovery after "completion" is normal - plan for it

### Architecture
- Clean separation: git utilities module is reusable and well-documented
- Default `none` style preserves backward compatibility
- Error handling: Non-git-repo errors caught with helpful messages

## REFERENCES

| Document | Notes |
|----------|-------|
| Phase 5 Spec | `planning/PHASE_5_SPEC.md` |
| Follow-up | Bug fixes in PHASE5-BUGFIXES archives |

---

**Note:** This core implementation was followed by multiple bug fix rounds (B1-B8) documented in separate archives.
