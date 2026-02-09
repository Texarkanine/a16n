# Bug Fix Reflection: CLI Docs Showing Same Content For All Versions

## Summary

The versioned CLI documentation at `.generated/cli/reference/{version}/index.md` showed identical content across all 9 CLI versions (0.3.0 through 0.11.0). Only the frontmatter differed. Two bugs in `scripts/generate-cli-docs.ts` were responsible: a wrong pnpm filter name and missing dist cleanup between version builds.

## Issue

Versioned CLI docs generated identical command reference content for every version. The docs pipeline iterated over versions and appeared to succeed, but every version's page contained the same HEAD-era CLI structure.

## Root Cause

Two compounding bugs:

1. **Wrong pnpm filter name**: `buildCli()` ran `pnpm --filter @a16njs/cli build`, but the CLI package is named `a16n`. Pnpm silently matched no packages and exited successfully ("No projects matched the filters"), so no build ever ran.

2. **No dist cleanup between versions**: Since the build never ran, the stale `dist/index.js` from whatever was last manually built (HEAD) persisted across all version iterations. Every version's dynamic import found the same HEAD-built dist, producing identical docs.

## Solution

1. **Fixed the pnpm filter name** in `buildCli()`: changed `@a16njs/cli` to `a16n` (line 242).
2. **Added dist cleanup** in `getCliProgram()`: added `rmSync(cliDistDir, { recursive: true, force: true })` before calling `buildCli()`, ensuring each version is built fresh from its checked-out source.
3. **Added a regression test** that reads the CLI's `package.json` name and the script source's pnpm filter name, asserting they match. This prevents future drift.

## Files Changed

- `packages/docs/scripts/generate-cli-docs.ts` — Fixed filter name, added `rmSync` import and dist cleanup
- `packages/docs/test/generate-cli-docs.test.ts` — Added regression test for filter name consistency

## Verification

- All 35 docs tests pass (18 in generate-cli-docs, 17 in generate-versioned-api)
- New regression test correctly caught the bug before the fix (expected `a16n`, received `@a16njs/cli`)
- Lint/build checks pass

## Additional Notes

- The bug was subtle because pnpm exits with code 0 when no packages match a filter — no error is raised. This is a pnpm design choice that makes silent failures possible.
- The cache-busting `?t=${Date.now()}` query on dynamic import was already present, but it only prevents Node's module cache from reusing a stale import. It doesn't help when the underlying `dist/index.js` file itself hasn't changed — hence the need for explicit `rmSync` cleanup.
