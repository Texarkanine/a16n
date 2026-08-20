# Active Context

- **Current Task**: Bind Oxlint into CI, local lint, and pre-commit (#162)
- **Phase**: PLAN - COMPLETE
- **What Was Done**: Level 2 plan. Local `pnpm lint` → `oxlint --fix`; `pnpm lint:check` → `oxlint` for husky pre-commit and CI. husky@9.1.7 spiked and kept as the installer. Do not run husky in this worktree (`HUSKY=0`). No Vitest cases; Oxlint is the checker.
- **Next Step**: Preflight validation, then build.
