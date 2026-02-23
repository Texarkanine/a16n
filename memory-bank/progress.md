# Progress: Issue #6 - GlobalPrompt Name Field

## Completed Work

### Framework Updates (a16n)

**models/src/types.ts**
- ✅ Added `name?: string` to GlobalPrompt interface
- ✅ Documentation explaining field purpose
- ✅ Type-safe, mirrors SimpleAgentSkill pattern

**plugin-a16n/src/emit.ts**  
- ✅ Added `isGlobalPrompt` import
- ✅ Updated `emitStandardIR()` logic: check name before ID-based fallback
- ✅ All 97 tests passing

**plugin-cursor/src/emit.ts**
- ✅ GlobalPrompt emission prefers `name` field
- ✅ Uses existing `sanitizeFilename()` for consistency
- ✅ All 123 tests passing

### Plugin Updates (a16n-plugin-cursorrules)

**src/discover.ts**
- ✅ Sets `name: 'cursorrules'` on all discovered items
- ✅ Uses `as any` cast (temporary during type propagation)

**test/discover.test.ts**
- ✅ Added 4 tests for name field behavior
- ✅ All 25 tests passing

## Verification Results
- ✅ No test regressions
- ✅ Backward compatibility maintained
- ✅ Type safety preserved (with cast during transition)
- ✅ Architecture validated

## Status: READY FOR PUBLICATION
All changes tested, documented, and ready for release.
