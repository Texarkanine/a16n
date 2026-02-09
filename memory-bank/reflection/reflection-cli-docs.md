# Task Reflection: Fix CLI Documentation Generation

**Feature ID:** cli-docs
**Date of Reflection:** 2026-02-08
**Complexity:** Level 3 (Multi-Component)
**Branch:** `cli-docs`

## Summary

Replaced a hardcoded duplicate of the CLI program structure in the documentation generator with a true auto-generation approach. The doc generator now dynamically imports the real CLI's `createProgram()` factory, ensuring docs always reflect the actual CLI interface. Added graceful fallback for historical versions that predate the refactor.

---

## 1. Overall Outcome & Requirements Alignment

The implementation fully meets the original requirements:

- **Auto-generated docs from real CLI source** — `getCliProgram()` now dynamically imports the built CLI and calls `createProgram(null)`, eliminating the hardcoded duplicate entirely.
- **Missing options restored** — `--from-dir`, `--to-dir`, `--rewrite-path-refs` on `convert` and `--from-dir` on `discover` are now present in generated docs.
- **Graceful fallback** — Historical versions that lack `createProgram()` get a fallback page with `npx a16n@{version} --help` instructions, and still appear in the version picker.
- **No breaking changes** — The CLI binary works identically; `createProgram` is a new additive export.

**Bonus improvement discovered during implementation:** `extractCommandInfo()` was including hidden options (those marked with Commander's `.hideHelp()`). Fixed to filter them, preventing `discover`'s hidden `--to-dir` from appearing in docs.

## 2. Planning Phase Review

The plan was accurate and well-structured across 5 steps. Key observations:

- **Step 3 (versioned pipeline adjustment) required no code changes** — The plan correctly anticipated this: `generateCliDocsForVersion()` catching failures internally meant the outer try/catch in the versioned pipeline already "just works." Good architectural foresight.
- **Step 4 (TDD tests) needed reordering** — The plan specified writing tests before implementation, but the `createProgram()` stub broke compilation of the entire file (the remaining module-level `program` references became dangling). This forced a collapse of the stub + implementation steps. The tests were still written and verified.
- **`generate-versioned-api.ts` was listed as modified but required zero changes** — Correct prediction, but could have been stated more clearly in the plan.

## 3. Implementation Phase Review

### What went well

- **Clean refactor** — Moving ~660 lines of CLI construction into `createProgram()` was a straightforward extract-function refactoring. The ESM `isDirectRun` guard is a standard pattern that worked on the first attempt.
- **Dynamic import with cache-busting** — Adding `?t=${Date.now()}` to the import path prevents stale module cache when generating docs for multiple versions in sequence. Proactive fix for a subtle issue.
- **Hidden option filtering** — Caught a pre-existing bug (hidden `--to-dir` on `discover` leaking into docs) as a natural side effect of testing with the real program structure vs. a hardcoded one. This validates the entire approach.
- **Null engine pattern** — Passing `null` as the engine parameter for doc generation was clean and type-safe (`A16nEngine | null`). Actions reference `engine!` but are never invoked during doc generation.

### Challenges

- **TDD cycle collision with compilation** — The stub `createProgram()` left the rest of `index.ts` referencing a `program` variable that no longer existed at module scope. This meant the file couldn't compile, which meant tests couldn't even import it. Resolution: implemented the full refactor alongside the stub rather than sequentially.
- **Vitest import resolution** — The test file `create-program.test.ts` importing from `../src/index.js` hit Vite's module resolution, which couldn't resolve `@a16njs/models` and other workspace packages without them being built first. The existing test pattern (subprocess with built `dist/index.js`) was already working around this. Solution: built all workspace packages first, then the test worked with Vite's resolution.

## 4. Testing Phase Review

- **5 new CLI tests** covering `createProgram()` structure: Command instance type, subcommand presence, option presence on `convert` and `discover`, null engine safety.
- **3 new docs tests** covering `generateFallbackPage()`: frontmatter format, npx command content, "not available" messaging.
- **All 131 CLI tests pass** (including 53 existing CLI subprocess tests, 41 git-ignore tests, 32 integration tests).
- **All 34 docs tests pass** (including 17 existing extraction/generation tests).
- **End-to-end verification** — Generated docs confirmed to include all previously missing options.

Testing was effective. The existing test suite provided confidence that the refactor didn't break CLI behavior. The new tests specifically guard against the regression that caused this issue (options missing from generated docs).

## 5. What Went Well

1. **Plan accuracy** — The 5-step plan mapped almost 1:1 to implementation, with step 3 correctly requiring zero changes.
2. **Zero regressions** — All 165 tests pass; the CLI binary works identically.
3. **Bonus bug fix** — Hidden options filtering was a natural outcome of using the real program structure.
4. **Clean separation** — `createProgram(engine | null)` cleanly separates program construction from execution, making the CLI more testable generally.
5. **Fallback design** — Versions that predate the refactor don't silently vanish; they get a useful fallback page.

## 6. What Could Have Been Done Differently

1. **TDD step ordering** — Should have recognized upfront that stubbing `createProgram()` required extracting the full body (not just an empty return), since the original code was all at module scope. Could have planned a "compilable stub" step.
2. **Progress and activeContext files** — Memory bank `progress.md` and `activeContext.md` weren't updated during implementation. Should have maintained them to track incremental status.
3. **Workspace build dependency** — Could have documented upfront that `pnpm install` + workspace builds are required before CLI tests work via direct import (vs. subprocess).

## 7. Key Lessons Learned

### Technical
- **ESM main-module guard pattern** — `realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))` is the reliable ESM equivalent of CJS `require.main === module`. Works across symlinks (bin links) and direct invocation.
- **Dynamic import cache-busting** — When importing the same module path multiple times with different content (e.g., after git checkout), a query parameter `?t=${Date.now()}` is necessary to bypass Node's module cache.
- **Commander hidden option API** — `new Option(...).hideHelp()` sets `opt.hidden = true`. Doc generators that iterate `cmd.options` must filter for this.

### Process
- **TDD with module-level code** — When code being refactored is at module scope (not in functions), the "stub then implement" TDD cycle collapses because the stub breaks compilation. Plan for this by doing "compilable extraction" as the stub step.
- **Hardcoded duplicates are tech debt** — This entire task existed because someone hardcoded the CLI structure in the doc generator instead of importing it. The refactor was straightforward but the original design invited drift.

## 8. Actionable Improvements for Future L3 Features

1. **Prefer importable factories over module-level construction** — Any module that might need to be imported for its structure (testing, docs, etc.) should export a factory function rather than executing at module scope.
2. **Add a CI check for doc completeness** — A test that compares `createProgram(null).commands` against the generated doc content would catch option drift immediately.
3. **Consider a doc generation test** — An integration test that runs `generateCliDocsForVersion()` and checks the output contains specific option flags would prevent the original bug from recurring.

## Next Steps

- [ ] Archive this task via `/archive`
- [ ] Consider adding CI-level doc completeness verification
- [ ] Review other documentation generators in the project for similar hardcoded-duplicate patterns
