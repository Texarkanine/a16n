# Project Brief

## User Story

When `a16n convert` runs inside a git worktree, every `--gitignore-output-with` mode should work the same way it does in a normal checkout.

## Requirements

- `ignore`, `exclude`, `hook`, and `match` all succeed in a linked git worktree.
- A normal repository (`.git` is a directory) keeps its current behavior.
- The reported failure is `npx a16n convert --from cursor --to claude --gitignore-output-with exclude --rewrite-path-refs` inside a worktree, which exits with `Cannot use --gitignore-output-with 'exclude': not a git repository`.

## Rework

Document the repository-wide scope of `--gitignore-output-with` once, in a new section on `packages/docs/docs/cli/index.md`, beside the other flag explanations.

- `exclude` writes `info/exclude` for the whole target repository, so a linked worktree affects every worktree, including the main checkout.
- `hook` writes `hooks/pre-commit` for the whole target repository. That hook unstages the listed paths on commit, in every worktree.
- `match`, and `--if-gitignore-conflict` values `exclude` and `hook`, write those same repository files when they select them.
- `ignore` stays in the target checkout's `.gitignore` until that file is committed.
- Put a Docusaurus `:::warning` admonition in that same section, in the style already used on the docs site.
- Do not repeat this in `--help`, the generated CLI reference, the FAQ, the command examples, code comments, or the memory bank.

## Placement

The three flag essays live together on `packages/docs/docs/cli/usage-notes.md`, titled Usage notes. The CLI overview keeps installation, examples, and output format, and links to that page. The CLI reference landing page stays the version picker and points at both pages. It does not host the essays.
