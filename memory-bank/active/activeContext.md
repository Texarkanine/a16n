# Active Context

**Current Task:** Fix glob-hook test environment / document correct test invocation  
**Phase:** PLAN - COMPLETE  
**Complexity:** Level 2

## What Was Done

Completed Level 2 Plan phase. Root cause confirmed: `runCli` in `packages/glob-hook/test/cli.test.ts` uses `cwd: process.cwd()`, causing `npx tsx` to fail when Vitest runs from the monorepo root (no `tsx` at root `node_modules/.bin/`). Fix is `cwd: join(__dirname, '..')`. Documentation updates: `CONTRIBUTING.md` (test invocation patterns) and `techContext.md` (clarify Turbo-per-package is canonical).

Confirmed: `cli` package has no analogous issue (uses `node` against compiled `dist/`, not `tsx`).

## Next Step

Run Preflight (niko-preflight skill).
