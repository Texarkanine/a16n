# Active Context

## Current Focus
All bugs on the `plugin-cursorrules` branch have been fixed. The branch is ready for PR.

## Recent Changes
- Fixed 3 build errors (missing io.ts, OrphanPathRef ICONS, LocalWorkspace/toWorkspace in models)
- Fixed 23 plugin-a16n parse test failures (workspace migration for parseIRFile)
- Restored --from-dir, --to-dir, --rewrite-path-refs CLI flags (10 tests)
- Extracted handleConvert and handleDiscover into testable command modules (21 tests)
- Exported createProgram factory from index.ts (5 tests)
- Full monorepo: 807 tests passing, 0 failures

## Key Architecture Decisions
- `CommandIO` interface pattern enables unit testing of CLI handlers without subprocess overhead
- `createProgram(engine)` factory enables doc generation and structural tests
- `isMainModule` guard prevents `program.parse()` from running during test imports
- Git-ignore match mode complex logic fully preserved in extracted `handleConvert`

## Next Steps
- Open PR for the plugin-cursorrules branch work
