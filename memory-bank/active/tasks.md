# Task: Document repository-wide gitignore scope

* Task ID: worktree-gitignore
* Complexity: Level 2
* Type: simple enhancement

Add one section to the CLI overview that defines each `--gitignore-output-with` style, including who the write affects, and one warning admonition for the repository-wide styles.


## Test Plan (TDD)

### Behaviors to Verify

No new executable behavior.

### Test Infrastructure

- Framework: Vitest (unchanged; not used for this task)
- Test location: not applicable
- Conventions: user-facing docs are prose/policy and are not covered by a change-detector
- New test files: none

## Implementation Plan

### 1. Git ignore styles section — prose/policy

- Files: `packages/docs/docs/cli/index.md`
- No tests: prose/policy artifact

1. Insert a `## Git ignore styles` section after the Examples section and before `## Split Directories`.
2. Open with one sentence: the flag chooses whether converted files are tracked, and it writes in the target repository (`--to-dir` when that flag is set).
3. Add this table:

    | Style | What it writes | Who it affects |
    | --- | --- | --- |
    | `none` | Nothing | |
    | `ignore` | `.gitignore` in the target checkout | That checkout, until the `.gitignore` change is committed |
    | `exclude` | `info/exclude` | The whole target repository, including every linked worktree |
    | `hook` | `hooks/pre-commit` | The whole target repository. The hook unstages those paths on commit |
    | `match` | The same kind of file that ignores the source | A source ignored through `info/exclude` is written as `exclude` |

4. One sentence after the table: `--if-gitignore-conflict` values `exclude` and `hook` write those same repository files.
5. Add a Docusaurus admonition, matching `:::warning Lossy conversion` in `packages/docs/docs/plugin-agentsmd/index.md`:

    ~~~markdown
    :::warning Repository-wide

    `exclude` and `hook` update files Git shares with every linked worktree. Running either one inside a worktree changes the main checkout too. `hook` unstages the listed paths on commit in every worktree. `match` and `--if-gitignore-conflict` do this when they select `exclude` or `hook`.

    :::
    ~~~

6. Do not edit the Examples block, the Split Directories bullet, `--help` in `packages/cli/src/index.ts`, the FAQ, code comments, or any other doc page.

## Technology Validation

No new technology - validation not required

## Dependencies

- Existing Docusaurus `:::warning` admonition syntax

## Challenges & Mitigations

- The warning restates the table and a later edit copies both into the FAQ or the example comment: the warning states only the shared-file consequence. The table remains the definition of every style. Step 6 names the files that stay untouched.
- `match` is easy to describe as "mirrors the source" and omit that an exclude source becomes a repository-wide exclude: the table's `match` cell and the warning's last sentence both say that, in this section only.

## Pre-Mortem

- The section lands after Split Directories, so a reader who copies the `exclude` example never sees the warning: the plan inserts the section immediately after Examples, before Split Directories.
- The warning is titled "Worktrees" and the repository-wide fact gets rewritten as a special case in other pages: the title is `Repository-wide`, and worktrees are named in the body of this one admonition.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
