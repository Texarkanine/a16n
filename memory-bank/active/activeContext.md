# Active Context

- **Current Task:** Document repository-wide gitignore scope
- **Phase:** QA - COMPLETE (PASS)
- **What Was Done:** Added `## Git ignore styles` and a `:::warning Repository-wide` admonition to `packages/docs/docs/cli/index.md`, after Examples and before Split Directories. No other files. `pnpm build`, `pnpm test`, and `pnpm lint:check` succeeded.
- **Next Step:** QA.
- **Deviation:** The opening sentence says the flag "chooses how converted files are git-ignored", which is preflight advisory 2. The runtime-guard advisory was not adopted.
