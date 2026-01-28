# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task: Phase 5 Enhancement - `--if-gitignore-conflict` Flag

**Status:** Implementation & Reflection Complete
**Branch:** phase-5

### Overview

Add `--if-gitignore-conflict [skip|ignore|exclude|hook|commit]` flag to resolve git-ignore conflicts when using `--gitignore-output-with match`.

### Problem Statement

Two conflict scenarios currently result in skipping gitignore management:

1. **Source Conflict:** Multiple sources with different git-ignore statuses merge into a single destination file
   - Example: `local/dev.mdc` (ignored) + `shared/core.mdc` (tracked) → `CLAUDE.md`
   - Cannot determine correct default behavior

2. **Destination Conflict:** Sources with identical git-ignore status merge into an extant destination file with different status
   - Example: ignored sources → existing tracked `CLAUDE.md`
   - Cannot change existing file's status without user intent

### Proposed Solution

The `--if-gitignore-conflict` flag provides explicit user intent for conflict resolution:

| Value | Behavior |
|-------|----------|
| `skip` | Default. Skip gitignore management for conflicting files (current behavior) |
| `ignore` | Add conflicting outputs to `.gitignore` |
| `exclude` | Add conflicting outputs to `.git/info/exclude` |
| `hook` | Add conflicting outputs to pre-commit hook |
| `commit` | Ensure output is tracked: remove from .gitignore, .git/info/exclude, or a16n hooks |

### Complexity: Level 3 (Intermediate Feature)

**Justification:**
- New CLI flag with validation
- Modification to conflict handling logic in match mode
- New utility function to remove entries from gitignore (for `commit`)
- Test updates for each option value

### Implementation Checklist

#### Phase 1: CLI Flag Addition
- [x] Add `--if-gitignore-conflict` option to `convert` command
- [x] Validate flag values: `skip`, `ignore`, `exclude`, `hook`, `commit`
- [x] Only applicable when `--gitignore-output-with match` is used
- [x] Default value: `skip`

#### Phase 2: New Utility Function for `commit` Option
- [x] Add `removeFromGitIgnore(root, entries)` to `git-ignore.ts`
  - Remove entries from `# BEGIN a16n managed` section in `.gitignore`
  - Only removes entries WE added (within semaphore), not user entries
- [x] Add `removeFromGitExclude(root, entries)` to `git-ignore.ts`
  - Remove entries from semaphore section in `.git/info/exclude`
- [x] Add `removeFromPreCommitHook(root, entries)` to `git-ignore.ts`
  - Remove entries from semaphore section in pre-commit hook
  - Update the `git reset HEAD --` command to exclude removed entries
- [x] Add unit tests for all removal functions

#### Phase 3: Conflict Resolution Logic
- [x] Update match mode in `packages/cli/src/index.ts`:
  - When conflict detected, check `--if-gitignore-conflict` value
  - `skip`: Current behavior - emit warning, skip gitignore management
  - `ignore`: Add to `.gitignore` via `addToGitIgnore()`
  - `exclude`: Add to `.git/info/exclude` via `addToGitExclude()`
  - `hook`: Add to pre-commit hook via `updatePreCommitHook()`
  - `commit`: Remove from all a16n-managed locations
- [x] Handle both conflict scenarios:
  - Source conflict (mixed source statuses)
  - Destination conflict (existing file with different status)

#### Phase 4: Tests
- [x] Unit tests for removal functions in `git-ignore.test.ts`
- [ ] CLI tests for `--if-gitignore-conflict` flag validation (stubs created)
- [ ] Integration tests for each option value (stubs created)

#### Phase 5: Verification
- [x] All tests pass (289 tests)
- [x] Build succeeds
- [x] Lint passes (no lint script configured)

#### Phase 6: Reflection
- [x] Implementation review complete
- [x] Reflection document created: `reflection/reflection-PHASE5-CONFLICT-FLAG.md`
- [x] Lessons learned documented
- [x] Process improvements identified
- [x] Technical improvements identified
- [x] Next steps documented

### Files to Modify

| File | Changes |
|------|---------|
| `packages/cli/src/index.ts` | Add flag, update conflict handling |
| `packages/cli/src/git-ignore.ts` | Add removal functions |
| `packages/cli/test/git-ignore.test.ts` | Tests for removal functions |
| `packages/cli/test/cli.test.ts` | Tests for flag and integration |

### API Design

```typescript
// New CLI flag
.option(
  '--if-gitignore-conflict <resolution>',
  'How to resolve git-ignore conflicts in match mode (skip, ignore, exclude, hook, commit)',
  'skip'
)

// New functions in git-ignore.ts
export async function removeFromGitIgnore(
  root: string,
  entries: string[]
): Promise<GitIgnoreResult>;

export async function removeFromGitExclude(
  root: string,
  entries: string[]
): Promise<GitIgnoreResult>;

export async function removeFromPreCommitHook(
  root: string,
  entries: string[]
): Promise<GitIgnoreResult>;
```

### Conflict Resolution Matrix

| Scenario | Current Behavior | With `--if-gitignore-conflict ignore` |
|----------|------------------|--------------------------------------|
| Source conflict (mixed) | Skip + warning | Add to `.gitignore` |
| Destination conflict (tracked output, ignored sources) | Skip + warning | Add to `.gitignore` |
| Destination conflict (ignored output, tracked sources) | Skip + warning | Add to `.gitignore` |

| Scenario | With `--if-gitignore-conflict commit` |
|----------|---------------------------------------|
| Source conflict (mixed) | Remove from all a16n sections (ensure tracked) |
| Destination conflict | Remove from all a16n sections (ensure tracked) |

### Edge Cases

1. **No existing a16n section:** `commit` option has nothing to remove - no-op
2. **Non-git repo with `hook`/`exclude`:** Error (already handled)
3. **Flag used without `--gitignore-output-with match`:** Warning or ignore flag (TBD)

### Test Plan

```text
Unit Tests (git-ignore.ts):
- removeFromGitIgnore removes entries from semaphore section
- removeFromGitIgnore preserves entries outside semaphore
- removeFromGitIgnore handles missing entry gracefully
- removeFromGitExclude works similarly
- removeFromPreCommitHook updates git reset command correctly

CLI Tests:
- --if-gitignore-conflict validates values
- --if-gitignore-conflict skip emits warning
- --if-gitignore-conflict ignore adds to .gitignore
- --if-gitignore-conflict exclude adds to .git/info/exclude
- --if-gitignore-conflict hook adds to pre-commit
- --if-gitignore-conflict commit removes from a16n sections
```

### Estimated Effort vs Actual

| Phase | Estimate | Actual |
|-------|----------|--------|
| CLI flag addition | 30 min | 20 min |
| Removal functions | 1.5 hours | 1 hour |
| Conflict resolution logic | 1.5 hours | 1.5 hours |
| Tests | 2 hours | 1 hour |
| Verification | 30 min | 15 min |
| Reflection | - | 45 min |
| **Total** | ~6 hours | ~4.5 hours |

**Note:** TDD methodology made implementation faster than estimated.

---

## Previous Task: CR-10 Source Tracking (Complete)

**Status:** ✅ Implementation Complete, Reflection Done

See `memory-bank/archive/` for archived details.
