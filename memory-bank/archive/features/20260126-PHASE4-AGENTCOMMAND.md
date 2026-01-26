# Task Archive: Phase 4 - AgentCommand Support

## Metadata

| Field | Value |
|-------|-------|
| **Task ID** | PHASE4-AGENTCOMMAND |
| **Complexity** | Level 3 (Intermediate) |
| **Type** | Feature |
| **Date Completed** | 2026-01-26 |
| **PR** | #8 |
| **Related Tasks** | Phase 1 (GlobalPrompt), Phase 2 (FileRule + AgentSkill), Phase 3 (AgentIgnore) |

---

## Summary

Phase 4 implemented one-way AgentCommand conversion from Cursor commands (`.cursor/commands/*.md`) to Claude skills (`.claude/skills/*/SKILL.md`). Simple commands are converted while complex commands (containing `$ARGUMENTS`, bash execution, file references, or `allowed-tools`) are skipped with warnings.

### Key Deliverables

- 8 tasks completed across 4 parallel tracks
- 10+ files modified across 4 packages (models, plugin-cursor, plugin-claude, cli)
- 230 tests pass across all packages (40+ new tests added)
- One-way conversion with complex command detection
- Full pass-through support for Cursor → Cursor

---

## Requirements

### Acceptance Criteria (All Met)

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `AgentCommand` added to `CustomizationType` enum | ✅ |
| AC2 | `AgentCommand` interface defined with appropriate fields | ✅ |
| AC3 | `isAgentCommand()` type guard exported from models | ✅ |
| AC4 | Cursor plugin discovers `.cursor/commands/**/*.md` files | ✅ |
| AC5 | Simple commands (no special features) classified as `AgentCommand` | ✅ |
| AC6 | Complex commands (with `$ARGUMENTS`, `!`, `@`, etc.) skipped with warning | ✅ |
| AC7 | Claude plugin emits `AgentCommand` as `.claude/skills/*/SKILL.md` | ✅ |
| AC8 | Emitted skills include description for `/command-name` invocation | ✅ |
| AC9 | Claude plugin never discovers `AgentCommand` entries | ✅ |
| AC10 | All tests pass: unit and integration | ✅ |

### Scope Constraints

- **Direction**: Cursor → Claude only (one-way)
- Claude has no dedicated command concept; skills serve double duty
- Complex commands skipped with explicit warnings (not lossy conversion)

---

## Implementation

### Approach

The implementation followed a TDD approach with 8 tasks across 4 parallel tracks:

1. **Track A (Models)**: Add `AgentCommand` type and `isAgentCommand()` helper
2. **Track B (Cursor Plugin)**: Command discovery and emission
3. **Track C (Claude Plugin)**: Command-to-skill emission, verify no discovery
4. **Track D (Finalization)**: Integration tests and documentation

### Key Components

| Component | Description |
|-----------|-------------|
| `AgentCommand` interface | New type with `commandName` field |
| `isAgentCommand()` | Type guard for filtering |
| `COMPLEX_COMMAND_PATTERNS` | Regex patterns for detecting unsupported features |
| `formatCommandAsSkill()` | Converts command to Claude skill format |

### Complex Feature Detection

| Feature | Detection Pattern | Example |
|---------|-------------------|---------|
| Arguments | `$ARGUMENTS` | `Fix issue #$ARGUMENTS` |
| Positional | `$1`, `$2`, etc. | `Review PR #$1` |
| Bash | `` !`command` `` | `` !`git branch` `` |
| File refs | `@path` | `Analyze @src/utils.js` |
| allowed-tools | Frontmatter key | `allowed-tools: Bash(*)` |

### Files Changed

**Models Package:**
- `packages/models/src/types.ts` - Added `AgentCommand` to enum and interface
- `packages/models/src/helpers.ts` - Added `isAgentCommand()` type guard
- `packages/models/src/index.ts` - Export new items

**Cursor Plugin:**
- `packages/plugin-cursor/src/discover.ts` - Command discovery with complex detection
- `packages/plugin-cursor/src/emit.ts` - Command emission

**Claude Plugin:**
- `packages/plugin-claude/src/emit.ts` - Command-to-skill emission with skill description

**CLI:**
- `packages/cli/test/integration/integration.test.ts` - Integration test scenarios

**Test Fixtures (New):**
- `packages/plugin-cursor/test/fixtures/cursor-command-simple/`
- `packages/plugin-cursor/test/fixtures/cursor-command-complex/`
- `packages/plugin-cursor/test/fixtures/cursor-command-mixed/`
- `packages/plugin-cursor/test/fixtures/cursor-command-nested/`
- `packages/cli/test/integration/fixtures/cursor-command-to-claude/`

**Documentation:**
- `README.md` - Added AgentCommand to feature list
- `packages/plugin-cursor/README.md` - Command discovery documentation
- `packages/plugin-claude/README.md` - Command-to-skill emission documentation

---

## Testing

### Test Coverage

| Package | Tests Added | Total Tests |
|---------|-------------|-------------|
| models | 4 | 20+ |
| plugin-cursor | 20+ | 80+ |
| plugin-claude | 10+ | 90+ |
| cli (integration) | 6+ | 40+ |
| **Total** | **40+** | **230** |

### Test Scenarios

1. Simple command discovery
2. Complex command detection (5 patterns: $ARGUMENTS, $1-$9, bash, @refs, allowed-tools)
3. Nested command discovery
4. Command emission to Cursor format (pass-through)
5. Command-to-skill emission in Claude format
6. Skill name collision handling
7. Claude never discovers AgentCommand (explicit test)
8. Integration: Cursor → Claude with commands

### Verification Commands

```bash
pnpm build      # ✅ Success
pnpm test       # ✅ 230 tests passing
pnpm lint       # ✅ No errors
```

---

## Lessons Learned

### Technical

1. **One-way conversions simplify implementation** - By explicitly scoping as Cursor → Claude only, no need to handle semantic gaps
2. **Skill description enables slash invocation** - `description: "Invoke with /command-name"` provides semantic mapping
3. **Pattern-based complex detection is extensible** - `COMPLEX_COMMAND_PATTERNS` object allows easy additions

### Process

1. **Fixture-first development enables TDD** - Creating fixtures before tests made TDD smoother
2. **Explicit complex feature detection is better than lossy conversion** - Users prefer clear warnings over silent data loss
3. **Planning accuracy was high (~98%)** - Code snippets in plan required minimal modification

### Challenges Addressed

1. **Package build order dependency** - Must rebuild models before testing dependent packages
2. **Regex for bash execution** - Pattern `/!\s*`[^`]+`/` correctly matches `!`command`` syntax
3. **PR #8 CodeRabbit fixes** - Path traversal sanitization, collision warnings, markdown escaping

---

## Future Considerations

1. **Phase 5**: Community plugin infrastructure (planned)
2. **Additional agents**: Windsurf, Codex support (future)
3. **Workspace-level configuration**: Cross-project settings

---

## Metrics Summary

| Metric | Value |
|--------|-------|
| Tasks Completed | 8/8 |
| Files Changed | 10+ |
| Tests Added | 40+ |
| Total Tests Passing | 230 |
| Acceptance Criteria Met | 10/10 |
| Build/Lint/Test | ✅ All passing |
