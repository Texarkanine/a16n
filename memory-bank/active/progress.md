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
