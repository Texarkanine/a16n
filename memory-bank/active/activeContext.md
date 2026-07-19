# Active Context

## Current Task: docs-llms-and-api-retention
**Phase:** BUILD - IN-PROGRESS

## What Was Done
- Preflight PASS; entering build
- Creative decisions reviewed (Q1 root asymmetry, Q2 per-API-version customLLMFiles)
- Step 1: `selectVersionsForRetention` + wiring into `main()` / dry-run (22 unit tests pass)
- Step 2: `typedoc.versioned.json` adds `ignoreDeprecations: "6.0"`
- Step 3: `llms-plugin-options.ts` + 5 unit tests (discovery + buildLlmsPluginOptions)

## Next Step
- Implementation plan step 4: wire plugin into `docusaurus.config.ts`
