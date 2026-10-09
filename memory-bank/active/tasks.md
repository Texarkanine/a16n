# Tasks

## Worktree gitignore management

### Build — complete

- **What broke:** `exclude`, `hook`, and `match` treated a linked worktree as not a git repository. `ignore` already wrote `.gitignore` in the checkout and kept working.
- **Why:** `isGitRepo` required `.git` to be a directory. A linked worktree's `.git` is a `gitdir:` file. `info/exclude` and `hooks/pre-commit` live in the common git directory, not under that file.
- **What changed:** `isGitRepo` accepts a `gitdir:` file. Exclude and hook reads and writes use `git rev-parse --git-path` when `.git` is not a directory. A normal checkout still uses `.git/<path>`.
- **Files:** `packages/cli/src/git-ignore.ts`, `packages/cli/test/git-ignore.test.ts`, `packages/cli/test/e2e/cli-gitignore.test.ts`
- **Verification:** `pnpm exec tsc` in `packages/cli` succeeded. `pnpm exec vitest run` in `packages/cli` — 241 passed. Root `pnpm lint:check` clean.
