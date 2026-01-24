# Memory Bank: Tasks

## Current Task

**Task ID**: PR1-FEEDBACK-ROUND2
**Title**: Address CodeRabbit PR #1 Feedback (Round 2)
**Complexity**: Level 2 (Bug Fixes / Code Quality)
**Status**: Reflection Complete

### Summary
Second round of CodeRabbit feedback after initial fixes. Addresses remaining documentation issues and implements the `--quiet` flag that's advertised but not functional.

### User Decisions
- **rimraf**: Skip adding to each package (YAGNI, pnpm hoisting handles it)
- **--quiet flag**: Must implement (docs are the bible)
- **content.trim()**: Remove (preserve exact content, minimal transformation)
- **.cursor/rules files**: Do NOT fix MD040 issues

### Implementation Checklist

#### Documentation Fixes
- [x] 1. Fix broken link `README.md:230` (`./docs/PLUGIN_DEVELOPMENT.md` → `./planning/PLUGIN_DEVELOPMENT.md`)
- [x] 2. Add language tag to `README.md:106` warning output code block
- [x] 3. Add language tag to `README.md:120` CLI reference code block
- [x] 4. Fix `packages/plugin-cursor/README.md` (`items` → `result.items`) - NOTE: plugin-cursor, not plugin-claude
- [x] 5. `packages/plugin-cursor/README.md:17` already shows `**/*.mdc` (verified)

#### Code Fixes
- [x] 6. Implement `--quiet` flag in `packages/cli/src/index.ts` (suppress non-error output)
- [x] 7. Remove `content.trim()` in `packages/plugin-claude/src/discover.ts` (preserve exact content)

#### Verification
- [x] 8. Run tests to ensure no regressions - **88 tests passing**
- [x] 9. Verify build passes - **5 packages built successfully**

---

## Previous Task

**Task ID**: PR1-FEEDBACK-REMEDIATION
**Title**: Address CodeRabbit PR #1 Feedback
**Complexity**: Level 2 (Bug Fixes / Code Quality)
**Status**: Complete

### Summary
PR #1 (feat: Phase 1 - GlobalPrompt MVP) received automated review from CodeRabbit with 3 Major issues and 21 Minor suggestions. This task addresses the valid, actionable items.

### Feedback Analysis

| Category | Count | Action |
|----------|-------|--------|
| Critical (must fix) | 1 | Fix |
| Major (should fix) | 2 | Fix |
| Documentation bugs | 5 | Fix |
| Code quality | 4 | Fix where low-effort |
| Markdown lint (MD040) | ~10 | Skip (cosmetic) |
| Design decisions | 1 | User decided |

### Implementation Checklist

#### Must Fix (Critical/Major)
- [x] 1. Delete `packages/models/vitest.config.ts.timestamp-*.mjs` (build artifact)
- [x] 2. Add `*.timestamp-*.mjs` to `.gitignore`
- [x] 3. Fix filename collision risk in `packages/plugin-cursor/src/emit.ts`
  - Handle empty sanitized names (fallback to 'rule')
  - Track used filenames and append counter on collision
  - Add warning when collision occurs (WarningCode.FileRenamed)

#### Should Fix (Code Quality)
- [x] 4. Use enum values in type guards (`packages/models/src/helpers.ts`)
  - Changed `'global-prompt' as CustomizationType` → `CustomizationType.GlobalPrompt`
  - Same for AgentSkill, FileRule, AgentIgnore

#### Documentation Fixes
- [x] 5. Fix broken link in `README.md:186` (`./docs/` → `planning/`)
- [x] 6. Fix undefined variable in `packages/plugin-claude/README.md` (`items` → `result.items`)
- [x] 7. Update `packages/plugin-cursor/README.md:17` pattern (`*.mdc` → `**/*.mdc`)
- [x] 8. Update copyright placeholder in `README.md:249` → `Texarkanine`
- [x] 9. Remove placeholder URLs in `README.md:154-157` (no community plugins yet)

#### Bonus (User Decision)
- [x] 10. Add `rimraf` for cross-platform clean scripts (all 6 package.json files)

#### Optional Improvements (Future)
- [ ] Add error handling to file write operations
- [ ] Add comment clarifying silent catch intent in discover.ts
- [ ] Consider warning on duplicate plugin registration

### Skipped Items (With Justification)
- **Markdown lint (MD040)**: Cosmetic only, internal docs, no functional impact
- **memory-bank status updates**: Will be correct after this task completes
- **Cross-platform clean script**: Unix-only acceptable for dev tooling
- **Test assertion patterns**: Current pattern works, stylistic preference
- **Dry-run unsupported array**: Acceptable Phase 1 limitation

---

## Previous Task

**Task ID**: CURSOR-RECURSIVE-DISCOVERY
**Title**: Fix Cursor plugin to recursively discover rules in subdirectories
**Complexity**: Level 2 (Bug Fix / Enhancement)
**Status**: Complete (2665a22)

### Problem
Cursor plugin only discovers `.cursor/rules/*.mdc` (flat), but Cursor supports subdirectories like `shared/`, `local/` within the rules directory.

### Scope
- **In scope**: `.cursor/rules/**/*.mdc` (recursive within root rules dir)
- **Future (TBD)**: `**/.cursor/rules/**/*.mdc` (nested rules dirs in subdirectories)

### Implementation (Complete)
- [x] Write test for recursive discovery within `.cursor/rules/`
- [x] Create fixture with nested subdirectories
- [x] Implement recursive `findMdcFiles` function
- [x] Update `sourcePath` to include subdirectory path
- [x] Verify all tests pass (85 total)
- [x] Verify on this repo - found 4 rules in nested dirs
- [x] Commit fix (2665a22)

---

## Previous Task (Awaiting Archive)

**Task ID**: PHASE1-IMPL
**Title**: Implement Phase 1 - GlobalPrompt MVP
**Complexity**: Level 4 (Complex System)
**Status**: Reflection Complete

## Completion Status
- [x] Initialization complete
- [x] Planning complete  
- [x] Implementation complete (10 tasks, 11 commits)
- [x] Reflection complete
- [ ] Archiving

## Task Overview

Implement the complete a16n pipeline for GlobalPrompt customization type with Cursor and Claude plugins, following TDD methodology.

## Implementation Tasks

### Task 1: Monorepo Setup
- [ ] Create root package.json with pnpm workspaces
- [ ] Configure pnpm-workspace.yaml
- [ ] Configure Turborepo (turbo.json)
- [ ] Create base TypeScript config
- [ ] Configure Changesets
- [ ] Create .gitignore
- [ ] Create package directories
- [ ] Initialize package stubs
- [ ] Verify build works
- [ ] **CHECKPOINT COMMIT**

### Task 2: Models Package (TDD)
- [ ] Write tests for type definitions
- [ ] Write tests for type guards
- [ ] Write tests for helper functions
- [ ] Stub interfaces and types
- [ ] Implement types.ts
- [ ] Implement plugin.ts
- [ ] Implement warnings.ts
- [ ] Implement helpers.ts
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 3: Cursor Plugin - Discovery (TDD)
- [ ] Create test fixtures (from-cursor directories)
- [ ] Write discovery tests
- [ ] Stub discover function
- [ ] Implement MDC parsing (regex-based)
- [ ] Implement file discovery
- [ ] Implement GlobalPrompt classification
- [x] Legacy .cursorrules NOT supported (decision made)
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 4: Cursor Plugin - Emission (TDD)
- [ ] Create test fixtures (to-cursor directories)
- [ ] Write emission tests
- [ ] Stub emit function
- [ ] Implement MDC file writing
- [ ] Implement directory creation
- [ ] Implement filename sanitization
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 5: Claude Plugin - Discovery (TDD)
- [ ] Create test fixtures (from-claude directories)
- [ ] Write discovery tests
- [ ] Stub discover function
- [ ] Implement CLAUDE.md discovery
- [ ] Implement nested file support
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 6: Claude Plugin - Emission (TDD)
- [ ] Create test fixtures (to-claude directories)
- [ ] Write emission tests
- [ ] Stub emit function
- [ ] Implement CLAUDE.md writing
- [ ] Implement merge logic with warnings
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 7: Engine (TDD)
- [ ] Write engine tests
- [ ] Stub A16nEngine class
- [ ] Implement plugin registration
- [ ] Implement discover method
- [ ] Implement convert method
- [ ] Implement dry-run mode
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 8: CLI (TDD)
- [ ] Write CLI command tests
- [ ] Stub CLI commands
- [ ] Implement convert command
- [ ] Implement discover command
- [ ] Implement plugins command
- [ ] Implement output formatting
- [ ] Verify all tests pass
- [ ] **CHECKPOINT COMMIT**

### Task 9: Integration Tests
- [ ] Create fixture-based test infrastructure
- [ ] Cursor → Claude basic fixture
- [ ] Claude → Cursor basic fixture
- [ ] Multiple files merge fixture
- [ ] Dry run mode tests
- [ ] JSON output tests
- [ ] Error handling tests
- [ ] Empty project tests
- [ ] Verify all acceptance criteria pass
- [ ] **CHECKPOINT COMMIT**

### Task 10: Documentation & Polish
- [ ] Update README.md (remove mockup warning)
- [ ] Write package READMEs
- [ ] Add --help content
- [ ] Review error messages
- [ ] Final lint/build/test verification
- [ ] **FINAL COMMIT**

## Task Dependencies

```
Task 1 (Monorepo) 
    ↓
Task 2 (Models)
    ↓
    ├─→ Task 3 (Cursor Discover) → Task 4 (Cursor Emit) ─┐
    ├─→ Task 5 (Claude Discover) → Task 6 (Claude Emit) ─┼─→ Task 8 (CLI)
    └─→ Task 7 (Engine) ────────────────────────────────┘
                                                            ↓
                                                      Task 9 (Integration)
                                                            ↓
                                                      Task 10 (Docs)
```

## Testing Strategy

- **Unit Tests**: Per-package, test individual functions/classes
- **Integration Tests**: Fixture-based filesystem tests in CLI package
  ```
  packages/cli/test/fixtures/<test-name>/
    from-<agent>/
      <agent config files>
    to-<agent>/
      <expected output files>
  ```

## Current Progress

- [x] Task analysis and complexity determination
- [x] Memory Bank updated
- [x] Task 1: Monorepo Setup (4016df2)
- [x] Task 2: Models Package (6af74a4)
- [x] Task 3: Cursor Plugin - Discovery (9ae8f27)
- [x] Task 4: Cursor Plugin - Emission (4d2700e)
- [x] Task 5: Claude Plugin - Discovery (dc9b98d)
- [x] Task 6: Claude Plugin - Emission (354e130)
- [x] Task 7: Engine (c04430b)
- [x] Task 8: CLI (ae17551)
- [x] Task 9: Integration Tests (6b7a3e1)
- [x] Task 10: Documentation & Polish (663a388)
- [x] Refactor: Remove .cursorrules legacy support (e97ba9b)

## Reflection Highlights
- **What Went Well**: TDD methodology, checkpoint commits, plugin architecture
- **Challenges**: Tooling setup (pnpm, vitest config), scope clarification
- **Lessons Learned**: Regex parsing for simple formats, fixture-based tests, document decisions
- **Next Steps**: Archive task, Phase 2 planning (AgentSkill, FileRule support)

## Requirements

From PHASE_1_SPEC.md:
- 10 Acceptance Criteria (AC1-AC10)
- TDD methodology (tests first)
- Checkpoint commits after each task
