# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task: Phase 5 Enhancement - `--if-gitignore-conflict` Flag

**Status:** Planning Complete
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
- [ ] Add `--if-gitignore-conflict` option to `convert` command
- [ ] Validate flag values: `skip`, `ignore`, `exclude`, `hook`, `commit`
- [ ] Only applicable when `--gitignore-output-with match` is used
- [ ] Default value: `skip`

#### Phase 2: New Utility Function for `commit` Option
- [ ] Add `removeFromGitIgnore(root, entries)` to `git-ignore.ts`
  - Remove entries from `# BEGIN a16n managed` section in `.gitignore`
  - Only removes entries WE added (within semaphore), not user entries
- [ ] Add `removeFromGitExclude(root, entries)` to `git-ignore.ts`
  - Remove entries from semaphore section in `.git/info/exclude`
- [ ] Add `removeFromPreCommitHook(root, entries)` to `git-ignore.ts`
  - Remove entries from semaphore section in pre-commit hook
  - Update the `git reset HEAD --` command to exclude removed entries
- [ ] Add unit tests for all removal functions

#### Phase 3: Conflict Resolution Logic
- [ ] Update match mode in `packages/cli/src/index.ts`:
  - When conflict detected, check `--if-gitignore-conflict` value
  - `skip`: Current behavior - emit warning, skip gitignore management
  - `ignore`: Add to `.gitignore` via `addToGitIgnore()`
  - `exclude`: Add to `.git/info/exclude` via `addToGitExclude()`
  - `hook`: Add to pre-commit hook via `updatePreCommitHook()`
  - `commit`: Remove from all a16n-managed locations
- [ ] Handle both conflict scenarios:
  - Source conflict (mixed source statuses)
  - Destination conflict (existing file with different status)

#### Phase 4: Tests
- [ ] Unit tests for removal functions in `git-ignore.test.ts`
- [ ] CLI tests for `--if-gitignore-conflict` flag validation
- [ ] Integration tests for each option value:
  - `skip`: Emits warning, no gitignore changes
  - `ignore`: Conflicting file added to `.gitignore`
  - `exclude`: Conflicting file added to `.git/info/exclude`
  - `hook`: Conflicting file added to pre-commit hook
  - `commit`: Conflicting file removed from a16n-managed sections

#### Phase 5: Verification
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Lint passes

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

### Estimated Effort

| Phase | Estimate |
|-------|----------|
| CLI flag addition | 30 min |
| Removal functions | 1.5 hours |
| Conflict resolution logic | 1.5 hours |
| Tests | 2 hours |
| Verification | 30 min |
| **Total** | ~6 hours |

---

## Previous Task: CR-10 Source Tracking (Complete)

**Status:** ✅ Implementation Complete, Reflection Done

See `memory-bank/archive/` for archived details.
