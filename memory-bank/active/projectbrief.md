# Project Brief

## User Story

When `a16n convert` runs inside a git worktree, every `--gitignore-output-with` mode should work the same way it does in a normal checkout.

## Requirements

- `ignore`, `exclude`, `hook`, and `match` all succeed in a linked git worktree.
- A normal repository (`.git` is a directory) keeps its current behavior.
- The reported failure is `npx a16n convert --from cursor --to claude --gitignore-output-with exclude --rewrite-path-refs` inside a worktree, which exits with `Cannot use --gitignore-output-with 'exclude': not a git repository`.
