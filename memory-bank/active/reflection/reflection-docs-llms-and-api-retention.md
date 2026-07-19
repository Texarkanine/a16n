---
task_id: docs-llms-and-api-retention
date: 2026-07-19
complexity_level: 3
---

# Reflection: docs-llms-and-api-retention

## Summary

Delivered `docusaurus-plugin-llms` with prose/API-aware artifact generation, restored versioned TypeDoc via TS6 deprecation silence, and added per-package major-version retention. Build and QA both passed with no plan deviations.

## Requirements vs Outcome

All acceptance criteria met: prose builds stay free of API LLM files; API builds emit root index + prose-only full + nested per-version LLM files; retention matches the specified examples; TypeDoc versioned smoke succeeds; unit tests cover retention and plugin-options helpers. Nothing dropped or added beyond the plan.

## Plan Accuracy

The six-step plan held: retention → TypeDoc fix → LLM helpers (TDD) → config wire → README → verify. Preflight amendments (helpers under `scripts/`, extract `buildLlmsPluginOptions`, rename config to `.ts`) were the right encoding and avoided mid-build redesign. Challenges predicted in the plan (ignore-glob precision, config-before-gen ordering) did not bite — prose vs API gating emerged naturally from scanning `.generated`.

## Creative Phase Review

- **Q1 (root asymmetry):** Custom prose-only `llms-full.txt` with `generateLLMsFullTxt: false` worked first try; root full stayed at 21 prose docs while root `llms.txt` still indexed API routes.
- **Q2 (per-version LLM files):** Dynamic `customLLMFiles` from filesystem scan matched plugin nested-filename support; current build emitted 14 nested files + root full without post-processors.

Both decisions translated cleanly; no friction that would have favored the rejected options (post-strip / static sinks).

## Build & QA Observations

Build was smooth under TDD — failing stubs then green implementations for retention and LLM helpers. Verification builds (`docs:build:prose`, `docs:build:current`) confirmed gating and nested outputs. QA found only documentation nits (stale JSDoc, outdated config path in tasks.md); no substantive gaps.

## Cross-Phase Analysis

Preflight’s insistence on unit-testing `buildLlmsPluginOptions` paid off: config wiring was a thin import with no behavior surprises. Creative Q1/Q2 removed the open questions that would have stalled build. TypeScript 6 / `baseUrl` was correctly diagnosed in plan, so the TypeDoc fix was a one-line config change rather than a discovery during deploy.

## Insights

### Technical
- Prose vs API LLM gating does not need special entrypoint scripts when discovery is driven by whatever exists under `.generated` after `docs:sync` / API gen — empty scan ⇒ root-only custom files.
- TypeScript 6 turns deprecated `compilerOptions.baseUrl` into a hard error (TS5101); versioned TypeDoc path mappings that still rely on `baseUrl` need `ignoreDeprecations: "6.0"` (or a full paths migration) or historical generation fails while current TypeDoc (no `baseUrl`) keeps working.

### Process
- Extracting plugin option assembly into a Vitest-covered `scripts/` helper (preflight amendment) made the Docusaurus config rename a pure wiring step and kept TDD honest for config-shaped behavior.
