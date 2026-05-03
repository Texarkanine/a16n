---
task_id: slobac-audit-remediation-m7
date: 2026-05-02
complexity_level: 2
---

# Reflection: M7 — Split plugin-cursor discover.test.ts

## Summary

Split the 832-line `discover.test.ts` monolith in `@a16njs/plugin-cursor` into nine domain-focused `discover-*.test.ts` modules plus a shared `test-support/discover-helpers.ts`, mirroring the M5 `plugin-claude` pattern exactly. All 66 discover tests and 137 package tests remain green.

## Requirements vs Outcome

All requirements satisfied. The nine files match the nine root `describe` blocks in the monolith. Parity gates (66 discover `it`s, 137 package total) held throughout and were verified at the end. No tests were added or removed.

## Plan Accuracy

The plan miscounted the monolith as four root `describe` blocks (an early planning error that was corrected in Preflight). Implementation correctly identified nine and named them accordingly. The file list in `tasks.md` was updated during build to reflect reality. Beyond the miscount, the plan was accurate: helper pattern, import conventions, fixture resolution via `import.meta.url`, and deletion of the monolith all went as prescribed.

## Build & QA Observations

Build was clean — the M5 precedent made this nearly mechanical. No fixture path issues emerged; the `discoverFixturesDir` helper resolved correctly for all nine test files since they all live at `test/` root depth (no nesting). QA found nothing requiring rework: no debug artifacts, no dead imports, no stale references, no documentation gaps.

## Insights

### Technical

- Nothing notable. Splitting a flat monolith (all test files at the same depth) eliminates fixture-path risk entirely — the helper just works because `dirname(fileURLToPath(import.meta.url))` is identical for all nine files.

### Process

- The plan's suite-count miscount (4 vs 9) was caught at Preflight, not during Build — which is the right place for it. The two-phase Preflight/Build discipline earned its keep here.
- For future monolith splits, explicitly count root `describe` blocks in the monolith *as the first step* of planning, before drafting the file list.

### Million-Dollar Question

If the nine-file layout had been the foundational assumption from the start, the monolith would never have existed — the suite names and file names would have been 1:1 from day one. No architectural refactor needed; this is the canonical structure.
