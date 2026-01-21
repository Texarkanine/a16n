# Memory Bank: Tasks

## Current Task

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
