# Task: Split cli.test.ts into domain-specific test files

* Task ID: m2-split-cli-test
* Complexity: Level 2
* Type: Simple enhancement (structural test reorganization)

Split `packages/cli/test/cli.test.ts` (1108 lines, 55 tests, 14 top-level describe blocks) into 7 domain-specific test files. Extract the shared `runCli()` helper into `test-support/cli-runner.ts`. No behavioral changes — purely structural reorganization.

## Test Plan (TDD)

### Behaviors to Verify

This is a structural reorganization of existing tests. The "tests" here ARE the product. Verification is:

- **Baseline**: all 55 tests in `cli.test.ts` pass before the split
- **Post-split**: all 55 tests pass after the split, distributed across 7 files
- **No regressions**: `pnpm test` green across the entire monorepo

### Test Infrastructure

- Framework: Vitest
- Test location: `packages/cli/test/`
- Conventions: `*.test.ts` naming; vitest config includes `test/**/*.test.ts`
- New test files: 7 domain files + 1 helper (see Implementation Plan)

## Implementation Plan

### Step 0: Record baseline

- Run `pnpm test --filter @a16njs/cli` and confirm 55 tests in `cli.test.ts` pass
- Record the total test count for the package

### Step 1: Create `test-support/cli-runner.ts`

- Files: `packages/cli/test/test-support/cli-runner.ts`
- Changes:
  - Export `cliPath` constant (path to `dist/index.js`)
  - Export `runCli(args: string, cwd: string)` function (no default cwd — each file manages its own)
  - Export `createTempDir()` → `fs.mkdtemp()` for per-test isolation (avoids shared-state when files run in parallel)
  - Export `removeTempDir(dir: string)` → `fs.rm(dir, { recursive: true, force: true })`
  - Preserve the existing NOTE comment about E2E/coverage

### Step 2: Create `cli-help.test.ts` (2 tests)

- Files: `packages/cli/test/cli-help.test.ts`
- Source: `--help` describe (lines 37–63)
- Tests: `should show help`, `should show help when invoked through a symlink`
- Note: symlink test uses `spawnSync` directly + `cliPath` import

### Step 3: Create `cli-plugins.test.ts` (2 tests)

- Files: `packages/cli/test/cli-plugins.test.ts`
- Source: `plugins command` describe (lines 65–103)
- Tests: `should list available plugins`, `should discover and list third-party plugins from node_modules`

### Step 4: Create `cli-discover.test.ts` (5 tests)

- Files: `packages/cli/test/cli-discover.test.ts`
- Source: `discover command` (lines 105–137) + `discover command with verbose` (lines 247–257) + `error handling` discover test (line 268)
- Tests: `should discover cursor rules`, `should output JSON with --json flag`, `should error on unknown plugin`, `should support --verbose flag`, `should error with helpful message for non-existent path in discover`
- Merges discover-related tests from two separate describes + one from error handling

### Step 5: Create `cli-convert.test.ts` (11 tests)

- Files: `packages/cli/test/cli-convert.test.ts`
- Source: `convert command` (lines 139–245) + `error handling` convert test (line 260) + `--rewrite-path-refs flag` (lines 828–851) + `dry-run output wording` (lines 853–881)
- Tests: all 7 convert tests + 1 error test + 1 rewrite test + 2 dry-run wording tests
- Groups core convert behavior: basic conversion, flags, errors, dry-run, path rewriting

### Step 6: Create `cli-gitignore.test.ts` (18 tests)

- Files: `packages/cli/test/cli-gitignore.test.ts`
- Source: `--gitignore-output-with flag` (lines 276–406) + `sourceItems conflict detection` (lines 408–544) + `match mode validation` (lines 546–580) + `--if-gitignore-conflict flag` (lines 582–710)
- Tests: all 18 gitignore-related tests
- Includes the local `setupConflictScenario()` helper (stays in-file, not extracted to test-support)

### Step 7: Create `cli-delete-source.test.ts` (9 tests)

- Files: `packages/cli/test/cli-delete-source.test.ts`
- Source: `--delete-source flag` describe (lines 883–1106)
- Tests: all 9 delete-source tests

### Step 8: Create `cli-from-to-dir.test.ts` (8 tests)

- Files: `packages/cli/test/cli-from-to-dir.test.ts`
- Source: `--from-dir and --to-dir flags` describe (lines 712–826)
- Tests: all 8 from/to-dir tests

### Step 9: Delete original and verify

- Delete `packages/cli/test/cli.test.ts`
- Run `pnpm test --filter @a16njs/cli` — all 55 tests must pass across the new files
- Run `pnpm test` — full monorepo green

## Technology Validation

No new technology — validation not required.

## Dependencies

- CLI must be built before tests run (`dist/index.js` must exist) — already handled by Turborepo `test` depends on `build`

## Challenges & Mitigations

- **Parallel temp dir collision**: original uses a hardcoded temp dir path. Mitigated by switching to `mkdtemp()` for per-test isolation (consistent with the M1 fix applied to `plugin-discovery.test.ts`).
- **Error handling describe split**: the `error handling` describe has 2 tests belonging to different domains (convert vs discover). Each test goes to its respective domain file, not kept together.
- **Symlink test**: uses `spawnSync` directly instead of `runCli()`. Needs `cliPath` export from the helper, but doesn't use the standard helper function.
- **Test count verification**: must confirm 55 tests pass before and after, across all 7 files.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [ ] QA
