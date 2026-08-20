# Active Context

- **Current Task**: Bind Oxlint into CI, local lint, and pre-commit (#162)
- **Phase**: BUILD - COMPLETE
- **What Was Done**: Wired `pnpm lint` to `oxlint --fix`, added `pnpm lint:check` (`oxlint`) for husky pre-commit and CI. CI install uses `HUSKY=0`. Docs updated. Oxlint check/fix clean. `pnpm test` 17/17. Did not run husky in this worktree; shared hooksPath still unset.
- **Next Step**: QA review.
