# Project Brief: Bind Oxlint into CI, local lint, and pre-commit

As described in [a16n#162](https://github.com/Texarkanine/a16n/issues/162), plus the operator constraints in the isolated-checkout task brief.

Leftover Oxlint unused-vars from #74 are gone (`#156`–`#161` merged). This task wires the existing correctness-only Oxlint so:

1. Local developers run one manual lint command that **autofixes**.
2. A pre-commit hook **checks only** (no `--fix`) and blocks the commit if Oxlint reports correctness errors.
3. CI **checks only** and fails the job on leftover correctness errors.

The hook must install on first `pnpm install` (this repo is `packageManager: pnpm@9`). Prefer a standard hook tool over a custom installer.

## Requirements

1. Bind Oxlint into root `package.json` so local `pnpm lint` autofixes (`oxlint --fix`).
2. Provide a check-only entry for the hook and CI (`oxlint` without `--fix`).
3. Install a pre-commit hook automatically on `pnpm install` (`prepare` / equivalent that works with pnpm, not npm-only).
4. Pre-commit must check only. It must not run `--fix`.
5. CI (`.github/workflows/ci.yaml`) must run the check-only command and fail on leftover correctness errors.
6. Do not enable extra Oxlint rule categories beyond `.oxlintrc.json` from #74 (correctness as error).
7. Do not write change-detector tests for `package.json` script strings, workflow YAML, or CONTRIBUTING prose. Oxlint itself is the checker. Mapping lint scripts is not a TDD unit (outcome from #74 / operator). If a small custom installer with real branching logic is added, classify TDD then; prefer a standard hook tool instead.
8. Update `CONTRIBUTING.md` and `memory-bank/techContext.md` so they no longer say lint is optional / not in CI.
9. Do not open a PR or run archive in this isolated run.

## Current state at `c9c9c052`

- Root scripts: `"lint": "oxlint"` and `"lint:fix": "oxlint --fix"`.
- `CONTRIBUTING.md` still says lint is optional and not in CI.
- `memory-bank/techContext.md` still says leftover findings expected / not in CI.
- `.github/workflows/ci.yaml` has build, typecheck, test, docs — no lint step.
- No husky / simple-git-hooks / lefthook.
- Isolated checkout is a git worktree sharing `/home/mobaxterm/git/a16n/.git`. Hook install must not write the parent's shared `.git/hooks`.

## Success criteria

- `pnpm lint` autofixes locally.
- Pre-commit and CI run check-only Oxlint and fail on leftover correctness errors.
- `pnpm exec oxlint` (check) is clean on this tip.
- Docs match the new policy.
