# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

**Task ID:** PHASE-7-AGENTSKILLS
**Title:** AgentSkills Standard Alignment
**Complexity:** Level 4 (Major Feature / Multi-Package)
**Branch:** `phase-7`

## Objective

Align with the [AgentSkills open standard](https://agentskills.io) for portable AI agent skills, enabling bidirectional ManualPrompt support and reducing conversion loss through native skills emission.

## Scope Summary

1. **Type Rename:** `AgentCommand` → `ManualPrompt` (bidirectional support)
2. **Cursor Discovery:** Rules without activation criteria → ManualPrompt (not GlobalPrompt)
3. **Cursor Skills:** Discover and emit `.cursor/skills/*/SKILL.md`
4. **Claude ManualPrompt:** Discover/emit skills with `disable-model-invocation: true`

---

## Implementation Plan

### Phase A: Foundation (Models Package)

#### Task 1: Rename AgentCommand to ManualPrompt ✅
**Files:**
- `packages/models/src/types.ts`
- `packages/models/src/helpers.ts`
- `packages/models/src/index.ts`

**Changes:**
1. Rename enum value `AgentCommand` → `ManualPrompt` ('manual-prompt')
2. Rename interface `AgentCommand` → `ManualPrompt`
3. Rename field `commandName` → `promptName`
4. Rename type guard `isAgentCommand()` → `isManualPrompt()`
5. Add backward compatibility aliases (deprecated):
   - `AgentCommand` type alias
   - `AgentCommandType` const
   - `isAgentCommand()` wrapper

**Tests:**
- [ ] Type compiles correctly
- [ ] Type guard `isManualPrompt()` works
- [ ] Backward compat aliases work with deprecation

---

### Phase B: Cursor Plugin Updates

#### Task 2: Classification Change - No Criteria → ManualPrompt
**Files:**
- `packages/plugin-cursor/src/discover.ts`

**Changes:**
1. Modify `classifyRule()` function:
   - Priority 4 (fallback): Return `ManualPrompt` instead of `GlobalPrompt`
   - Add `promptName` derived from filename

**Before:**
```typescript
// Priority 4: Fallback → GlobalPrompt
return {
  type: CustomizationType.GlobalPrompt,
  ...
};
```

**After:**
```typescript
// Priority 4: No activation criteria → ManualPrompt
const promptName = path.basename(sourcePath, path.extname(sourcePath));
return {
  type: CustomizationType.ManualPrompt,
  promptName,
  ...
};
```

**Tests:**
- [ ] Rule with `alwaysApply: false` and no other criteria → ManualPrompt
- [ ] Rule with no frontmatter → ManualPrompt
- [ ] Rule with only empty `globs:` → ManualPrompt (via description fallback)
- [ ] Existing classifications unchanged (alwaysApply, globs, description)

---

#### Task 3: Cursor Skills Discovery
**Files:**
- `packages/plugin-cursor/src/discover.ts`

**New Function:** `discoverSkills(root: string)`

**Logic:**
1. Look for `.cursor/skills/*/SKILL.md` files
2. Parse frontmatter: `name`, `description`, `disable-model-invocation`
3. Classify:
   - `disable-model-invocation: true` → ManualPrompt
   - `description` present → AgentSkill
   - Neither → skip with warning

**SKILL.md Frontmatter Parsing:**
```typescript
interface SkillFrontmatter {
  name?: string;
  description?: string;
  disableModelInvocation?: boolean;
}
```

**Tests:**
- [ ] Skill with description → AgentSkill
- [ ] Skill with `disable-model-invocation: true` → ManualPrompt
- [ ] Skill without description or flag → skipped
- [ ] Missing `.cursor/skills/` directory → no error
- [ ] Skill with `name` frontmatter uses that for skillName

---

#### Task 4: Cursor Skills Emission
**Files:**
- `packages/plugin-cursor/src/emit.ts`

**Changes:**
1. **AgentSkill emission**: Emit to `.cursor/skills/<name>/SKILL.md` (not `.cursor/rules/`)
2. **ManualPrompt emission**: Emit to `.cursor/skills/<name>/SKILL.md` with `disable-model-invocation: true`
3. Stop emitting AgentSkill/ManualPrompt to `.cursor/rules/`

**Emission Format:**
```markdown
---
name: "<skill-name>"
description: "<description or 'Invoke with /<name>'>"
disable-model-invocation: true  # Only for ManualPrompt
---

<content>
```

**Tests:**
- [ ] AgentSkill emits to `.cursor/skills/<name>/SKILL.md`
- [ ] ManualPrompt emits with `disable-model-invocation: true`
- [ ] No files created in `.cursor/rules/` for these types
- [ ] Skill name sanitization works correctly
- [ ] Collision handling with counter suffix

---

### Phase C: Claude Plugin Updates

#### Task 5: Claude ManualPrompt Discovery
**Files:**
- `packages/plugin-claude/src/discover.ts`

**Changes:**
1. Modify skill parsing to detect `disable-model-invocation: true`
2. Skills with flag → ManualPrompt (not AgentSkill)
3. Update `parseSkillFrontmatter()` to include `disableModelInvocation`

**Test Cases:**
- [ ] Skill with `disable-model-invocation: true` → ManualPrompt
- [ ] Regular skill with description → AgentSkill (unchanged)
- [ ] Skill with hooks → still skipped
- [ ] ManualPrompt gets correct `promptName`

---

#### Task 6: Claude ManualPrompt Emission
**Files:**
- `packages/plugin-claude/src/emit.ts`

**Changes:**
1. Update `formatCommandAsSkill()` → `formatManualPromptAsSkill()`
2. Add `disable-model-invocation: true` to frontmatter
3. Use `isManualPrompt()` instead of `isAgentCommand()`

**Output Format:**
```markdown
---
name: "<prompt-name>"
description: "Invoke with /<prompt-name>"
disable-model-invocation: true
---

<content>
```

**Tests:**
- [ ] ManualPrompt emits with `disable-model-invocation: true`
- [ ] Skill directory structure is correct
- [ ] Description includes invocation hint

---

### Phase D: Cross-Package Updates

#### Task 7: Update All References
**Files:**
- `packages/cli/src/index.ts`
- `packages/cli/src/output.ts`
- `packages/engine/src/index.ts`
- All test files

**Changes:**
- Replace `AgentCommand` → `ManualPrompt`
- Replace `isAgentCommand` → `isManualPrompt`
- Replace `commandName` → `promptName`
- Replace `CustomizationType.AgentCommand` → `CustomizationType.ManualPrompt`

---

### Phase E: Test Infrastructure

#### Task 8: Test Fixtures
**Create:**

```
packages/plugin-cursor/test/fixtures/
  cursor-skills/
    from-cursor/
      .cursor/
        skills/
          deploy/
            SKILL.md          # AgentSkill (has description)
          reset-db/
            SKILL.md          # ManualPrompt (disable-model-invocation: true)

  cursor-rule-no-criteria/
    from-cursor/
      .cursor/
        rules/
          helper.mdc          # alwaysApply: false, no other criteria

packages/plugin-claude/test/fixtures/
  claude-skills-manual/
    from-claude/
      .claude/
        skills/
          manual-task/
            SKILL.md          # disable-model-invocation: true
```

---

#### Task 9: Integration Tests
**Files:**
- `packages/cli/test/integration/integration.test.ts`

**Scenarios:**
1. Cursor skill → Claude skill → Cursor skill (round-trip)
2. Cursor rule (no criteria) → ManualPrompt → Claude skill (with flag)
3. Cursor command → ManualPrompt → Claude skill (with flag)
4. Claude skill (with flag) → ManualPrompt → Cursor skill (with flag)

**Fixture directories:**
```
packages/cli/test/integration/fixtures/
  cursor-skill-roundtrip/
    from-cursor/
    to-claude/
    back-to-cursor/
  
  cursor-manual-to-claude/
    from-cursor/
    to-claude/
```

---

### Phase F: Documentation

#### Task 10: Documentation Update
**Files:**
- `README.md`
- `packages/cli/README.md`
- `packages/models/README.md`

**Updates:**
- Document AgentSkills standard support
- Document ManualPrompt type
- Document `disable-model-invocation` flag
- Add migration guide for existing users

---

## Task Dependencies

```
Task 1 (Models)
    ├── Task 2 (Cursor Classification)
    ├── Task 3 (Cursor Skills Discovery) ────┬── Task 4 (Cursor Skills Emission)
    ├── Task 5 (Claude ManualPrompt Discovery) ── Task 6 (Claude ManualPrompt Emission)
    └── Task 7 (Update References)
                    │
Task 8 (Fixtures) ──┴── Task 9 (Integration Tests)
                              │
                        Task 10 (Documentation)
```

**Parallel work after Task 1:**
- Tasks 2, 3, 5, 7 can proceed in parallel
- Tasks 4, 6 depend on their respective discovery tasks
- Task 9 requires all implementation tasks

---

## Acceptance Criteria Checklist

- [ ] **AC1:** ManualPrompt type exported, `isManualPrompt()` type guard exists
- [ ] **AC2:** Cursor rules without activation criteria → ManualPrompt
- [ ] **AC3:** Cursor skills with description → AgentSkill
- [ ] **AC4:** Cursor skills with `disable-model-invocation` → ManualPrompt
- [ ] **AC5:** AgentSkill emits to `.cursor/skills/` (not `.cursor/rules/`)
- [ ] **AC6:** ManualPrompt emits to `.cursor/skills/` with flag
- [ ] **AC7:** Claude discovers ManualPrompt from skills with flag
- [ ] **AC8:** Claude emits ManualPrompt with `disable-model-invocation`
- [ ] **AC9:** Round-trip Cursor → Claude → Cursor preserves skills
- [ ] **AC10:** Cursor commands still work (→ ManualPrompt)

---

## Definition of Done

- [ ] All 10 acceptance criteria pass
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes (all packages)
- [ ] `pnpm lint` passes
- [ ] `AgentCommand` renamed to `ManualPrompt`
- [ ] Cursor rules without activation criteria → ManualPrompt
- [ ] Cursor skills discovery from `.cursor/skills/`
- [ ] Cursor skills emission to `.cursor/skills/`
- [ ] Claude discovers ManualPrompt from skills with `disable-model-invocation`
- [ ] Claude emits ManualPrompt with `disable-model-invocation`
- [ ] Round-trip Cursor → Claude → Cursor preserves skills
- [ ] No TODO comments in shipped code
- [ ] Changeset created for version bump

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking change for existing users | Provide deprecation aliases; document migration |
| Cursor skills directory variations | Follow AgentSkills spec strictly |
| Frontmatter parsing edge cases | Robust YAML parsing; skip invalid files with warning |
| Classification behavior change | Document in migration guide |

---

## QA Validation Status

**Date:** 2026-01-28
**Status:** ✅ PASS

### Validation Results
- ✅ Dependency Verification: All dependencies installed
- ✅ Configuration Validation: All configs valid
- ✅ Environment Validation: Node v22.15.0, pnpm 9.0.0
- ✅ Minimal Build Test: Build passes, all 100 tests pass

**Ready for BUILD mode.**

---

## Current Progress

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Rename Type | ⬜ Pending | |
| Task 2: Classification Change | ⬜ Pending | |
| Task 3: Cursor Skills Discovery | ⬜ Pending | |
| Task 4: Cursor Skills Emission | ⬜ Pending | |
| Task 5: Claude Discovery | ⬜ Pending | |
| Task 6: Claude Emission | ⬜ Pending | |
| Task 7: Update References | ⬜ Pending | |
| Task 8: Test Fixtures | ⬜ Pending | |
| Task 9: Integration Tests | ⬜ Pending | |
| Task 10: Documentation | ⬜ Pending | |
