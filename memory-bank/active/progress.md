# Progress

Make every `--gitignore-output-with` mode (`ignore`, `exclude`, `hook`, `match`) work when `a16n convert` runs inside a git worktree, while leaving normal checkouts unchanged.

**Complexity:** Level 1

## 2026-10-08 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed intent: all gitignore-output modes must work in a linked worktree
    - Classified the task as a single-component bug fix in CLI gitignore management
* Decisions made
    - Level 1: the failure is `isGitRepo` and the paths that assume `.git` is a directory, all inside the CLI
* Insights
    - A worktree's `.git` is a file (`gitdir: …`), so a directory check reports "not a git repository"

## 2026-10-08 - BUILD - COMPLETE

* Work completed
    - `isGitRepo` accepts a linked worktree's `gitdir:` file
    - Exclude and hook reads and writes resolve through `git rev-parse --git-path` when `.git` is not a directory
    - Unit and CLI e2e tests cover `ignore`, `exclude`, `hook`, and `match` inside a linked worktree
    - CLI vitest: 241 passed. `tsc` succeeded. `pnpm lint:check` clean
* Decisions made
    - A normal checkout still joins `.git/<path>` so existing tests that fake a `.git` directory do not need a real git process
    - Worktree admin paths are whatever git reports, because `info/exclude` and hooks live in the common git directory
* Insights
    - `ignore`, tracking checks, and `git check-ignore` already worked from a worktree; only the directory check and the hardcoded `.git/` writes failed
