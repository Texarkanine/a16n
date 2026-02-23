# Active Context: Issue #6 - GlobalPrompt Name Field

## Current Focus
Issue #6 fix completed - a16n framework now supports custom names for GlobalPrompt items.

## What Changed
1. **models**: GlobalPrompt now has optional `name?: string` field
2. **plugin-a16n**: Checks for name field before falling back to ID-based naming
3. **plugin-cursor**: Uses name field for GlobalPrompt filename generation
4. **plugin-cursorrules**: Sets `name: 'cursorrules'` on discovered items; added 4 tests

## Test Status
✅ All tests passing across three packages:
- cursorrules: 25/25 tests
- plugin-a16n: 97/97 tests  
- plugin-cursor: 123/123 tests

## Next Steps
1. Publish updated a16n packages
2. Remove `as any` cast in cursorrules once types available
3. Verify end-to-end emission filenames are correct
