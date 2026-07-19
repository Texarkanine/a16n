---
task_id: docs-llms-and-api-retention
date: 2026-07-19
complexity_level: 3
---

# Reflection: docs-llms-and-api-retention

## Summary

Delivered `docusaurus-plugin-llms` with prose/API-aware artifact generation, restored versioned TypeDoc via TS6 deprecation silence, and added per-package major-version retention. Post-reflect rework closed two operator-found gaps: ghost VersionPicker after prose sync, and missing `/llms.txt` under `docusaurus start`.

## Requirements vs Outcome

All original acceptance criteria met: prose builds stay free of API LLM files; API builds emit root index + prose-only full + nested per-version LLM files; retention matches the specified examples; TypeDoc versioned generation succeeds for the retained set. Rework additionally makes local `docs:dev:*` URLs match deploy for LLM indexes (`/llms.txt` as `text/plain`).

## Plan Accuracy

The original six-step plan held through first build. Two gaps were outside the written verification path: (1) stale `static/versions.json` after `docs:sync`, (2) plugin `postBuild`-only lifecycle vs operator checks on `localhost` under `docs:dev:*`. Both required follow-up creative (Q3) + build rather than plan mistakes about retention/TypeDoc/plugin config.

## Creative Phase Review

- **Q1 (root asymmetry):** Custom prose-only `llms-full.txt` with `generateLLMsFullTxt: false` worked first try.
- **Q2 (per-version LLM files):** Dynamic `customLLMFiles` from `.generated` scan matched nested-filename support; gating is emergent from empty vs populated trees.
- **Q3 (dev-server llms.txt):** Pre-start generate into `static/` via the plugin’s exported generators, clear on sync, keep postBuild for deploy — closed the localhost gap without a parallel formatter. Earlier Q2 rejection of `static/` as a sink was superseded once sync clearing existed.

## Build & QA Observations

First build/QA were clean for the planned scope. Operator verification found the VersionPicker/API and `/llms.txt` issues immediately on `docs:dev:prose`. Rework QA renamed the sync clear script to `clear-static-generated.ts` (it clears versions + LLM static artifacts) and noted `docs:llms:static` in `techContext.md`.

## Cross-Phase Analysis

Verifying only `docs:build:*` missed the operator’s primary local path (`docs:dev:*`). Creative Q3 was the right fix once the plugin’s postBuild-only constraint was confirmed. Sync-clear for `versions.json` was a necessary prerequisite before resurrecting `static/` as an LLM preview sink.

## Insights

### Technical
- Prose vs API LLM gating does not need special entrypoint scripts when discovery is driven by whatever exists under `.generated`.
- TypeScript 6 turns deprecated `compilerOptions.baseUrl` into TS5101; versioned TypeDoc needs `ignoreDeprecations: "6.0"` (or a paths migration) while current TypeDoc without `baseUrl` keeps working.
- `docusaurus-plugin-llms` is postBuild-only; SPA HTML 200 for missing `/llms.txt` on `start` looks like “no file.” Local parity needs an explicit `static/` preview (or `build`+`serve`), with sync clearing to avoid staleness.
- `static/versions.json` outlives `docs:sync`’s wipe of `.generated` — VersionPicker will advertise versions that 404 unless the manifest is cleared on sync.

### Process
- Extracting `buildLlmsPluginOptions` into a Vitest-covered `scripts/` helper (preflight amendment) kept config wiring thin and TDD-honest.
- For docs UX features with public URLs, verification should include the entrypoint operators actually run (`docs:dev:*`), not only production `docs:build:*`.
