# Task: docs-llms-and-api-retention

* Task ID: docs-llms-and-api-retention
* Complexity: Level 3
* Type: feature

Add `docusaurus-plugin-llms`, restore broken versioned TypeDoc generation (TS6 `baseUrl` deprecation), and apply per-package major-version retention for API docs — with root LLM indexes that link API docs without inlining them, plus per-API-version LLM files when API gen runs.

## Open Questions

- [x] Q1: Root `llms.txt` vs `llms-full.txt` asymmetry → Resolved: disable default full file; emit prose-only `llms-full.txt` via `customLLMFiles` + ignorePatterns (see `memory-bank/active/creative/creative-root-llms-asymmetry.md`)
- [x] Q2: Per-API-version LLM emission → Resolved: dynamic `customLLMFiles` from `.generated` scan with nested filenames (see `memory-bank/active/creative/creative-per-api-version-llms.md`)
