# Memory Bank: Tasks

## Current Task

**Phase 8 Milestones A2 & A3: Claude Rules Emission + Remove glob-hook**

Implement native emission of GlobalPrompt/FileRule as `.claude/rules/*.md` files and remove all glob-hook integration from the Claude plugin.

### Complexity Level

**Level 3** - Feature Enhancement (Intermediate)

### Task Context

Part of Phase 8: Claude Native Rules + Full AgentSkills.io Support. These milestones complete the native Claude rules support by:
- **A2**: Emitting rules to `.claude/rules/*.md` with proper frontmatter
- **A3**: Removing glob-hook workaround code

**BREAKING CHANGE**: GlobalPrompts will no longer merge into single CLAUDE.md. Each becomes a separate `.claude/rules/*.md` file.

**References**:
- Spec: `/home/mobaxterm/Documents/git/a16n/planning/PHASE_8_SPEC.md` (lines 169-306)
- Discovery: Completed in Milestone A1

### Acceptance Criteria

**Milestone A2 (Emission)**:

**AC-A2-1**: GlobalPrompt emits as .claude/rules/*.md without frontmatter
```bash
# Given: Cursor rule with alwaysApply: true
a16n convert --from cursor --to claude .
# Expect: .claude/rules/<name>.md with content, no frontmatter
```

**AC-A2-2**: FileRule emits as .claude/rules/*.md with paths frontmatter
```bash
# Given: Cursor rule with globs: **/*.tsx
a16n convert --from cursor --to claude .
# Expect: .claude/rules/<name>.md with paths: ["**/*.tsx"]
```

**AC-A2-3**: No glob-hook configuration generated
```bash
# Given: Cursor FileRule
a16n convert --from cursor --to claude .
# Expect: NO .claude/settings.local.json hooks
# Expect: NO .a16n/rules/ directory
```

**Milestone A3 (Cleanup)**:

**AC-A3-1**: No glob-hook command in emitted settings
```bash
a16n convert --from cursor --to claude .
# Expect: No reference to @a16njs/glob-hook anywhere
```

**AC-A3-2**: No .a16n/rules/ directory created
```bash
a16n convert --from cursor --to claude .
# Expect: No .a16n/ directory
```

**AC-A3-3**: No approximation warning for FileRules
```bash
a16n convert --from cursor --to claude .
# Expect: No "approximated via glob-hook" warning
```

---

## Test Plan (TDD Phase 1: Determine Scope)

### Behaviors to Test

#### Milestone A2: Emission

1. **GlobalPrompt Emission**:
   - Emit single GlobalPrompt as `.claude/rules/<name>.md`
   - Emit multiple GlobalPrompts as separate `.claude/rules/*.md` files
   - NO frontmatter in GlobalPrompt files
   - Include source header for traceability
   - Sanitize filenames from sourcePath
   - Handle filename collisions

2. **FileRule Emission**:
   - Emit FileRule as `.claude/rules/<name>.md` with `paths:` frontmatter
   - Format paths as YAML array
   - Handle multiple globs correctly
   - Preserve rule content in body
   - Sanitize filenames

3. **Legacy Behavior Removed**:
   - No CLAUDE.md merging (BREAKING)
   - No .a16n/rules/ directory creation
   - No settings.local.json hook writing
   - No glob-hook command references

4. **Integration**:
   - Mixed GlobalPrompt + FileRule emission
   - Coexist with AgentSkill/AgentIgnore/ManualPrompt
   - Proper file tracking in WrittenFile[]
   - No merged warnings for GlobalPrompts

#### Milestone A3: Cleanup

1. **Code Removal**:
   - `buildHookConfig()` function removed
   - `escapeShellArg()` function removed
   - `.a16n/rules/` directory code removed
   - `settings.local.json` hook code removed

2. **Warning Changes**:
   - No `WarningCode.Approximated` for FileRules
   - FileRule conversion is lossless

3. **Test Updates**:
   - Remove glob-hook expectation tests
   - Update to verify native rules instead

### Test Locations

**Existing Test Infrastructure**:
- File: `packages/plugin-claude/test/emit.test.ts`
- Pattern: Vitest `describe/it` blocks with temp directory
- Cleanup: `beforeEach/afterEach` handles temp dir

**Test Modifications**:
- Update existing GlobalPrompt tests (BREAKING: no more CLAUDE.md merging)
- Update existing FileRule tests (NEW: .claude/rules/, no glob-hook)
- Remove glob-hook related tests
- Add new tests for native rules emission

**Estimated Test Changes**:
- ~15 tests to update (GlobalPrompt behavior change)
- ~12 tests to update (FileRule behavior change)
- ~6 tests to remove (glob-hook related)
- ~8 new tests (native rules specifics)

---

## Implementation Plan

### Phase 1: Preparation (Stubbing)

**Status**: ⬜ Not Started

#### 1.1 Update Existing Tests (Stub Changes)
- [ ] Mark tests affected by BREAKING changes
- [ ] Stub changes to GlobalPrompt emission tests (~15 tests)
- [ ] Stub changes to FileRule emission tests (~12 tests)
- [ ] Identify glob-hook tests to remove (~6 tests)

#### 1.2 Stub New Emission Functions
- [ ] Add function signature `formatGlobalPromptAsClaudeRule(gp: GlobalPrompt): string`
- [ ] Add function signature `formatFileRuleAsClaudeRule(fr: FileRule): string`
- [ ] Add JSDoc comments
- [ ] Mark existing functions for removal (buildHookConfig, escapeShellArg)

#### 1.3 Create New Tests
- [ ] Stub test: Single GlobalPrompt → `.claude/rules/`
- [ ] Stub test: Multiple GlobalPrompts → separate `.claude/rules/*.md`
- [ ] Stub test: FileRule → `.claude/rules/` with paths frontmatter
- [ ] Stub test: No CLAUDE.md created
- [ ] Stub test: No .a16n/rules/ created
- [ ] Stub test: No settings.local.json hooks
- [ ] Stub test: Mixed emission (GP + FR + Skills)
- [ ] Stub test: No approximation warnings for FileRules

### Phase 2: Write Tests

**Status**: ⬜ Not Started

#### 2.1 Update GlobalPrompt Tests
- [ ] Update: Single GlobalPrompt emits to `.claude/rules/`
- [ ] Update: Multiple GlobalPrompts emit as separate files
- [ ] Update: No CLAUDE.md created (BREAKING)
- [ ] Update: No merge warnings
- [ ] Add: Verify no frontmatter in GP files
- [ ] Add: Verify source header present
- [ ] Add: Verify filename sanitization

#### 2.2 Update FileRule Tests
- [ ] Update: FileRule emits to `.claude/rules/`
- [ ] Update: Verify `paths:` frontmatter format
- [ ] Update: Multiple globs formatted correctly
- [ ] Update: No .a16n/rules/ directory
- [ ] Update: No settings.local.json
- [ ] Update: No glob-hook command
- [ ] Add: Verify no approximation warnings

#### 2.3 Remove Glob-Hook Tests
- [ ] Remove: buildHookConfig tests
- [ ] Remove: settings.local.json merging tests
- [ ] Remove: .a16n/rules/ creation tests
- [ ] Remove: glob-hook command format tests
- [ ] Remove: approximation warning tests
- [ ] Remove: hook escaping tests

#### 2.4 Add Integration Tests
- [ ] Test: GP + FR mixed emission
- [ ] Test: GP + FR + Skills + Ignore + ManualPrompt
- [ ] Test: Filename collision handling
- [ ] Test: Round-trip (discover + emit native rules)

#### 2.5 Run Tests (Expect Failures)
- [ ] Run: `pnpm --filter @a16njs/plugin-claude test`
- [ ] Verify: Updated tests fail as expected
- [ ] Document: Expected failure count

### Phase 3: Implement Code

**Status**: ⬜ Not Started

#### 3.1 Implement New Emission Functions
- [ ] Implement `formatGlobalPromptAsClaudeRule()`
  - No frontmatter
  - Add source header
  - Return formatted markdown
- [ ] Implement `formatFileRuleAsClaudeRule()`
  - YAML frontmatter with `paths:`
  - Format globs as array
  - Add source header
  - Return formatted markdown

#### 3.2 Update emit() Function - GlobalPrompt Section
- [ ] Replace CLAUDE.md merging logic
- [ ] Create `.claude/rules/` directory
- [ ] Loop through each GlobalPrompt
- [ ] Sanitize filenames with collision handling
- [ ] Write individual `.claude/rules/<name>.md` files
- [ ] Track written files
- [ ] Remove merge warnings

#### 3.3 Update emit() Function - FileRule Section
- [ ] Replace .a16n/rules/ creation
- [ ] Replace settings.local.json hook writing
- [ ] Emit each FileRule to `.claude/rules/<name>.md`
- [ ] Use `formatFileRuleAsClaudeRule()`
- [ ] Sanitize filenames with collision handling
- [ ] Track written files
- [ ] Remove approximation warnings

#### 3.4 Remove Glob-Hook Code
- [ ] Remove `buildHookConfig()` function
- [ ] Remove `escapeShellArg()` function
- [ ] Remove .a16n/rules/ directory creation code
- [ ] Remove settings.local.json hook code
- [ ] Remove glob-hook related comments

#### 3.5 Update Warning Logic
- [ ] Remove `WarningCode.Approximated` for FileRules
- [ ] Remove merge warnings for GlobalPrompts (no longer merged)
- [ ] Keep other warnings (Skipped, etc.)

#### 3.6 Run Tests (Make Tests Pass)
- [ ] Run: `pnpm --filter @a16njs/plugin-claude test`
- [ ] Fix implementation issues iteratively
- [ ] Verify: All tests pass

### Phase 4: Verification & Quality

**Status**: ⬜ Not Started

#### 4.1 Code Quality
- [ ] Run: `pnpm run lint`
- [ ] Fix any linter errors
- [ ] Verify: No unused imports/functions

#### 4.2 Build Verification
- [ ] Run: `pnpm --filter @a16njs/plugin-claude run build`
- [ ] Verify: Build succeeds without errors

#### 4.3 Full Test Suite
- [ ] Run: `pnpm --filter @a16njs/plugin-claude test`
- [ ] Verify: All tests pass (updated count)
- [ ] No regressions in other types (Skills, Ignore, ManualPrompt)

#### 4.4 Integration Check
- [ ] Run: `pnpm build` (all packages)
- [ ] Run: `pnpm test` (all packages)
- [ ] Verify: No cross-package breakage

#### 4.5 Manual Verification
- [ ] Create test project with Cursor rules
- [ ] Run: `a16n convert --from cursor --to claude .`
- [ ] Verify: `.claude/rules/*.md` files created
- [ ] Verify: No CLAUDE.md created
- [ ] Verify: No .a16n/ directory
- [ ] Verify: No settings.local.json hooks
- [ ] Test discovery round-trip

---

## Files to Modify

### Source Code
- `packages/plugin-claude/src/emit.ts` - Major refactor
  - Add 2 new functions
  - Remove 2 functions (buildHookConfig, escapeShellArg)
  - Rewrite GlobalPrompt emission (~50 lines)
  - Rewrite FileRule emission (~80 lines)
  - Remove glob-hook code (~100 lines)

### Tests
- `packages/plugin-claude/test/emit.test.ts` - Extensive updates
  - Update ~27 existing tests
  - Remove ~6 tests
  - Add ~8 new tests

---

## Breaking Changes

### For Users

**BEFORE (Current)**:
```
a16n convert --from cursor --to claude .
```
Output:
- `CLAUDE.md` (all GlobalPrompts merged)
- `.a16n/rules/*.md` (FileRule content)
- `.claude/settings.local.json` (glob-hook configuration)

**AFTER (Phase 8 A2/A3)**:
```
a16n convert --from cursor --to claude .
```
Output:
- `.claude/rules/rule1.md` (GlobalPrompt 1)
- `.claude/rules/rule2.md` (GlobalPrompt 2)
- `.claude/rules/api-rules.md` (FileRule with paths)
- No CLAUDE.md
- No .a16n/ directory
- No glob-hook dependency

### Migration Guide (for users)

**If you were using merged CLAUDE.md**:
- Individual rules are now in `.claude/rules/*.md`
- Claude Code automatically loads all files in this directory
- No action needed - functionality equivalent

**If you were using glob-hook**:
- Remove `@a16njs/glob-hook` from package.json
- Delete `.a16n/` directory
- FileRules now use native Claude paths frontmatter
- No behavior change - Claude now handles this natively

---

## Definition of Done

Milestones A2 & A3 are **complete** when:

- [ ] All existing tests updated and passing
- [ ] New emission tests passing (~8 tests)
- [ ] Glob-hook code completely removed
- [ ] No references to glob-hook in emitted files
- [ ] No .a16n/ directory created
- [ ] No CLAUDE.md created (BREAKING)
- [ ] GlobalPrompts emit to `.claude/rules/*.md` (no frontmatter)
- [ ] FileRules emit to `.claude/rules/*.md` (with paths frontmatter)
- [ ] No approximation warnings for FileRules
- [ ] Code formatted and linted
- [ ] All package builds succeed
- [ ] Full test suite passes (all packages)
- [ ] Manual verification complete
- [ ] Ready for Milestone A4 (Documentation Cleanup)

---

## Estimated Effort

**Milestone A2**: ~3-4 hours
- New emission functions: 1 hour
- Update emit() function: 1.5 hours
- Update tests: 1 hour
- Verification: 0.5 hours

**Milestone A3**: ~1-2 hours
- Remove glob-hook code: 0.5 hours
- Update tests: 0.5 hours
- Verification: 0.5 hours

**Total**: ~4-6 hours for both milestones

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking change user impact | High | Medium | Document clearly in changelog; provide migration guide |
| Test coverage gaps | Low | High | Comprehensive test updates; manual verification |
| Filename collision edge cases | Medium | Low | Reuse existing `getUniqueFilename()` utility |
| Round-trip compatibility | Low | Medium | Add round-trip integration test |

---

## Next Steps After Completion

1. **Milestone A4**: Documentation Cleanup
   - Update plugin-claude README
   - Update docs site pages
   - Add migration guide
   - Update architecture diagrams

2. **Future Milestones** (B1-B4): AgentSkills.io Full Support
   - Rename AgentSkill → SimpleAgentSkill
   - Add AgentSkillIO type
   - Implement full skill discovery/emission
