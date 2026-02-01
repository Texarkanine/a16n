# Memory Bank: Tasks

## Phase 8 Status

**Part A (Claude Native Rules Support)**: ✅ COMPLETE
**Part B (Full AgentSkills.io Support)**: ⏳ Not Started

---

## Part A Summary (Complete)

All four milestones successfully implemented on 2026-01-31 and 2026-02-01.

| Milestone | Description | Status | Reflection |
|-----------|-------------|--------|------------|
| A1 | Claude Rules Discovery | ✅ Complete | `reflection-phase8-milestone-a1.md` |
| A2 | Claude Rules Emission | ✅ Complete | `reflection-phase8-milestone-a2-a3.md` |
| A3 | Remove glob-hook | ✅ Complete | `reflection-phase8-milestone-a2-a3.md` |
| A4 | Documentation Cleanup | ✅ Complete | `reflection-phase8-milestone-a4.md` |

### Key Achievements
- Native `.claude/rules/*.md` discovery and emission
- Lossless FileRule conversion (no more glob-hook approximation)
- GlobalPrompts emit as individual files (no more merging)
- 416 tests passing across all packages
- Documentation fully updated with deprecation notes

### Acceptance Criteria (All Met)

**AC-A1-1**: Claude rules without paths → GlobalPrompt ✅
**AC-A1-2**: Claude rules with paths → FileRule ✅
**AC-A1-3**: Nested rules discovered with correct paths ✅
**AC-A2-1**: GlobalPrompt emits to `.claude/rules/*.md` without frontmatter ✅
**AC-A2-2**: FileRule emits to `.claude/rules/*.md` with paths frontmatter ✅
**AC-A2-3**: No glob-hook configuration generated ✅
**AC-A3-1**: No glob-hook command in emitted settings ✅
**AC-A3-2**: No `.a16n/rules/` directory created ✅
**AC-A3-3**: No approximation warning for FileRules ✅
**AC-A4-1**: Documentation updated, glob-hook references removed ✅

---

## Part B: Full AgentSkills.io Support (Next)

**Reference**: `/home/mobaxterm/Documents/git/a16n/planning/PHASE_8_SPEC.md` (lines 344-603)

### Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| B1 | Rename AgentSkill → SimpleAgentSkill | ⏳ Not Started |
| B2 | Define AgentSkillIO type | ⏳ Not Started |
| B3 | AgentSkillIO Discovery | ⏳ Not Started |
| B4 | AgentSkillIO Emission | ⏳ Not Started |

### Acceptance Criteria (Part B)

**AC-B1-1**: SimpleAgentSkill type exists, AgentSkill is deprecated alias
**AC-B2-1**: AgentSkillIO type supports hooks, resources, files
**AC-B3-1**: Discovery reads entire skill directories
**AC-B3-2**: Simple skills classified as SimpleAgentSkill/ManualPrompt
**AC-B3-3**: Complex skills classified as AgentSkillIO
**AC-B4-1**: Simple AgentSkillIO emits as Cursor rule (idiomatic)
**AC-B4-2**: Complex AgentSkillIO emits to `.cursor/skills/` with resources
**AC-B4-3**: Hooks copied verbatim with warning

---

## Next Action

When `/plan` or `/build` is invoked for Phase 8 Part B:
1. Read PHASE_8_SPEC.md Part B section
2. Start with B1 (type system refactor)
3. Follow TDD methodology
4. Create reflection documents upon completion
