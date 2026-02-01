# Memory Bank: Progress

## Phase 8 Part B: Full AgentSkills.io Support

**Status**: 📋 PLANNING COMPLETE
**Last Updated**: 2026-02-01
**Reference**: `memory-bank/tasks.md`

---

## Milestone Progress

| Milestone | Description | Tasks | Complete | Status |
|-----------|-------------|-------|----------|--------|
| 4 | Type System Updates | 13 | 0 | ⏳ Not Started |
| 5 | AgentSkillIO Discovery | 8 | 0 | ⏳ Not Started |
| 6 | AgentSkillIO Emission | 6 | 0 | ⏳ Not Started |
| 7 | Integration & Polish | 6 | 0 | ⏳ Not Started |
| **Total** | | **33** | **0** | **0%** |

---

## Planning Artifacts

### Research Completed

1. **Current Type System**
   - `AgentSkill` interface in `packages/models/src/types.ts`
   - `isAgentSkill()` helper in `packages/models/src/helpers.ts`
   - Used in both plugin-cursor and plugin-claude

2. **Current Discovery**
   - Both plugins discover `.cursor/skills/*/SKILL.md` and `.claude/skills/*/SKILL.md`
   - Only read SKILL.md content, ignore other files
   - Classify as `AgentSkill` or `ManualPrompt`

3. **Current Emission**
   - Skills go to `.cursor/skills/` or `.claude/skills/` directories
   - Single SKILL.md file per skill

4. **Test Infrastructure**
   - Fixture-based testing with `from-*` and `to-*` directories
   - Integration tests in `packages/cli/test/integration/`
   - 416+ tests currently passing

### Files Identified for Modification

**Models (11 files)**:
- types.ts, helpers.ts, index.ts
- 4 test files

**Plugin-Cursor (4 files)**:
- discover.ts, emit.ts
- 2 test files

**Plugin-Claude (4 files)**:
- discover.ts, emit.ts
- 2 test files

**Integration (2+ files)**:
- integration.test.ts
- New test fixtures

### Fixtures Identified for Creation

1. `cursor-skills-complex/` - Complex Cursor skill with resources
2. `claude-skills-complex/` - Complex Claude skill with hooks
3. `cursor-to-claude-complex-skill/` - Integration test
4. `claude-to-cursor-complex-skill/` - Integration test

---

## Acceptance Criteria Tracking

### Part B Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-B1-1 | SimpleAgentSkill type exists, AgentSkill is deprecated alias | ⏳ |
| AC-B2-1 | AgentSkillIO type supports hooks, resources, files | ⏳ |
| AC-B3-1 | Discovery reads entire skill directories | ⏳ |
| AC-B3-2 | Simple skills classified as SimpleAgentSkill/ManualPrompt | ⏳ |
| AC-B3-3 | Complex skills classified as AgentSkillIO | ⏳ |
| AC-B4-1 | Simple AgentSkillIO emits as Cursor rule (idiomatic) | ⏳ |
| AC-B4-2 | Complex AgentSkillIO emits to .cursor/skills/ with resources | ⏳ |
| AC-B4-3 | Hooks copied verbatim with warning | ⏳ |
| AC-7-1 | Round-trip tests pass (Claude → Cursor → Claude) | ⏳ |
| AC-7-2 | Round-trip tests pass (Cursor → Claude → Cursor) | ⏳ |

---

## Estimated Effort

| Milestone | Tasks | Est. Time |
|-----------|-------|-----------|
| 4 | Type System Updates | ~2 hours |
| 5 | AgentSkillIO Discovery | ~3 hours |
| 6 | AgentSkillIO Emission | ~3 hours |
| 7 | Integration & Polish | ~2 hours |
| **Total** | **33 tasks** | **~10 hours** |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backward compat issues | Low | High | Provide deprecated aliases, test existing code |
| Complex skill edge cases | Medium | Low | Start simple, iterate based on real usage |
| Test fixture complexity | Medium | Low | Create minimal but representative fixtures |
| Discovery performance | Low | Low | Use existing patterns, don't over-optimize |

---

## Ready for Implementation

Plan is complete. When `/build` is invoked:

1. **Follow TDD process**:
   - Stub tests first (expect failures)
   - Implement code
   - Verify tests pass
   
2. **Work in order**:
   - Milestone 4 first (type system is prerequisite)
   - Then 5, 6, 7 sequentially

3. **Verify after each milestone**:
   ```bash
   pnpm format && pnpm lint -- --fix && pnpm build && pnpm test
   ```

4. **Create reflection docs** after each milestone
