# Memory Bank: Tasks

## Phase 8 Status

**Part A (Claude Native Rules Support)**: ✅ COMPLETE
**Part B (Full AgentSkills.io Support)**: ⏳ IN PROGRESS (Planning)

---

## Part A Summary (Complete)

All four milestones successfully implemented on 2026-01-31 and 2026-02-01.

| Milestone | Description | Status | Reflection |
|-----------|-------------|--------|------------|
| A1 | Claude Rules Discovery | ✅ Complete | `reflection-phase8-milestone-a1.md` |
| A2 | Claude Rules Emission | ✅ Complete | `reflection-phase8-milestone-a2-a3.md` |
| A3 | Remove glob-hook | ✅ Complete | `reflection-phase8-milestone-a2-a3.md` |
| A4 | Documentation Cleanup | ✅ Complete | `reflection-phase8-milestone-a4.md` |

---

## Part B: Full AgentSkills.io Support

**Reference**: `/home/mobaxterm/Documents/git/a16n/planning/PHASE_8_SPEC.md` (lines 344-603)

### Milestones Remaining

| Milestone | Description | Spec Section | Status |
|-----------|-------------|--------------|--------|
| 4 | Type System Updates (B1 + B2) | Lines 355-429 | ✅ Complete |
| 5 | AgentSkillIO Discovery (B3) | Lines 457-525 | ✅ Complete |
| 6 | AgentSkillIO Emission (B4) | Lines 527-588 | ⏳ Not Started |
| 7 | Integration Testing & Polish | Lines 771-785 | ⏳ Not Started |

### Dependencies

```
Milestone 4 (Type System) → Milestone 5 (Discovery) → Milestone 6 (Emission) → Milestone 7 (Integration)
```

---

## Milestone 4: Type System Updates (B1 + B2)

**Objective**: Rename `AgentSkill` → `SimpleAgentSkill` and define new `AgentSkillIO` type for full AgentSkills.io support.

### B1: Rename AgentSkill → SimpleAgentSkill

#### Files to Modify

| File | Changes |
|------|---------|
| `packages/models/src/types.ts` | Rename enum value, rename interface, add deprecated alias |
| `packages/models/src/helpers.ts` | Rename type guard `isAgentSkill` → `isSimpleAgentSkill`, add alias |
| `packages/models/src/index.ts` | Update exports |
| `packages/models/test/types.test.ts` | Update tests to use new name |
| `packages/models/test/helpers.test.ts` | Update tests to use new name |
| `packages/plugin-cursor/src/discover.ts` | Update import and usage |
| `packages/plugin-cursor/src/emit.ts` | Update import and usage |
| `packages/plugin-cursor/src/index.ts` | Update re-exports if any |
| `packages/plugin-cursor/test/discover.test.ts` | Update assertions |
| `packages/plugin-cursor/test/emit.test.ts` | Update assertions |
| `packages/plugin-claude/src/discover.ts` | Update import and usage |
| `packages/plugin-claude/src/emit.ts` | Update import and usage |
| `packages/plugin-claude/src/index.ts` | Update re-exports if any |
| `packages/plugin-claude/test/discover.test.ts` | Update assertions |
| `packages/plugin-claude/test/emit.test.ts` | Update assertions |
| `packages/engine/test/engine.test.ts` | Update if using AgentSkill |
| `packages/cli/test/*.test.ts` | Update if using AgentSkill |

#### Type Changes in `packages/models/src/types.ts`

```typescript
// Rename enum value
export enum CustomizationType {
  GlobalPrompt = 'global-prompt',
  SimpleAgentSkill = 'simple-agent-skill',  // Renamed from AgentSkill
  AgentSkillIO = 'agent-skill-io',          // NEW
  FileRule = 'file-rule',
  AgentIgnore = 'agent-ignore',
  ManualPrompt = 'manual-prompt',
}

// Rename interface
export interface SimpleAgentSkill extends AgentCustomization {
  type: CustomizationType.SimpleAgentSkill;
  description: string;
}

// Backward compatibility alias (deprecated)
/** @deprecated Use SimpleAgentSkill instead */
export type AgentSkill = SimpleAgentSkill;
```

#### Helper Changes in `packages/models/src/helpers.ts`

```typescript
// Rename primary type guard
export function isSimpleAgentSkill(item: AgentCustomization): item is SimpleAgentSkill {
  return item.type === CustomizationType.SimpleAgentSkill;
}

// Backward compatibility alias (deprecated)
/** @deprecated Use isSimpleAgentSkill instead */
export const isAgentSkill = isSimpleAgentSkill;
```

### B2: Define AgentSkillIO Type

#### New Type in `packages/models/src/types.ts`

```typescript
/**
 * Full AgentSkills.io standard skill.
 * Supports multiple files, hooks, resources, and complex activation.
 */
export interface AgentSkillIO extends AgentCustomization {
  type: CustomizationType.AgentSkillIO;
  
  /** Skill name (from frontmatter or directory name) */
  name: string;
  
  /** Description for activation matching (required) */
  description: string;
  
  /** Optional: Hooks defined in frontmatter */
  hooks?: Record<string, unknown>;
  
  /** Optional: Resource file paths relative to skill directory */
  resources?: string[];
  
  /** Optional: If true, only invoked via /name */
  disableModelInvocation?: boolean;
  
  /** 
   * Map of additional files in the skill directory.
   * Key: relative path, Value: file content
   */
  files: Record<string, string>;
}
```

#### New Helper in `packages/models/src/helpers.ts`

```typescript
/**
 * Type guard to check if an item is an AgentSkillIO (full AgentSkills.io skill).
 */
export function isAgentSkillIO(item: AgentCustomization): item is AgentSkillIO {
  return item.type === CustomizationType.AgentSkillIO;
}
```

### Test Plan for Milestone 4

#### Unit Tests to Add/Modify

1. **`packages/models/test/types.test.ts`**:
   - Test `CustomizationType.SimpleAgentSkill` exists
   - Test `CustomizationType.AgentSkillIO` exists
   - Test deprecated `AgentSkill` alias works

2. **`packages/models/test/helpers.test.ts`**:
   - Test `isSimpleAgentSkill()` type guard
   - Test `isAgentSkillIO()` type guard
   - Test deprecated `isAgentSkill` alias works

### Acceptance Criteria

**AC-B1-1**: `SimpleAgentSkill` type exists with `type: CustomizationType.SimpleAgentSkill`
**AC-B1-2**: `AgentSkill` deprecated alias exists and works
**AC-B2-1**: `AgentSkillIO` type supports `hooks`, `resources`, `files` fields
**AC-B2-2**: `isAgentSkillIO()` type guard correctly identifies AgentSkillIO

### Verification

```bash
pnpm build
pnpm test
```

---

## Milestone 5: AgentSkillIO Discovery (B3)

**Objective**: Update discovery to read entire skill directories with all resources.

### Current Discovery Behavior

**Cursor** (`packages/plugin-cursor/src/discover.ts`):
- `findSkillFiles()` finds `.cursor/skills/*/SKILL.md`
- `discoverSkills()` reads SKILL.md content only
- Classifies as `AgentSkill` or `ManualPrompt`
- Ignores additional files in skill directory

**Claude** (`packages/plugin-claude/src/discover.ts`):
- `findSkillFiles()` finds `.claude/skills/*/SKILL.md`
- Reads SKILL.md content only
- Classifies as `AgentSkill` or `ManualPrompt`
- Skips skills with `hooks:` frontmatter (with warning)
- Ignores additional files in skill directory

### Target Discovery Behavior

1. Read all files in skill directory (not just SKILL.md)
2. Parse extended frontmatter (hooks, resources references)
3. Store additional files in `AgentSkillIO.files` map
4. Classify based on complexity:
   - Simple (only SKILL.md, no hooks, no extra files) → `SimpleAgentSkill` or `ManualPrompt`
   - Complex (hooks, resources, extra files) → `AgentSkillIO`

### Files to Modify

| File | Changes |
|------|---------|
| `packages/plugin-cursor/src/discover.ts` | Update `discoverSkills()` to read full directories |
| `packages/plugin-claude/src/discover.ts` | Update skill discovery to read full directories |
| `packages/plugin-cursor/test/discover.test.ts` | Add tests for complex skill discovery |
| `packages/plugin-claude/test/discover.test.ts` | Add tests for complex skill discovery |

### Test Fixtures to Create

#### Cursor Complex Skill Fixture

```
packages/plugin-cursor/test/fixtures/cursor-skills-complex/
└── from-cursor/
    └── .cursor/
        └── skills/
            └── deploy/
                ├── SKILL.md          # Has description
                ├── checklist.md      # Resource file
                └── config.json       # Config file
```

#### Claude Complex Skill Fixture

```
packages/plugin-claude/test/fixtures/claude-skills-complex/
└── from-claude/
    └── .claude/
        └── skills/
            └── secure-deploy/
                ├── SKILL.md          # Has hooks + description
                ├── pre-check.sh      # Resource file
                └── manifest.json     # Manifest file
```

### Implementation Details

#### Updated `discoverSkills()` for Cursor

```typescript
async function discoverSkills(root: string): Promise<{
  items: AgentCustomization[];
  warnings: Warning[];
}> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];
  
  const skillDirs = await findSkillDirs(root);
  
  for (const skillDir of skillDirs) {
    const skillPath = path.join(skillDir, 'SKILL.md');
    
    try {
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      const { frontmatter, body } = parseSkillFrontmatter(skillContent);
      
      // Read all other files in directory
      const files: Record<string, string> = {};
      const entries = await fs.readdir(skillDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name !== 'SKILL.md') {
          const filePath = path.join(skillDir, entry.name);
          files[entry.name] = await fs.readFile(filePath, 'utf-8');
        }
      }
      
      // Classify based on complexity
      const hasHooks = !!frontmatter.hooks;
      const hasResources = Object.keys(files).length > 0;
      const hasExtraFrontmatter = hasHooks || frontmatter.resources;
      
      if (!hasHooks && !hasResources && !hasExtraFrontmatter) {
        // Simple skill - use existing classification
        if (frontmatter.disableModelInvocation === true) {
          items.push({ type: CustomizationType.ManualPrompt, ... });
        } else if (frontmatter.description) {
          items.push({ type: CustomizationType.SimpleAgentSkill, ... });
        }
      } else {
        // Complex skill - AgentSkillIO
        items.push({
          type: CustomizationType.AgentSkillIO,
          name: frontmatter.name || path.basename(skillDir),
          description: frontmatter.description || '',
          hooks: frontmatter.hooks,
          disableModelInvocation: frontmatter.disableModelInvocation,
          resources: Object.keys(files),
          files,
          content: body,
          // ...
        });
      }
    } catch (error) {
      warnings.push({ code: WarningCode.Skipped, ... });
    }
  }
  
  return { items, warnings };
}
```

### Test Plan for Milestone 5

#### Unit Tests to Add

1. **`packages/plugin-cursor/test/discover.test.ts`**:
   - Test simple skill → `SimpleAgentSkill`
   - Test simple skill with disable → `ManualPrompt`
   - Test skill with extra files → `AgentSkillIO`
   - Test `files` map contains all resource content

2. **`packages/plugin-claude/test/discover.test.ts`**:
   - Test simple skill → `SimpleAgentSkill`
   - Test skill with hooks → `AgentSkillIO`
   - Test skill with resources → `AgentSkillIO`
   - Test `files` map contains all resource content

### Acceptance Criteria

**AC-B3-1**: Discovery reads entire skill directories (all files)
**AC-B3-2**: Simple skills classified as `SimpleAgentSkill` or `ManualPrompt`
**AC-B3-3**: Complex skills (hooks, resources) classified as `AgentSkillIO`
**AC-B3-4**: `AgentSkillIO.files` contains content of all extra files

### Verification

```bash
pnpm --filter @a16njs/plugin-cursor test
pnpm --filter @a16njs/plugin-claude test
```

---

## Milestone 6: AgentSkillIO Emission (B4)

**Objective**: Smart routing based on skill complexity.

### Emission Decision Tree

```
Input: AgentSkillIO
│
├── Is effectively simple? (no hooks, no resources, no extra files)
│   │
│   ├── Has disable-model-invocation: true?
│   │   └── Emit as ManualPrompt → .cursor/skills/<name>/SKILL.md
│   │
│   └── Has description only?
│       └── Emit as Cursor Rule → .cursor/rules/<name>.mdc with description:
│
└── Has complex features (hooks, resources, files)?
    └── Emit as full AgentSkillIO → .cursor/skills/<name>/ directory
        ├── SKILL.md (with full frontmatter)
        └── all resource files (copied from files map)
```

### Files to Modify

| File | Changes |
|------|---------|
| `packages/plugin-cursor/src/emit.ts` | Add `emitAgentSkillIO()` function |
| `packages/plugin-claude/src/emit.ts` | Add `emitAgentSkillIO()` function |
| `packages/plugin-cursor/test/emit.test.ts` | Add emission tests |
| `packages/plugin-claude/test/emit.test.ts` | Add emission tests |

### Test Fixtures to Create

#### Cursor AgentSkillIO Emission Expected Output

```
packages/cli/test/integration/fixtures/agentskill-complex/
├── from-claude/
│   └── .claude/
│       └── skills/
│           └── deploy/
│               ├── SKILL.md
│               ├── checklist.md
│               └── config.json
└── to-cursor/
    └── .cursor/
        └── skills/
            └── deploy/
                ├── SKILL.md
                ├── checklist.md
                └── config.json
```

### Implementation Details

#### Cursor Emission

```typescript
function emitAgentSkillIO(skill: AgentSkillIO, root: string, dryRun: boolean): Promise<WrittenFile[]> {
  const written: WrittenFile[] = [];
  
  // Check if effectively simple
  const isSimple = !skill.hooks && 
                   (!skill.resources || skill.resources.length === 0) &&
                   Object.keys(skill.files).length === 0;
  
  if (isSimple) {
    if (skill.disableModelInvocation) {
      // Emit as ManualPrompt skill
      return emitAsManualPromptSkill(skill, root, dryRun);
    } else {
      // Emit as Cursor rule with description
      return emitAsCursorRule(skill, root, dryRun);
    }
  }
  
  // Full AgentSkillIO emission with all files
  const skillDir = path.join(root, '.cursor', 'skills', skill.name);
  if (!dryRun) {
    await fs.mkdir(skillDir, { recursive: true });
  }
  
  // Write SKILL.md with frontmatter
  const skillContent = formatFullSkillMd(skill);
  const skillPath = path.join(skillDir, 'SKILL.md');
  if (!dryRun) {
    await fs.writeFile(skillPath, skillContent, 'utf-8');
  }
  written.push({ path: skillPath, type: CustomizationType.AgentSkillIO, ... });
  
  // Copy all resource files
  for (const [filename, content] of Object.entries(skill.files)) {
    const filePath = path.join(skillDir, filename);
    if (!dryRun) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
    written.push({ path: filePath, type: CustomizationType.AgentSkillIO, ... });
  }
  
  return written;
}
```

### Test Plan for Milestone 6

#### Unit Tests to Add

1. **`packages/plugin-cursor/test/emit.test.ts`**:
   - Test simple AgentSkillIO → emits as Cursor rule
   - Test AgentSkillIO with disable → emits as ManualPrompt skill
   - Test complex AgentSkillIO → emits full directory with all files

2. **`packages/plugin-claude/test/emit.test.ts`**:
   - Test simple AgentSkillIO → emits as Claude skill
   - Test complex AgentSkillIO → emits with hooks preserved
   - Test resources copied to output

### Acceptance Criteria

**AC-B4-1**: Simple AgentSkillIO emits idiomatically (rule for Cursor, skill for Claude)
**AC-B4-2**: Complex AgentSkillIO emits full directory with all resources
**AC-B4-3**: Hooks in AgentSkillIO → copied verbatim with warning (if target doesn't support)

### Verification

```bash
pnpm --filter @a16njs/plugin-cursor test
pnpm --filter @a16njs/plugin-claude test
```

---

## Milestone 7: Integration Testing & Polish

**Objective**: End-to-end verification and final cleanup.

### Tasks

#### 1. Round-Trip Integration Tests

Create fixtures for:
- Claude → Cursor → Claude (complex skill)
- Cursor → Claude → Cursor (complex skill)
- Verify resources preserved through conversions

#### 2. CLI Tests

- Update CLI tests if needed for new types
- Verify `a16n convert` works with complex skills

#### 3. Final Verification

```bash
pnpm format
pnpm lint -- --fix
pnpm build
pnpm test
```

#### 4. Documentation Updates

- Update plugin READMEs if needed
- Document AgentSkillIO support
- Add examples of complex skill conversion

#### 5. Changeset

Create changeset for version bump:
- `packages/models` - minor (new type)
- `packages/plugin-cursor` - minor (new feature)
- `packages/plugin-claude` - minor (new feature)
- `a16n` (CLI) - minor (supports new features)

### Integration Test Fixtures to Create

```
packages/cli/test/integration/fixtures/
├── cursor-to-claude-complex-skill/
│   ├── from-cursor/
│   │   └── .cursor/skills/deploy/
│   │       ├── SKILL.md
│   │       ├── checklist.md
│   │       └── script.sh
│   └── to-claude/
│       └── .claude/skills/deploy/
│           ├── SKILL.md
│           ├── checklist.md
│           └── script.sh
└── claude-to-cursor-complex-skill/
    ├── from-claude/
    │   └── .claude/skills/deploy/
    │       ├── SKILL.md
    │       ├── checklist.md
    │       └── script.sh
    └── to-cursor/
        └── .cursor/skills/deploy/
            ├── SKILL.md
            ├── checklist.md
            └── script.sh
```

### Acceptance Criteria

**AC-7-1**: Round-trip tests pass (Claude → Cursor → Claude)
**AC-7-2**: Round-trip tests pass (Cursor → Claude → Cursor)
**AC-7-3**: All 400+ tests pass
**AC-7-4**: No lint errors
**AC-7-5**: Build succeeds

### Verification

```bash
pnpm format && pnpm lint -- --fix && pnpm build && pnpm test
```

---

## Summary: Task Checklist

### Milestone 4: Type System Updates ✅ COMPLETE

- [x] **4.1** Add `CustomizationType.SimpleAgentSkill` enum value
- [x] **4.2** Rename `AgentSkill` interface → `SimpleAgentSkill`
- [x] **4.3** Add deprecated `AgentSkill` type alias
- [x] **4.4** Add `CustomizationType.AgentSkillIO` enum value
- [x] **4.5** Define `AgentSkillIO` interface
- [x] **4.6** Add `isSimpleAgentSkill()` type guard
- [x] **4.7** Add `isAgentSkillIO()` type guard
- [x] **4.8** Add deprecated `isAgentSkill` alias
- [x] **4.9** Update `packages/models/src/index.ts` exports
- [x] **4.10** Update all imports in plugin-cursor
- [x] **4.11** Update all imports in plugin-claude
- [x] **4.12** Update models tests
- [x] **4.13** Run `pnpm build && pnpm test`

### Milestone 5: AgentSkillIO Discovery ✅ COMPLETE

- [x] **5.1** Create `cursor-skills-complex` test fixture
- [x] **5.2** Create `claude-skills-complex` test fixture
- [x] **5.3** Stub discovery tests (expect failures)
- [x] **5.4** Update Cursor `discoverSkills()` to read full directories
- [x] **5.5** Update Claude skill discovery to read full directories
- [x] **5.6** Implement classification logic (simple vs complex)
- [x] **5.7** Run `pnpm --filter @a16njs/plugin-cursor test`
- [x] **5.8** Run `pnpm --filter @a16njs/plugin-claude test`

### Milestone 6: AgentSkillIO Emission

- [ ] **6.1** Stub emission tests (expect failures)
- [ ] **6.2** Implement `emitAgentSkillIO()` for Cursor plugin
- [ ] **6.3** Implement `emitAgentSkillIO()` for Claude plugin
- [ ] **6.4** Add warning for hooks when emitting to Cursor
- [ ] **6.5** Run `pnpm --filter @a16njs/plugin-cursor test`
- [ ] **6.6** Run `pnpm --filter @a16njs/plugin-claude test`

### Milestone 7: Integration & Polish

- [ ] **7.1** Create round-trip test fixtures
- [ ] **7.2** Add integration tests for complex skills
- [ ] **7.3** Verify CLI works with complex skills
- [ ] **7.4** Run full test suite
- [ ] **7.5** Create changeset
- [ ] **7.6** Final verification: `pnpm format && pnpm lint -- --fix && pnpm build && pnpm test`

---

## Definition of Done

Phase 8 is complete when:

- [ ] All acceptance criteria pass (AC-B1 through AC-B4, AC-7)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes (all packages)
- [ ] `pnpm lint` passes
- [ ] `AgentSkill` renamed to `SimpleAgentSkill` with backward compat
- [ ] `AgentSkillIO` type defined and implemented
- [ ] Full skill directories discovered with resources
- [ ] Smart emission routing based on skill complexity
- [ ] Round-trip tests pass for all scenarios
- [ ] Changeset created for version bump
- [ ] No TODO comments in shipped code
