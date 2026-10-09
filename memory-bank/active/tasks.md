# Tasks

## Worktree gitignore management

### Build — complete

- **What broke:** `exclude`, `hook`, and `match` treated a linked worktree as not a git repository. `ignore` already wrote `.gitignore` in the checkout and kept working.
- **Why:** `isGitRepo` required `.git` to be a directory. A linked worktree's `.git` is a `gitdir:` file. `info/exclude` and `hooks/pre-commit` live in the common git directory, not under that file.
- **What changed:** `isGitRepo` accepts a `gitdir:` file. Exclude and hook reads and writes use `git rev-parse --git-path` when `.git` is not a directory. A normal checkout still uses `.git/<path>`.
- **Files:** `packages/cli/src/git-ignore.ts`, `packages/cli/test/git-ignore.test.ts`, `packages/cli/test/e2e/cli-gitignore.test.ts`
- **Verification:** `pnpm exec tsc` in `packages/cli` succeeded. `pnpm exec vitest run` in `packages/cli` — 241 passed. Root `pnpm lint:check` clean.

### QA — PASS

- Source change is minimal: `isGitRepo` accepts a `gitdir:` file, and one helper (`gitMetadataPath`) replaces four hardcoded `.git/...` joins. Normal checkouts keep the `.git/<path>` fast path.
- Tests use real linked worktrees and assert through `git check-ignore` / `git rev-parse --git-path`, not on implementation details.
- Advisory: the `file` field returned from `addToGitExclude` / `updatePreCommitHook` stays `.git/info/exclude` / `.git/hooks/pre-commit` as a display label in a worktree. Acceptable.
- Advisory: the `ignore` and `match` worktree tests are regression coverage; those modes already worked.
- No project docs describe the "not a git repository" behavior, so none needed updating.
- Verification: CLI vitest 241 passed; `tsc --noEmit` clean.
