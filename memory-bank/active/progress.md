# Progress

Add `docusaurus-plugin-llms` with prose/API-aware LLM artifact generation, restore broken versioned TypeDoc API docs, and apply per-package major-version retention so historical API generation stays feasible.

**Complexity:** Level 3

## 2026-07-19 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Intent clarified and approved (including prose-only gating for API LLM artifacts)
    - Complexity classified as Level 3
* Decisions made
    - Level 3: multiple docs components + design decisions, not a system-wide a16n architecture change
* Insights
    - Live Engine API page empty correlates with versioned TypeDoc failures in deploy generation
    - Plugin supports `customLLMFiles` / `versions` / `ignoreFiles`; root index-vs-full asymmetry and per-API-version roots may need careful config or light post-processing

## 2026-07-19 - PLAN - IN-PROGRESS

* Work completed
    - Mapped docs pipeline (`generate-versioned-api.ts`, `docusaurus.config.js`, script composition)
    - Reproduced TypeDoc failure: TS5101 — `baseUrl` deprecated under TypeScript 6 in `typedoc.versioned.json`
    - Identified two open questions requiring creative exploration (root LLM asymmetry; per-API-version LLM emission)
* Decisions made
    - Retention + TypeDoc fix are clear enough to plan without creative
* Insights
    - Current (non-versioned) TypeDoc still succeeds; only versioned config with `baseUrl` breaks

## 2026-07-19 - CREATIVE - COMPLETE

* Work completed
    - Q1: root LLM asymmetry → custom prose-only `llms-full.txt`
    - Q2: per-API-version LLM files → dynamic `customLLMFiles` from `.generated` scan
* Decisions made
    - Prefer plugin-native configuration over post-processors or `static/` sinks
* Insights
    - Plugin `writeFile` mkdir -p enables nested `engine/api/<ver>/llms.txt` paths

## 2026-07-19 - PLAN - COMPLETE

* Work completed
    - Full L3 plan in `tasks.md` (retention → TypeDoc fix → discovery helper → plugin wire → README → verify)
    - Tech validation: `docusaurus-plugin-llms@0.5.0` installed successfully
* Decisions made
    - Default `PREVIOUS_MAJORS = 2`; apply per package before TypeDoc runs
    - Keep task commits scoped to docs + memory-bank (unrelated staged package WIP left alone)
* Insights
    - How the TypeDoc error sneaked in: TypeScript 6 made deprecated `baseUrl` a hard error in the versioned TypeDoc config while current TypeDoc (no `baseUrl`) kept working

## 2026-07-19 - PREFLIGHT - COMPLETE

* Work completed
    - Validated plan against docs package conventions, TDD encoding, creative decisions
    - Amended plan: `scripts/llms-plugin-options.ts` + `buildLlmsPluginOptions` TDD; `docusaurus.config.ts` for imports
    - Wrote `.preflight-status` = PASS
* Decisions made
    - PASS with advisories (see preflight report) — build gated on operator `/niko-build`
* Insights
    - Vitest coverage only includes `scripts/**/*.ts` — helpers must not land under `src/`

## 2026-07-19 - BUILD - COMPLETE

* Work completed
    - Retention helper + main()/dry-run wiring; TypeDoc TS5101 fix; LLM plugin helpers; config rename+wire; README
    - Verification: 49 unit tests; `docs:build:prose` (root LLM, no nested API); TypeDoc versioned smoke; `docs:build:current` (nested LLM files)
* Decisions made
    - Built to creative Q1/Q2 (custom prose-only `llms-full.txt`; dynamic `customLLMFiles` from `.generated` scan)
* Insights
    - Current build registered 15 custom LLM files (1 root full + 7 version trees × 2)
