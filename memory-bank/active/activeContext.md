# Active Context

## Current Task: issue-147-manualprompt-description
**Phase:** BUILD - COMPLETE

## What Was Done
- Added optional `description` on `ManualPrompt`; bumped IR to `v1beta4`
- Discover (Claude/Cursor skills) preserves non-empty authored description; commands leave it undefined
- IR format/parse round-trips optional description
- Emit preserves authored description; synthesizes `Invoke with /<name>` only when absent
- agentsmd still marks ManualPrompt Unsupported (with authored description case covered)
- Docs/README updated; full `pnpm build && pnpm test -- --force && pnpm typecheck` green

## Files modified
- `packages/models/src/types.ts`, `packages/models/src/version.ts`, models tests
- `packages/plugin-claude/src/discover.ts`, `emit.ts`, related tests
- `packages/plugin-cursor/src/discover.ts`, `emit.ts`, related tests
- `packages/plugin-a16n/src/format.ts`, `parse.ts`, tests/fixtures; version literal sweep
- `packages/plugin-agentsmd/test/emit-unsupported.test.ts`
- `packages/docs/docs/models/index.md`, `packages/docs/docs/plugin-a16n/index.md`
- `packages/plugin-claude/README.md`, `packages/plugin-a16n/README.md`

## Next Step
- QA review (autonomous for Level 2)
