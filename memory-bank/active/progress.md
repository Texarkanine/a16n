# Progress

Document, in one section of the CLI overview, that `--gitignore-output-with` `exclude` and `hook` write repository-wide git metadata. Include a warning admonition in that section.

**Complexity:** Level 2

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

## 2026-10-08 - QA - COMPLETE

* Work completed
    - Semantic review of the `git-ignore.ts` change and its tests against the brief
    - Result: PASS, advisories only

## 2026-10-09 - QA - COMPLETE

* Work completed
    - Opened draft pull request https://github.com/Texarkanine/a16n/pull/185 on branch `worktrees`
* Decisions made
    - Title `fix(cli): honor gitignore modes in linked worktrees` so a squash merge can cut a CLI release

## 2026-10-09 - REWORK - INITIATED

* Work completed
    - Recorded the operator's choice to rework rather than archive
* Decisions made
    - Keep `exclude` and `hook` writing the common git directory
* Insights
    - Operator feedback: document that footgun in one section on the CLI overview, with a Docusaurus warning admonition in that section. Do not sprinkle it through help text, the generated reference, the FAQ, examples, comments, or the memory bank.

## 2026-10-09 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified the rework as a single-page docs enhancement
* Decisions made
    - Level 2: the change adds one explanation section and one warning admonition to `packages/docs/docs/cli/index.md`
* Insights
    - This is prose. The always-TDD rule puts user-facing docs outside the test cycle.
