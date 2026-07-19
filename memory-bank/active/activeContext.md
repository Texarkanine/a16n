# Active Context

## Current Task: docs-llms-and-api-retention
**Phase:** REFLECT - COMPLETE (follow-up fix in progress)

## What Was Done
- Diagnosed empty API picker: `docs:dev:prose` wiped `.generated/*/api` while stale `static/versions.json` still fed VersionPicker → 404s
- Ran `docs:gen:versioned` — TypeDoc retention path succeeds 17/17; engine/plugin-cursor pages render with content
- Fix: `docs:sync` clears `versions.json` via `clear-versions-manifest.ts`; README notes API entrypoints

## Next Step
- Commit follow-up fix; operator should use `docs:dev:api` or `docs:gen:versioned` + `docs:dev:only` for API browsing
- Then `/niko-archive` when satisfied
