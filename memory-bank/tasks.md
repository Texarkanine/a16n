# Memory Bank: Tasks

## Current Task

**Phase 8 Milestone A1: Claude Rules Discovery**

Implement discovery of `.claude/rules/*.md` files with proper classification as GlobalPrompt (no paths) or FileRule (with paths frontmatter).

### Complexity Level

**Level 3** - Feature Enhancement (Intermediate)

### Task Context

Part of Phase 8: Claude Native Rules + Full AgentSkills.io Support. This milestone adds native support for Claude Code's new `.claude/rules/` directory with `paths` frontmatter, eliminating the need for glob-hook workarounds.

**References**:
- Spec: `/home/mobaxterm/Documents/git/a16n/planning/PHASE_8_SPEC.md` (lines 639-657)
- Claude Docs: https://code.claude.com/docs/en/memory#modular-rules-with-claude%2Frules%2F

### Acceptance Criteria

**AC-A1-1**: Rules without paths become GlobalPrompt
```bash
# Given: .claude/rules/style.md with no frontmatter
a16n discover --from claude .
# Expect: GlobalPrompt with content from style.md
```

**AC-A1-2**: Rules with paths become FileRule
```bash
# Given: .claude/rules/api.md with paths: ["src/api/**"]
a16n discover --from claude .
# Expect: FileRule with globs: ["src/api/**"]
```

**AC-A1-3**: Nested rules are discovered
```bash
# Given: .claude/rules/frontend/react.md
a16n discover --from claude .
# Expect: sourcePath includes subdirectory: ".claude/rules/frontend/react.md"
```

---

## Test Plan (TDD Phase 1: Determine Scope)

### Behaviors to Test

1. **File Discovery**:
   - Discover `.md` files in `.claude/rules/`
   - Discover nested `.md` files in subdirectories
   - Skip hidden directories (`.git`, etc.)
   - Handle missing `.claude/rules/` gracefully

2. **Frontmatter Parsing**:
   - Parse `paths:` as string array
   - Parse `paths:` as single string (normalize to array)
   - Handle missing frontmatter (no YAML block)
   - Handle frontmatter without paths
   - Preserve other frontmatter fields in metadata

3. **Classification Logic**:
   - No `paths` frontmatter → GlobalPrompt
   - Empty `paths` array → GlobalPrompt
   - `paths` with values → FileRule
   - Extract globs from `paths` field
   - Preserve body content in both types

4. **Integration**:
   - Discovery includes both CLAUDE.md and rules
   - Rules coexist with existing discovery (skills, ignore)
   - Proper ID generation for rules
   - Source path tracking with subdirectories

### Test Locations

**Existing Test Infrastructure**:
- File: `packages/plugin-claude/test/discover.test.ts`
- Pattern: Vitest `describe/it` blocks with fixtures

**New Test Suite**: Add `describe('Claude Rules Discovery (Phase 8 A1)')` block

**Test Fixtures** (to create):
- `packages/plugin-claude/test/fixtures/claude-rules-basic/from-claude/`
  - `.claude/rules/style.md` (no frontmatter)
  - `.claude/rules/testing.md` (no frontmatter)
- `packages/plugin-claude/test/fixtures/claude-rules-filebased/from-claude/`
  - `.claude/rules/api.md` (with `paths: ["src/api/**/*.ts"]`)
  - `.claude/rules/frontend.md` (with `paths: ["**/*.tsx"]`)
- `packages/plugin-claude/test/fixtures/claude-rules-nested/from-claude/`
  - `.claude/rules/frontend/react.md` (with paths)
  - `.claude/rules/backend/database.md` (no paths)
- `packages/plugin-claude/test/fixtures/claude-rules-mixed/from-claude/`
  - Mix of CLAUDE.md, rules/*.md, and skills/*/SKILL.md

---

## Implementation Plan

### Phase 1: Preparation (Stubbing)

**Status**: ⬜ Not Started

#### 1.1 Stub Test Suites
- [ ] Create test suite `describe('Claude Rules Discovery (Phase 8 A1)')`
- [ ] Stub test cases for file discovery (5 tests)
- [ ] Stub test cases for frontmatter parsing (5 tests)
- [ ] Stub test cases for classification (5 tests)
- [ ] Stub test cases for integration (4 tests)

#### 1.2 Stub Function Interfaces
- [ ] Add function signature `findClaudeRules(root: string): Promise<string[]>`
- [ ] Add function signature `parseClaudeRuleFrontmatter(content: string): ParsedClaudeRule`
- [ ] Add interface `ClaudeRuleFrontmatter { paths?: string[]; [key: string]: unknown; }`
- [ ] Add interface `ParsedClaudeRule { frontmatter: ClaudeRuleFrontmatter; body: string; }`
- [ ] Add JSDoc comments for all new functions

#### 1.3 Create Test Fixtures
- [ ] Create fixture: `claude-rules-basic/` (2 rules, no paths)
- [ ] Create fixture: `claude-rules-filebased/` (2 rules with paths)
- [ ] Create fixture: `claude-rules-nested/` (nested subdirectories)
- [ ] Create fixture: `claude-rules-mixed/` (rules + CLAUDE.md + skills)

### Phase 2: Write Tests

**Status**: ⬜ Not Started

#### 2.1 File Discovery Tests
- [ ] Test: discover rules from `.claude/rules/*.md`
- [ ] Test: discover nested rules in subdirectories
- [ ] Test: skip hidden directories
- [ ] Test: return empty array when directory missing
- [ ] Test: normalize path separators (cross-platform)

#### 2.2 Frontmatter Parsing Tests
- [ ] Test: parse `paths:` as string array
- [ ] Test: normalize single string to array
- [ ] Test: return empty frontmatter when no YAML block
- [ ] Test: return empty paths when field absent
- [ ] Test: preserve additional frontmatter fields

#### 2.3 Classification Tests
- [ ] Test: no `paths` → GlobalPrompt
- [ ] Test: empty `paths` array → GlobalPrompt
- [ ] Test: `paths` with globs → FileRule
- [ ] Test: FileRule includes correct globs
- [ ] Test: both types preserve body content

#### 2.4 Integration Tests
- [ ] Test: discover rules alongside CLAUDE.md
- [ ] Test: discover rules alongside skills
- [ ] Test: proper ID generation for rules
- [ ] Test: source path includes subdirectory structure

#### 2.5 Run Tests (Expect Failures)
- [ ] Run: `pnpm --filter @a16njs/plugin-claude test`
- [ ] Verify: All new tests fail as expected

### Phase 3: Implement Code

**Status**: ⬜ Not Started

#### 3.1 Implement `findClaudeRules()`
- [ ] Recursive directory traversal of `.claude/rules/`
- [ ] Filter for `*.md` files
- [ ] Skip hidden directories
- [ ] Return relative paths
- [ ] Handle missing directory gracefully

#### 3.2 Implement `parseClaudeRuleFrontmatter()`
- [ ] Parse YAML frontmatter block (between `---` markers)
- [ ] Extract `paths:` field
- [ ] Normalize single string to array
- [ ] Preserve other frontmatter fields
- [ ] Extract body content after frontmatter

#### 3.3 Update `discover()` Function
- [ ] Call `findClaudeRules()` after `findClaudeFiles()`
- [ ] Loop through discovered rules
- [ ] Parse frontmatter for each rule
- [ ] Classify as GlobalPrompt or FileRule
- [ ] Add to items array
- [ ] Generate unique IDs
- [ ] Handle read errors with warnings

#### 3.4 Run Tests (Make Tests Pass)
- [ ] Run: `pnpm --filter @a16njs/plugin-claude test`
- [ ] Fix any implementation issues
- [ ] Verify: All tests pass

### Phase 4: Verification & Quality

**Status**: ⬜ Not Started

#### 4.1 Code Quality
- [ ] Run: `pnpm --filter @a16njs/plugin-claude run format`
- [ ] Run: `pnpm --filter @a16njs/plugin-claude run lint -- --fix`
- [ ] Fix any linter errors

#### 4.2 Build Verification
- [ ] Run: `pnpm --filter @a16njs/plugin-claude run build`
- [ ] Verify: Build succeeds without errors

#### 4.3 Full Test Suite
- [ ] Run: `pnpm --filter @a16njs/plugin-claude test`
- [ ] Verify: All tests pass (new + existing)
- [ ] No regressions in existing discovery

#### 4.4 Integration Check
- [ ] Run: `pnpm build` (all packages)
- [ ] Run: `pnpm test` (all packages)
- [ ] Verify: No cross-package breakage

---

## Files to Modify

### Source Code
- `packages/plugin-claude/src/discover.ts` - Add functions, update discover()

### Tests
- `packages/plugin-claude/test/discover.test.ts` - Add new test suite

### Test Fixtures (New)
- `packages/plugin-claude/test/fixtures/claude-rules-basic/`
- `packages/plugin-claude/test/fixtures/claude-rules-filebased/`
- `packages/plugin-claude/test/fixtures/claude-rules-nested/`
- `packages/plugin-claude/test/fixtures/claude-rules-mixed/`

---

## Definition of Done

Milestone A1 is complete when:

- [ ] All 19 test cases pass
- [ ] `findClaudeRules()` discovers `.claude/rules/*.md` files
- [ ] `parseClaudeRuleFrontmatter()` correctly parses `paths:` field
- [ ] Rules without `paths` classified as GlobalPrompt
- [ ] Rules with `paths` classified as FileRule with correct globs
- [ ] Nested rules discovered with correct source paths
- [ ] No regressions in existing CLAUDE.md or skills discovery
- [ ] Code formatted and linted
- [ ] All package builds succeed
- [ ] Full test suite passes
- [ ] Ready for Milestone A2 (Claude Rules Emission)

---

## Next Steps After Completion

1. Proceed to **Milestone A2**: Claude Rules Emission
2. Update `emit.ts` to write `.claude/rules/*.md` files
3. Remove glob-hook integration
