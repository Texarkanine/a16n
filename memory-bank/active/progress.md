# Progress

Bind existing Oxlint (correctness-as-error from #74) into local autofix, a check-only pre-commit hook installed on `pnpm install`, and a check-only CI step. Update CONTRIBUTING and techContext so lint is no longer described as optional / not in CI.

**Complexity:** Level 2

## 2026-08-20 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Fresh start: no `memory-bank/active/` in the isolated checkout
    - Intent taken as [a16n#162](https://github.com/Texarkanine/a16n/issues/162) plus the isolated-checkout operator constraints (standing consent through REFLECT)
    - Classified Level 2: small self-contained enhancement to root DX / CI tooling; no product-package behavior
* Decisions made
    - Level 2, not Level 3: hook-tool selection is a plan/tech-validation choice; prefer a standard installer over custom code
    - Isolated checkout is a git worktree sharing the parent `.git`; hook install must not write the parent's shared `.git/hooks`
* Insights
    - #74 already bound `lint` / `lint:fix` and left CI optional; this task inverts local lint to autofix and adds the two check-only gates
    - Mapping lint scripts is not a TDD unit (operator outcome from #74)
