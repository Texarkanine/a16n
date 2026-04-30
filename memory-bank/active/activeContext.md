# Active Context

**Current Task:** Fix glob-hook test environment / document correct test invocation  
**Phase:** BUILD - COMPLETE  
**Complexity:** Level 2

## What Was Done

- Fixed `runCli` in `packages/glob-hook/test/cli.test.ts`: changed `cwd: process.cwd()` to `cwd: join(__dirname, '..')` (line 17)
- Verified RED state (12/12 timeout) before fix, GREEN state (12/12 pass ~1s each) after fix
- Regression checked: `pnpm --filter @a16njs/glob-hook test` → 37/37 pass; `pnpm test` (full suite) → 15/15 tasks, all tests pass
- Expanded `CONTRIBUTING.md` "Running Tests" section with concrete per-package, per-file, and per-test invocation patterns
- Updated `memory-bank/techContext.md` Testing Process entry to clarify `pnpm test` (Turbo) is canonical and uses per-package configs

## Next Step

Run QA phase (niko-qa skill).
