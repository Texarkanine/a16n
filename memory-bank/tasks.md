# Memory Bank: Tasks

## Current Task

**Task ID**: PHASE1-IMPL
**Title**: Implement Phase 1 - GlobalPrompt MVP
**Complexity**: Level 4 (Complex System)
**Status**: In Progress

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
- [ ] Task 1: Monorepo Setup (STARTING)

## Requirements

From PHASE_1_SPEC.md:
- 10 Acceptance Criteria (AC1-AC10)
- TDD methodology (tests first)
- Checkpoint commits after each task
