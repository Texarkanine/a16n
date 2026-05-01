# Task: M3 — Split integration.test.ts + shared-state

* Task ID: slobac-audit-remediation-m3
* Complexity: Level 2
* Type: Test-suite structural remediation (monolithic split + shared-state fix; no production behavior change)

Remediate SLOBAC audit **Finding 6** (monolithic `packages/cli/test/integration/integration.test.ts`) and **Finding 4** (module-level `A16nEngine` shared across tests). Split the seven top-level `describe` blocks into dedicated files per `memory-bank/slobac-audit.md`. Extract filesystem and assertion helpers plus engine construction into `packages/cli/test/test-support/`. Preserve all fixture paths, conversion assertions, and warning checks unchanged.

## Test Plan (TDD)

### Behaviors to Verify

Each existing `it(...)` case remains the behavioral specification (no renames of test intent unless audit already required). Spot-check categories:

- **Fixture conversions**: copy `from-*` fixture → temp workspace → `engine.convert(...)` → output matches `to-*` tree (Cursor ↔ Claude ↔ a16n as today).
- **FileRule / hooks / skills**: nested fixture dirs emit expected rule files, `settings.local.json`, skill trees.
- **AgentIgnore / cursorignore**: ignore files respected; warning paths stable.
- **ManualPrompt / commands**: command MD round-trip and skill deployment paths.
- **Split dirs**: `--from-dir` / `--to-dir` (and variants) place output only in declared targets.
- **Path ref rewrite**: rewritten content matches expected refs in `.md` / `.mdc` / skill files.
- **a16n IR plugin**: round-trip and delete-source-style flows across `.a16n`, `.cursor`, `.claude`.

**Edge / regression**

- Parallel safety: after split, each test file must use a **distinct temp root** under `integration/.temp-integration/<suite-slug>/` (or `fs.mkdtemp` per hook) so Vitest file-parallelism does not clobber the shared path used today from a single module.
- **Engine isolation**: every top-level file (or its root `describe`) uses `beforeEach` to assign `engine = createIntegrationEngine()` — no module-level singleton.

### Test Infrastructure

- Framework: **Vitest** (`packages/cli/vitest.config.ts`)
- Test location: `packages/cli/test/integration/`
- Conventions: fixture layout `fixtures/<name>/from-*` and `to-*` unchanged; same import style as M2 splits (ESM, `fileURLToPath`).
- New test files (per audit prescription, filenames may be aligned 1:1 with top-level describe domains):
  - `integration-basic-conversion.test.ts` — `Integration Tests - Fixture Based`
  - `integration-filerule-skill.test.ts` — `Integration Tests - FileRule and SimpleAgentSkill`
  - `integration-agentignore.test.ts` — `Integration Tests - AgentIgnore`
  - `integration-commands.test.ts` — `Integration Tests - ManualPrompt (Commands)`
  - `integration-split-dirs.test.ts` — `Integration Tests - Split Directories (--from-dir / --to-dir)`
  - `integration-path-rewrite.test.ts` — `Integration Tests - Path Reference Rewriting (--rewrite-path-refs)`
  - `integration-a16n-plugin.test.ts` — `Integration Tests - a16n IR Plugin`
- New helper module: `packages/cli/test/test-support/integration-helpers.ts` — `copyDir`, `readDirFiles`, `compareOutputs`, `createIntegrationEngine()`, `fixturesDirFor(importMetaUrl)`, `suiteTempDir(importMetaUrl, slug)` (or equivalent).

## Implementation Plan

1. **TDD — Baseline gate (no production code)** ✅
   - Run CLI package tests (`pnpm --filter @a16njs/cli test` or project-standard equivalent) and record green baseline.
   - Files: none changed yet.

2. **TDD — Extract shared helpers; keep single integration entry temporarily** ✅
   - **Tests first**: No new assertions — existing integration tests are the oracle. **Implement**: add `integration-helpers.ts` exporting pure helpers + `createIntegrationEngine()`; update `integration.test.ts` to import helpers and **remove** module-level `engine`; introduce `let engine` with **per top-level describe** `beforeEach(() => { engine = createIntegrationEngine(); })` (matches “per-describe factory” and prepares split).
   - **Verify**: same command as step 1; must stay green.
   - Files: `packages/cli/test/test-support/integration-helpers.ts`, `packages/cli/test/integration/integration.test.ts`

3. **TDD — Parallel-safe temp directories** ✅
   - **Tests first**: existing tests must still pass under parallel workers **after** split; while still monolithic, optionally run CLI tests with `--no-file-parallelism` vs default once to detect races; adopt `suiteTempDir(import.meta.url, '<slug>')` (unique slug per future file) inside each top-level describe’s `beforeEach`/`afterEach`, replacing the single shared `tempDir` constant where that describe’s tests use temp paths.
   - **Verify**: CLI integration tests green.
   - Files: `integration.test.ts` (prepare slugs that will map 1:1 to split files)

4. **TDD — Vertical slice: first split file** ✅
   - **Tests first**: move **only** the `Integration Tests - Fixture Based` describe subtree into `integration-basic-conversion.test.ts` (imports, fixtures path, temp slug `basic-conversion`). **Do not** change assertion bodies.
   - **Verify**: `pnpm --filter @a16njs/cli test` green.
   - Files: new `integration-basic-conversion.test.ts`, shrink `integration.test.ts`

5. **TDD — Repeat vertical slices (2–7)** ✅
   - For each remaining top-level describe: create matching `integration-*.test.ts`, move subtree, unique temp slug, `beforeEach` engine factory.
   - **Verify** after each file (or after each batch if timeboxed): CLI tests green.

6. **Remove monolith + tidy** ✅
   - Delete empty or redundant `integration.test.ts` once all describes migrated.
   - **Verify**: full monorepo `pnpm test` per milestone invariants in `milestones.md`.

7. **Documentation** ✅
   - No user-facing README change expected; if `CONTRIBUTING.md` references `integration.test.ts` explicitly, update path list (only if such a reference exists).

## Technology Validation

No new technology — validation not required.

## Dependencies

- `@a16njs/engine`, `@a16njs/plugin-*`, `@a16njs/models` (existing)
- Vitest, `fs/promises`, fixture directories under `packages/cli/test/integration/fixtures/`

## Challenges & Mitigations

- **Shared `tempDir` path across split files**: Mitigated by per-suite subdirectory or `mkdtemp` (Step 3).
- **Drift during copy-paste**: Move describe blocks verbatim; run tests after each slice; use diff review focused on import paths and `fixturesDir`/`tempDir` locals only.
- **Finding 4 compliance**: No `const engine = new A16nEngine(...)` at module scope post-change; factory only.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [ ] QA
