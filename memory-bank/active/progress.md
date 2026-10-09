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

## 2026-10-09 - PLAN - COMPLETE

* Work completed
    - Planned one section, `## Git ignore styles`, and one `:::warning Repository-wide` admonition
    - Placed the section after Examples and before Split Directories
    - Recorded that no other file changes and that docs prose gets no test
* Decisions made
    - The warning states the shared-file consequence. The table defines every style
* Insights
    - A reader who copies the `exclude` example meets the warning next, before Split Directories

## 2026-10-09 - BUILD - COMPLETE

* Work completed
    - Added the Git ignore styles section and the Repository-wide warning to `packages/docs/docs/cli/index.md`
    - `pnpm build`, `pnpm test`, and `pnpm lint:check` succeeded
* Decisions made
    - Used preflight's wording for the opening sentence: the flag chooses how converted files are git-ignored
    - Did not add a runtime warning
* Insights
    - The section is the only user-facing statement of the shared-file scope

## 2026-10-09 - QA - COMPLETE

* Work completed
    - Semantic review of the `## Git ignore styles` section and `:::warning Repository-wide` admonition against the implementation plan
    - Result: PASS, one non-blocking advisory (opening-sentence wording follows preflight advisory 2; semantically equivalent to the plan)
* Decisions made
    - No build changes required: placement, table, conflict sentence, admonition title/body/syntax, and untouched-files list all check out
* Insights
    - The `::::warning` seen in grep output was the ripgrep `line:` separator prefix; the reference admonition is `:::warning`, matching the implementation

## 2026-10-09 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the plan against codebase reality: insertion point, admonition syntax, table facts, and untouched-files list all check out
    - Result: PASS WITH ADVISORY (two advisories: a runtime worktree-guard sketch and one micro-wording note; no plan edits made)
* Decisions made
    - TDD encoding passes: docs prose/policy owes no tests per the always-TDD rule, and no change-detectors are scheduled
* Insights
    - Table claims verified against `convert.ts` and `git-ignore.ts`, so the build is a pure transcription step

## 2026-10-09 - REFLECT - COMPLETE

* Work completed
    - Wrote `memory-bank/active/reflection/reflection-worktree-gitignore.md`
    - Left `productContext.md`, `systemPatterns.md`, and `techContext.md` unchanged
* Decisions made
    - The docs page is the contract for this fact. The persistent files do not need a copy
* Insights
    - A preflight runtime-guard suggestion stays out of scope when the brief says the behavior is kept and the change is docs only

## 2026-10-09 - CREATIVE - COMPLETE

* Work completed
    - Explored where the three CLI flag essays should live
    - Moved Git ignore styles, Split directories, and Path reference rewriting onto `packages/docs/docs/cli/usage-notes.md`
* Decisions made
    - One page titled Usage notes, under CLI, after the overview
    - The reference landing page stays the version picker and links to the overview and to Usage notes
* Insights
    - The overview remains installation, examples, and output format

## 2026-10-09 - USAGE NOTES PREAMBLE - COMPLETE

* Work completed
    - Replaced the Usage Notes opening so it states the page's job without naming the current sections
    - Pointed the overview, after Examples, at the reference for the full command list and at Usage Notes for further explanation
* Decisions made
    - A new explanation belongs on Usage Notes as its own section when the reference entry leaves out something a reader needs in order to use the option or command
    - Section headings on that page stay in title case
* Insights
    - Another session had already capitalized the headings and drafted a shorter opening. That opening described consequences and did not say what a later section is for
