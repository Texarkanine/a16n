---
task_id: 20260611-agentsmd-plugin
date: 2026-06-11
complexity_level: 3
---

# Reflection: AGENTS.md Plugin (`@a16njs/plugin-agentsmd`)

## Summary

Built the bundled AGENTS.md plugin end-to-end (discovery at any depth, lossy emission, CLI registration, release/CI wiring, full docs) in a single fully-autonomous L3 run. All gates green: 36 unit + 4 integration tests for the new surface, 951 tests across the monorepo, docs build, QA PASS with only trivial findings.

## Requirements vs Outcome

Every requirement in the project brief was delivered:

- Discovery of `AGENTS.md` at any depth; root → GlobalPrompt, nested → directory-scoped FileRule — the "escape hatch" verified by integration tests producing Cursor `globs:` rules and Claude `paths:` rules from nested AGENTS.md files.
- Lossy emission with standard warning channels only (`Merged`, `Overwritten`, `Skipped`, `unsupported`) — no editorial messaging, no `--force` gating.
- Included-plugin integration (CLI registration, release-please, codecov, CI, docs) consistent with the other bundled plugins.

Additions beyond the written plan, both in its spirit: a fifth plugin-listing touchpoint (`docs/intro.md`) found during build (preflight had identified four), and `generate-versioned-api.ts` updates — the plan had left this as "inspect during build; add mapping only if static," and it was static.

## Plan Accuracy

High. The 9 steps executed in order with no reordering or splitting. The Challenges section pre-identified the issues that actually appeared (dirname `'.'` root bucket, traversal guards, mixed contributors to one file, docs-build dependency on changelog/api pages). The one surprise not in the plan: **stale `dist/`** — the CLI integration tests resolve the workspace plugin through its built `dist/`, so the first post-implementation run failed against the old stubs until the plugin was rebuilt. Cost: one confusing test failure, quickly diagnosed from the stack trace pointing into `src/discover.ts:21` (sourcemapped stub).

## Creative Phase Review

- **IR mapping (OQ1)**: Held perfectly. Nested AGENTS.md → `FileRule(['<dir>/**'], relativeDir)` flowed through the *unchanged* cursor/claude emitters exactly as the analysis predicted; integration tests passed on first run (after the dist rebuild). The IR-durability analysis (plugin-a16n strips `sourcePath`/`metadata` but keeps `globs`/`relativeDir`) was the linchpin — the byte-identical round-trip test passed because scoping lives in `globs`.
- **Emission idempotency (OQ2)**: Held. Deterministic overwrite + byte-identical `Overwritten` suppression implemented as specified; the idempotency tests (repeat emission, warning stability) needed no design adjustments. The "idempotency nightmare" from Issue #50 genuinely dissolved once emission was a pure function of the IR.

No friction points; nothing that should have been flagged as an unknown but wasn't.

## Build & QA Observations

Build was smooth under strict red-green TDD: stubs → failing tests → discover (10 green) → emit (35 green) → integration (4 green) → e2e. QA found no substantive issues; its four findings were all trivia (stale plugin count in systemPatterns.md, a doc comment scope error, a `.temp-emit/` gitignore gap inherited from plugin-claude's pattern, and one untested normalization line that got a test). The untested `./`-glob normalization is the only place implementation got ahead of tests — a small TDD discipline slip caught by QA.

## Cross-Phase Analysis

- Preflight's doc-touchpoint sweep → build executed those listings without discovery cost mid-build. The one missed touchpoint (docs intro.md) suggests the sweep's grep should have included `packages/docs/docs/`.
- Creative OQ1's durability analysis → directly produced the graceful-degradation emission rule (nested metadata lost after IR round-trip → root concatenation) → which is why the round-trip integration test was designed around `globs` rather than metadata, and passed.
- QA's only real catch chain: the conversation summary mid-task misquoted the dir-shaped-glob regex as a dangerously loose pattern; QA re-read the shipped code and confirmed the strict form. Verifying artifacts beats trusting transcripts.

## Insights

### Technical

- Workspace-internal plugins are resolved via `dist/` by dependent packages' tests; after changing plugin `src/`, rebuild that package before manually running a dependent's vitest (full `turbo run test` handles the ordering, ad-hoc `vitest run` does not).
- `WarningCode.Overwritten` sat unused in `@a16njs/models` since inception; designing the warning vocabulary ahead of need paid off — no models change was required for a semantically new situation.
- `generate-versioned-api.ts` try/catches each path checkout, so adding a new package to `WORKSPACE_PACKAGE_PATHS` is safe for historical tags where the package doesn't exist.

### Process

- Mid-task conversation summaries can drift from file reality (the regex misquote). QA's value here was re-reading shipped code with fresh eyes rather than reviewing from memory or transcript.
- For "add a package" tasks, the preflight listing-sweep should grep the docs content tree (`packages/docs/docs/**`) in addition to root-level READMEs — that's where the fifth touchpoint hid.
