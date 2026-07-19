# Active Context

## Current Task: docs-llms-and-api-retention
**Phase:** CREATIVE - COMPLETE (Q3 llms.txt local serving)

## What Was Done
- Creative Q3: `docusaurus-plugin-llms` is postBuild-only → `/llms.txt` absent on `docs:dev:*`
- Decision: pre-start generate into `static/` via plugin generators; clear on sync; postBuild stays production authority
- Doc: `memory-bank/active/creative/creative-llms-dev-server-availability.md`

## Next Step
- Implement Q3 (TDD) when operator wants — or `/niko-archive` if deferring
