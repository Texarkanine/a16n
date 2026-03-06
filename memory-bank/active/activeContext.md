# Active Context

## Current Task: CLI Coverage Hardening
**Phase:** PLAN - COMPLETE

## What Was Done
- Analyzed vitest coverage config across all packages (consistent `v8` provider, `src/**/*.ts` include pattern)
- Researched vitest subprocess coverage: confirmed it's a known limitation (issue #7064, p2-nice-to-have). `NODE_V8_COVERAGE` workaround exists but requires custom merge tooling — not worth the complexity for this project.
- Identified `io.ts` as the only pure-interface file needing exclusion
- Planned 10 specific behavioral tests (B1-B10) for handleDeleteSource and handleGitIgnoreMatch
- All tests extend existing `convert.test.ts` using established mock patterns

## Key Decisions
- E2E coverage: **not pursuing** — cost/complexity of custom merge tooling outweighs benefit given we're adding unit tests for the critical paths
- output.ts: **not testing** per user directive — whitebox testing of warning rendering is brittle
- All new tests go in existing `convert.test.ts` — no new test files

## Next Step
- Preflight validation, then build
