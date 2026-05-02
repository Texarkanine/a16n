---
task_id: slobac-audit-remediation-m4
date: 2026-05-01
complexity_level: 2
---

# Reflection: M4 — Split plugin-claude emit.test.ts

## Summary

Split the former monolithic `packages/plugin-claude/test/emit.test.ts` (2468 lines, 10 top-level describes, 86 tests) into nine domain Vitest files, added `test-support/emit-helpers.ts` exporting `suiteTempDir(importMetaUrl, slug)` for per-suite `.temp-emit/<slug>/` isolation, and deleted the monolith. Test count parity was preserved exactly; full-monorepo `pnpm test` stayed green (15/15 Turbo tasks, including 175 downstream CLI integration tests). QA required no corrective edits.

## Requirements vs Outcome

All project-brief and task requirements were met: SLOBAC audit Finding 14 addressed with the audit-prescribed file names, shared setup extracted into a package-local `test-support/` per the cross-milestone invariant, fixture and assertion bodies preserved verbatim, no SUT changes in `packages/plugin-claude/src/`. The plan pre-declared one deviation — creating `emit-mixed-models.test.ts` as a ninth file for the cross-cutting `'Mixed Model Emission'` describe that the audit's eight-file prescription did not explicitly name — and shipped exactly that. Nothing was dropped, re-scoped, or silently added.

## Plan Accuracy

The file list, slugs, describe-to-file mapping, and TDD ordering in `tasks.md` were correct; nothing had to be re-scoped. The one execution-pacing deviation (documented in progress.md) was folding plan steps 3 + 4–12 + 13 — monolith rewire, nine per-domain splits, and monolith deletion — into a single verification-bracketed pass after confirming the helper rewire was green. The plan's step-per-describe cadence would have produced nine identical green checks; baseline and final test counts (86 emit) matched exactly, so the collapsed sequence preserved all the signal the stepwise cadence would have produced.

The preflight advisory about keeping `emit-helpers.ts` minimal — start with only `suiteTempDir`, add a registrar only if duplication proves noisy — was the right call: the helper landed at 21 lines with one exported function, and the four-line `beforeEach`/`afterEach` duplication across ten sites is well under the noisy threshold.

## Build & QA Observations

Build was fast and repetitive: same pattern as M3 with a simpler helper surface (no engine factory or FS comparison utilities needed for emit tests). The batch extraction script — nine structurally-identical file writes driven by line ranges into describe blocks — cut roughly eight redundant per-describe tool turns that would have repeated the same green signal. Test-count parity at the end of the pass is the gate that lets this shortcut ship safely.

QA was clean: no debug artifacts, no stale imports breaking anything, nested `'empty input'` correctly rooted under its `'Claude Plugin Emission'` parent in the global-prompt split, `emit-file-rule.test.ts` cleanly hosting the two sibling describes. The preflight advisory about Finding 13's body-comment fossil was satisfied by M1 — a grep of the split files came up empty.

## Insights

### Technical

- The `suiteTempDir(importMetaUrl, slug)` shape has now been used by two packages (`packages/cli/test/test-support/integration-helpers.ts` and `packages/plugin-claude/test/test-support/emit-helpers.ts`). If M6/M7 (cursor emit/discover splits) reach for the same pattern, consider whether it earns promotion to a shared test-support package — but only after all M4–M7 land, and only if the signature stabilizes across four independent usages.
- Vitest's default parallel file execution plus per-file unique `.temp-<kind>/<slug>/` directories are a reliable isolation primitive for filesystem-touching test suites. Monolithic tests that coalesce into a single tempdir via `beforeEach`/`afterEach` are load-bearing on running under a single worker; splitting without per-file slugs would have silently introduced flake.

### Process

- "Script it instead of loop" was a genuine win here. Nine near-identical file writes from line-range slices is exactly the pattern the rule targets; running it as a single Node script gave deterministic output with one readable plan (the `PLAN` array) rather than nine mechanical tool turns with copy-paste boilerplate.
- Preflight advisories continue to pay off: both M4 advisories (helper minimalism, Finding 13 residue check) converted directly into QA-level verifications that had no code impact. Preflight is absorbing concerns that would otherwise surface mid-build.

### Million-Dollar Question

If `packages/plugin-claude/test/` had started with one file per top-level emission domain — `emit-global-prompt.test.ts`, `emit-file-rule.test.ts`, and so on — plus a minimal `test-support/emit-helpers.ts` from the first plugin PR, there would never have been a monolithic `emit.test.ts` to split. The emergent shape is the elegant shape: one file per behavior domain, one slug per file, one shared helper for temp-dir isolation. The nine files M4 produces are very close to what an author starting in 2026 with parallel-safe conventions would have written on day one.
