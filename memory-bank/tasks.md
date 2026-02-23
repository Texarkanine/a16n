# Tasks: Issue #6 - GlobalPrompt Name Field Resolution

## Task 1: Update GlobalPrompt Type ✅ COMPLETED
- Added optional `name?: string` field to GlobalPrompt interface in models/src/types.ts
- Documented purpose: allows plugins to specify output filename
- Maintains backward compatibility (field is optional)

## Task 2: Update plugin-a16n Emission ✅ COMPLETED
- Import `isGlobalPrompt` helper
- Check for `isGlobalPrompt(item) && item.name` before using path-based naming
- Falls back to extractNameFromId() for backward compatibility

## Task 3: Update plugin-cursor Emission ✅ COMPLETED
- Prefer `gp.name` over `gp.sourcePath || gp.id` for filename
- Maintains sanitizeFilename() for consistency

## Task 4: Verify All Tests Pass ✅ COMPLETED
- plugin-a16n: 97 tests passing
- plugin-cursor: 123 tests passing
- No regressions introduced

## Task 5: Document Changes ✅ COMPLETED
- Investigation document created
- Comments added to code changes
- Architecture rationale documented

## Status
All tasks complete. Ready for publication.
