# Memory Bank: Progress

## Phase 8 Milestones A2 & A3: Claude Rules Emission + Remove glob-hook

**Status**: Planning Complete, Implementation Not Started
**Last Updated**: 2026-01-31

---

## Milestone Status

### Milestone A1: Claude Rules Discovery
**Status**: ✅ Complete
- Reflection document created
- All acceptance criteria met
- Ready to proceed

### Milestone A2: Claude Rules Emission
**Status**: 📋 Planned, Not Started
- Implementation plan created
- Test strategy defined
- Ready for TDD execution

### Milestone A3: Remove glob-hook
**Status**: 📋 Planned, Not Started
- Cleanup plan created
- Code removal identified
- Ready for execution after A2

---

## Implementation Progress

### Phase 1: Preparation (Stubbing)
**Status**: ⬜ Not Started

- Test updates identified: 0/~27 updated
- Test removals identified: 0/~6 removed
- New tests identified: 0/~8 created
- Function interfaces: 0/2 stubbed

### Phase 2: Write Tests
**Status**: ⬜ Not Started

- GlobalPrompt tests: 0/7 updated
- FileRule tests: 0/7 updated
- Glob-hook tests: 0/6 removed
- Integration tests: 0/4 added

### Phase 3: Implement Code
**Status**: ⬜ Not Started

- New functions: 0/2 implemented
- GlobalPrompt emission: ⬜ Not updated
- FileRule emission: ⬜ Not updated
- Glob-hook removal: ⬜ Not started

### Phase 4: Verification
**Status**: ⬜ Not Started

- Tests passing: ❌
- Code formatted/linted: ❌
- Build succeeds: ❌
- Manual verification: ❌

---

## Test Results

No tests run yet for A2/A3.

**Expected Changes**:
- Current: ~91 tests (50 emit + 41 discovery)
- After A2/A3: ~87 tests (44 emit + 41 discovery, 2 new integration)
- Net change: -4 tests (removed glob-hook tests) + 8 new - 4 obsolete = ~91 tests

---

## Breaking Changes Tracking

### User-Facing Changes

**BEFORE (Current)**:
```
Output from cursor → claude:
  - CLAUDE.md (merged GlobalPrompts)
  - .a16n/rules/*.md (FileRule content)
  - .claude/settings.local.json (glob-hook config)
```

**AFTER (A2/A3)**:
```
Output from cursor → claude:
  - .claude/rules/*.md (individual GlobalPrompts, no frontmatter)
  - .claude/rules/*.md (FileRules with paths frontmatter)
  - NO CLAUDE.md
  - NO .a16n/ directory
  - NO settings.local.json hooks
```

### Technical Changes

**Code Removals**:
- `buildHookConfig()` function (~15 lines)
- `escapeShellArg()` function (~3 lines)
- `.a16n/rules/` creation (~60 lines)
- `settings.local.json` hook writing (~50 lines)
- Glob-hook warnings (~5 lines)
- **Total removal**: ~130 lines

**Code Additions**:
- `formatGlobalPromptAsClaudeRule()` (~10 lines)
- `formatFileRuleAsClaudeRule()` (~15 lines)
- New GlobalPrompt emission (~40 lines)
- New FileRule emission (~50 lines)
- **Total addition**: ~115 lines

**Net change**: -15 lines (cleaner codebase!)

---

## Planning Insights

### What's Well-Defined
1. **Clear scope**: Emission + cleanup, no architectural changes
2. **Test strategy**: Update existing, remove obsolete, add integration
3. **Breaking changes**: Documented and intentional
4. **Reusable patterns**: A1 established filename handling patterns

### What Needs Care
1. **Test updates**: 27 tests need careful updating for new behavior
2. **Breaking change communication**: Need clear changelog/migration guide
3. **Round-trip testing**: Ensure discover ↔ emit works correctly
4. **Manual verification**: Real-world test before declaring complete

### Lessons from A1
1. **TDD works**: Invest in test design upfront
2. **Fixtures help**: Consider if emission needs fixtures (probably temp dir is fine)
3. **Incremental verification**: Test package-level before full suite
4. **Document decisions**: Keep progress.md updated

---

## Next Action

When `/build` is invoked:
1. Start with Phase 1: Stubbing
2. Update existing emit tests to expect new behavior
3. Stub new emission functions
4. Follow TDD cycle through Phase 4
