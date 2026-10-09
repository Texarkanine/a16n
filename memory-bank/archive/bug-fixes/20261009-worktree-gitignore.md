---
task_id: worktree-gitignore
complexity_level: 2
date: 2026-10-09
status: completed
---

# TASK ARCHIVE: Honor gitignore modes in linked worktrees

## SUMMARY

`a16n convert` with `--gitignore-output-with exclude` (and the other gitignore styles) now works inside a linked git worktree. `exclude` and `hook` still write Git's shared `info/exclude` and `hooks/pre-commit`, so one worktree changes every worktree of that repository. That scope is stated once, on [Usage Notes](packages/docs/docs/cli/usage-notes.md), in `## Git Ignore Styles` and a `:::warning Repository-wide` admonition. Split Directories and Path Reference Rewriting moved to that same page. The CLI overview keeps installation, examples, and output format.

Pull request: https://github.com/Texarkanine/a16n/pull/185 (`fix(cli): honor gitignore modes in linked worktrees`), open on `worktrees` at archive time.

## REQUIREMENTS

- `ignore`, `exclude`, `hook`, and `match` succeed in a linked worktree the same way they do in a normal checkout.
- A normal repository, where `.git` is a directory, keeps its previous behavior.
- The reported failure was `npx a16n convert --from cursor --to claude --gitignore-output-with exclude --rewrite-path-refs` inside a worktree, exiting with `Cannot use --gitignore-output-with 'exclude': not a git repository`.
- Keep `exclude` and `hook` on the common git directory. Document that once. Do not repeat it in `--help`, the generated CLI reference, the FAQ, command examples, or code comments.
- `exclude` writes `info/exclude` for the whole target repository. `hook` writes `hooks/pre-commit` for the whole target repository and unstages the listed paths on commit in every worktree. `match` and `--if-gitignore-conflict` values `exclude` and `hook` do the same when they select those styles. `ignore` stays in the target checkout's `.gitignore` until that file is committed.
- The three flag essays live together on Usage Notes. The overview and the reference landing page link there. The reference landing page stays the version picker.

## IMPLEMENTATION

`packages/cli/src/git-ignore.ts`:

- `isGitRepo` treats a `.git` directory as a repository, and a `.git` file whose contents start with `gitdir:` as a linked worktree.
- `gitMetadataPath` joins `.git/<relative>` when `.git` is a directory, so tests that fake a `.git` directory do not need a real git process. When `.git` is a file, it resolves `info/exclude` and `hooks/pre-commit` with `git rev-parse --git-path`. Those paths live in the common git directory.
- `addToGitExclude`, `removeFromGitExclude`, `updatePreCommitHook`, and `removeFromPreCommitHook` use that resolver.

Docs:

- `packages/docs/docs/cli/usage-notes.md` holds Git Ignore Styles, Split Directories, and Path Reference Rewriting. The page opens by stating its job: an explanation belongs here when the CLI Reference listing leaves out something a reader needs in order to use an option or command. The opening does not name the sections that exist today. Section headings are title case.
- Git Ignore Styles defines each `--gitignore-output-with` style in a table (what it writes, who it affects) and warns that `exclude` and `hook` update files Git shares with every linked worktree.
- `packages/docs/docs/cli/index.md` no longer hosts those essays. After Examples it points at the CLI Reference for the full list and at Usage Notes for further explanation. See Also links to Usage Notes.
- `packages/docs/docs/cli/reference.mdx` points at the overview for examples and at Usage Notes for further explanation. It does not host the essays.
- `packages/docs/sidebars.js` lists `cli/usage-notes` after `cli/index`.

Creative choice, from `creative-cli-flag-essays.md`: one page titled Usage Notes, under CLI. Rejected: leaving the essays on the overview, one page per behavior, and parking them in the FAQ or Understanding Conversions. The generated reference stays the flag catalog.

`productContext.md`, `systemPatterns.md`, and `techContext.md` were left unchanged. The docs page is the contract for the repository-wide fact.

## TESTING

Code: unit tests in `packages/cli/test/git-ignore.test.ts` and CLI e2e tests in `packages/cli/test/e2e/cli-gitignore.test.ts` cover `ignore`, `exclude`, `hook`, and `match` inside a linked worktree. At that build, CLI vitest reported 241 passed, `tsc` succeeded, and `pnpm lint:check` was clean. Semantic QA of `git-ignore.ts` and those tests: PASS, advisories only.

Docs rework: prose, so no new tests and no change-detectors. Preflight: PASS WITH ADVISORY. Advisory 1 sketched a runtime warning when the resolved path lives in the common git dir; it was not adopted, because the brief kept the behavior and limited the change to docs. Advisory 2 preferred "chooses how converted files are git-ignored" over "chooses whether converted files are tracked"; the Usage Notes opening uses the first wording. Build ran `pnpm build`, `pnpm test`, and `pnpm lint:check`, all succeeded. Semantic QA of the section, table, conflict sentence, and admonition: PASS. The only note was that opening-sentence wording, already applied.

Reflection (`reflection-worktree-gitignore.md`) covered the docs section as first placed on the overview. The later move onto Usage Notes, and the preamble that does not name current sections, are recorded in progress after that reflection.

## LESSONS LEARNED

- A worktree's `.git` is a file (`gitdir: …`). A directory check reports "not a git repository." `ignore`, tracking checks, and `git check-ignore` already worked from a worktree. The directory check and the hardcoded `.git/` writes were what failed.
- `info/exclude` and `hooks/` are shared. Writing them from any worktree changes the main checkout and every other worktree. `hook` unstages the listed paths on commit in every worktree.
- Say that once, on Usage Notes. A later edit that copies the warning into help, the FAQ, examples, or comments splits the contract.
- The overview is installation, examples, and output format. A section that explains a consequence or a mode table belongs on Usage Notes as its own section. `--dry-run`, `--json`, `--quiet`, and `--verbose` stay in Examples and in the generated reference.
- A page preamble states what the page is for, so it stays true when a section is added. It does not list the sections that exist today.

## PROCESS IMPROVEMENTS

A verification pass will propose a runtime guard for a footgun the operator has already chosen to keep. The brief's "docs only, this section only" line is what kept that proposal from becoming scope. Record that constraint in the plan so the next preflight does not re-open it.

## TECHNICAL IMPROVEMENTS

None adopted. The preflight runtime-guard sketch stays out of scope: when `git rev-parse --git-common-dir` differs from `--git-dir`, convert would print a warning naming the shared file it is about to modify. That is new executable behavior plus tests, which contradicts the docs-only decision.

## NEXT STEPS

https://github.com/Texarkanine/a16n/pull/185 is open, mergeable, and green (CI and CodeRabbit) as of this archive. Merging it is the remaining step. It is the operator's call.
