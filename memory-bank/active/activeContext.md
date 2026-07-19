# Active Context

## Current Task: docs-llms-and-api-retention
**Phase:** BUILD - COMPLETE

## What Was Done
- Retention: `selectVersionsForRetention` (default previousMajors=2) wired into versioned API gen
- TypeDoc: `ignoreDeprecations: "6.0"` in `typedoc.versioned.json` (TS5101 smoke OK)
- LLM helpers: `scripts/llms-plugin-options.ts` — discovery + `buildLlmsPluginOptions`
- Config: `docusaurus.config.js` → `docusaurus.config.ts` with `docusaurus-plugin-llms`
- README: LLM endpoints + retention documented
- Verification: 49 unit tests; prose build (root LLM only); current build (nested API/CLI LLM files)

## Files modified
- `packages/docs/scripts/generate-versioned-api.ts`
- `packages/docs/scripts/llms-plugin-options.ts` (new)
- `packages/docs/test/generate-versioned-api.test.ts`
- `packages/docs/test/llms-plugin-options.test.ts` (new)
- `packages/docs/typedoc.versioned.json`
- `packages/docs/docusaurus.config.ts` (renamed from `.js`)
- `packages/docs/README.md`
- `memory-bank/techContext.md` (config path)

## Deviations from Plan
- None — built to plan

## Next Step
- Phase transition commit, then `/niko-qa` (auto via L3 workflow)
