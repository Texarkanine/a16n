# Active Context

## Current Task: docs-llms-and-api-retention
**Phase:** BUILD - COMPLETE (Q3 llms.txt local serving)

## What Was Done
- `scripts/llms-static.ts`: clear + generate into `static/` via plugin generators
- `docs:site:start` runs `docs:llms:static` first; sync clears LLM static artifacts
- Gitignore + README; 56 docs unit tests pass
- Live check: `/a16n/llms.txt` returns `text/plain` (not SPA HTML)

## Next Step
- Operator hard-refresh `/a16n/llms.txt`; then `/niko-archive` when ready
