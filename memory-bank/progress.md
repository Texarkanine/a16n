# Progress

## Fix CLI Docs Showing Same Content For All Versions

- [x] Identified root cause: wrong pnpm filter name + no dist cleanup between versions
- [x] Wrote regression test (TDD: test first, verified it fails)
- [x] Fixed pnpm filter name: `@a16njs/cli` -> `a16n`
- [x] Added `rmSync` dist cleanup before each CLI build
- [x] All 35 docs tests pass (18 cli-docs + 17 versioned-api)
- [x] Reflection document created

## Fix Versioned Doc Generation Stale Files (previous)

- [x] Diagnosed root cause: `git checkout` doesn't remove stale tracked files
- [x] Implemented `removeStaleFiles()` helper using `git ls-tree` diffing
- [x] All tests pass; reflection complete
