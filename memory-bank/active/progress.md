# Progress

Fix the "works in CI, fails locally" problem for glob-hook CLI integration tests. The `runCli` helper uses `cwd: process.cwd()`, which breaks `npx tsx` resolution when Vitest is run from the monorepo root instead of the package directory. Solution may be a code fix, developer documentation, or both.

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. Classified as Level 2. Root cause identified: `runCli` in `cli.test.ts` uses `cwd: process.cwd()`, breaking `npx tsx` resolution when Vitest runs from the monorepo root. Design decision needed (code fix vs. docs vs. both). → entering PLAN.
- **PLAN** — Complete. Decided: both code fix AND docs. Fix: `cwd: join(__dirname, '..')` in `runCli`. Docs: CONTRIBUTING.md "Running Tests" expansion + techContext.md clarification. TDD approach: existing 12 failing tests serve as the RED state. → entering PREFLIGHT.
- **PREFLIGHT** — Complete. All 6 blocking checks passed. Advisory: consider a root-level `vitest.workspace.ts` to make per-package config delegation structural rather than per-package workaround. → entering BUILD.
- **BUILD** — Complete. Fixed `cwd` in `runCli` (one-line change). Updated `CONTRIBUTING.md` and `techContext.md`. Full suite: 15/15 tasks, all tests pass. → entering QA.
