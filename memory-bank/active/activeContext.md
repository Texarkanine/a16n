# Active Context

**Current Task:** Fix glob-hook test environment / document correct test invocation  
**Phase:** COMPLEXITY-ANALYSIS - COMPLETE  
**Complexity:** Level 2

## What Was Done

Classified task as Level 2 (Simple Enhancement). The task spans two potential components:

1. `packages/glob-hook/test/cli.test.ts` — `runCli` hardcodes `cwd: process.cwd()`, which breaks when Vitest runs from the monorepo root because `tsx` only lives in the package's `node_modules`.
2. Documentation / config — correct invocation guidance for developers.

A design decision is needed before coding: fix the code, add docs, or both.

## Next Step

Load Level 2 workflow and begin the PLAN phase.
