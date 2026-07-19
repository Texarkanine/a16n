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
