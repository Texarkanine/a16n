# Progress: M2 — Split cli.test.ts

Split `packages/cli/test/cli.test.ts` (~1108 lines, 12+ behavior domains) into domain-specific test files with shared `runCli()` helper extracted to `test-support/` (SLOBAC audit Finding 5).

**Complexity:** Level 2

## Phase History

- **COMPLEXITY-ANALYSIS** — Complete. M2 classified Level 2: self-contained monolithic test file split within a single package, no architectural implications.
- **L2 PLAN** — Complete. 7-way split mapped: cli-help, cli-plugins, cli-discover, cli-convert, cli-gitignore, cli-delete-source, cli-from-to-dir. Shared `runCli()` helper extracted to `test-support/cli-runner.ts`. All 55 tests accounted for.
- **L2 PREFLIGHT** — PASS. TDD encoded as baseline + post-split verification gates. No convention conflicts, no dependency impacts, no conflicts. Advisory: Vitest `test.extend()` fixture could reduce boilerplate but would introduce a new pattern — deferred.
- **L2 BUILD** — Complete. Split `cli.test.ts` (1108 lines, 55 tests) into 7 domain files + `test-support/cli-runner.ts`. All 175 cli tests pass, full monorepo green. Runtime improved from ~16s to ~8s via parallel execution with mkdtemp isolation.
