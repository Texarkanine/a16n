# Task: Fix glob-hook test environment / document correct test invocation

* Task ID: glob-hook-test-env-fix
* Complexity: Level 2
* Type: Bug fix + documentation

The `runCli` helper in `packages/glob-hook/test/cli.test.ts` spawns child processes with `cwd: process.cwd()`. When Vitest runs from the monorepo root, `process.cwd()` is the repo root — but `tsx` (a devDependency of `glob-hook`) only exists in `packages/glob-hook/node_modules/.bin/tsx`, not at the root. This makes all 12 CLI integration tests time out. CI is unaffected because Turbo runs `vitest` inside each package directory, where `tsx` resolves correctly.

The fix has two parts:
1. **Code**: change `cwd: process.cwd()` to `cwd: join(__dirname, '..')` in `runCli` — makes `npx tsx` always resolve the package-local `tsx` regardless of where Vitest is invoked.
2. **Docs**: expand `CONTRIBUTING.md` with concrete patterns for running a single test, test file, or package's full suite.


## Test Plan (TDD)

### Behaviors to Verify

The 12 existing CLI integration tests in `packages/glob-hook/test/cli.test.ts` fully cover the behavioral contract of the CLI. No new test cases are required. These tests themselves ARE the test — they are currently failing (red) when run from the monorepo root and must pass (green) after the fix.

- **After fix**: `npx vitest run packages/glob-hook/test/cli.test.ts` from monorepo root → all 12 tests pass within the default 5 s timeout (each test completes in ~1 s once `tsx` resolves)
- **No regression**: `pnpm --filter @a16njs/glob-hook test` from repo root → all 12 tests still pass
- **No regression**: `cd packages/glob-hook && pnpm test` → all 12 tests still pass

### Test Infrastructure

- Framework: Vitest (v2)
- Test location: `packages/glob-hook/test/`
- Conventions: `test/**/*.test.ts`, per-package `vitest.config.ts`
- New test files: none


## Implementation Plan

1. **Fix `runCli` cwd** (the root cause)
   - File: `packages/glob-hook/test/cli.test.ts`
   - Change: line 19 — `cwd: process.cwd()` → `cwd: join(__dirname, '..')`
   - `__dirname` is already used in this file (for `CLI_PATH` and `FIXTURES_PATH`) so no new import/polyfill needed
   - This makes `npx tsx` always resolve from `packages/glob-hook/`, finding `tsx` in that package's `node_modules/.bin/`

2. **Run and verify the fix**
   - Run `npx vitest run packages/glob-hook/test/cli.test.ts` from the monorepo root → must all pass
   - Run `pnpm --filter @a16njs/glob-hook test` → must all pass (regression check)

3. **Expand `CONTRIBUTING.md` "Running Tests" section**
   - File: `CONTRIBUTING.md`
   - Add clear, copy-pasteable commands for:
     - All tests: `pnpm test`
     - Single package: `pnpm --filter <package-name> test`
     - Single test file (cd into package first): `pnpm exec vitest run test/path/to/file.test.ts`
     - Single test by name: `pnpm exec vitest run test/path/to/file.test.ts -t "test name"`
   - Note: bare `vitest` from root can be used for most packages but requires the `pnpm exec` pattern from within the package for packages with CLI integration tests that depend on package-local binaries

4. **Update `techContext.md` Testing Process section**
   - File: `memory-bank/techContext.md`
   - Current text says "configured via root `vitest.config.ts` with per-package overrides" which implies the root config is how things run — it's not; Turbo always invokes the per-package `vitest` config
   - Clarify: `pnpm test` (Turbo) is canonical and always uses per-package config; root `vitest.config.ts` is a fallback for ad-hoc invocations


## Technology Validation

No new technology — validation not required.


## Dependencies

- None


## Challenges & Mitigations

- **`__dirname` in ESM**: In vitest, `__dirname` is available in test files via vitest's module transform even in ESM-mode packages. The existing test already uses `__dirname` for `CLI_PATH` and `FIXTURES_PATH`, confirming it works. The fix uses the same mechanism. Risk: none.
- **`npx` binary resolution**: `npx tsx` resolves binaries by searching upward from the `cwd`. With `cwd` set to `packages/glob-hook`, it finds `packages/glob-hook/node_modules/.bin/tsx` reliably. Risk: none — this is already how CI works.
- **Scope creep to `cli` package**: `packages/cli/test/cli.test.ts` uses `spawnSync('node', ...)` against a compiled `dist/index.js` and explicitly passes `cwd: tempDir` — no similar issue. Do not touch it.


## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
