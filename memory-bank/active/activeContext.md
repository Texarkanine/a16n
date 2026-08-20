# Active Context

- **Current Task**: Bind Oxlint into CI, local lint, and pre-commit (#162)
- **Phase**: PREFLIGHT - COMPLETE (PASS)
- **What Was Done**: Preflight validated the Level 2 plan against the repo. TDD encoding passes (no Vitest / no change-detectors; Oxlint is the checker). Plan amended: `HUSKY=0` on CI install; CONTRIBUTING worktree install note; hook file is a plain `pnpm lint:check` line (no `_/husky.sh`).
- **Next Step**: `/niko-build` (parent). This preflight run does not start build and does not commit.
