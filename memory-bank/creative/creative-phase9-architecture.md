# Phase 9: Architectural Research & Decisions

**Date:** 2026-02-03  
**Phase:** Phase 9 - IR Serialization Plugin  
**Status:** Decisions finalized, ready for implementation

---

## Research Questions Investigated

### Q1: Do we need `promptName` in ManualPrompt frontmatter?

**Answer: NO** ✅

**Research Findings:**
- Current `ManualPrompt` type has `promptName` field (e.g., `"review"` for `/review` command)
- Cursor extracts from `.cursor/commands/review.md` or directory name
- For a16n IR format, filename already serves as unique identifier

**Decision:**
- **Derive `promptName` from filename** (remove from frontmatter)
- Storage: `.a16n/ManualPrompt/code-review.md`
- Reading: `promptName = path.basename(file, '.md')` → `"code-review"`
- **No redundancy** with `name` field
- **Simpler IR format**

---

### Q2: How do we preserve directory structure across conversions?

**Answer: Add `relativeDir` field to base IR** ✅

**Problem Discovered:**
Current implementation loses directory structure:
```typescript
// Discovery captures full path correctly
sourcePath: ".cursor/rules/foo/bar.mdc" ✓

// BUT emission extracts only basename
sanitizeFilename(gp.sourcePath) → "bar"
→ outputs to: .claude/rules/bar.md  ✗

// Lost: "foo/" subdirectory!
```

**Evidence from codebase:**
- `packages/plugin-claude/test/fixtures/claude-rules-nested/` has subdirectories
- Tests verify: `sourcePath === '.claude/rules/frontend/react.md'` (full path preserved in discovery)
- But emit code only uses basename, losing structure

**Solution: Add `relativeDir` field**

Normalize path relative to canonical directory:

| Source Path | relativeDir | Emit to Claude |
|-------------|-------------|----------------|
| `.cursor/rules/foo.mdc` | `""` or undefined | `.claude/rules/foo.md` |
| `.cursor/rules/foo/bar.mdc` | `"foo"` | `.claude/rules/foo/bar.md` |
| `.cursor/rules/foo/baz/qux.mdc` | `"foo/baz"` | `.claude/rules/foo/baz/qux.md` |

**Implementation:**

```typescript
// Add to AgentCustomization base interface
export interface AgentCustomization {
  // ... existing fields
  relativeDir?: string;  // "foo/bar" or "" for root
}
```

**Discovery extracts:**
```typescript
const sourcePath = `.cursor/rules/foo/bar.mdc`;
const relativeDir = path.dirname(
  sourcePath.replace('.cursor/rules/', '')
);
// → relativeDir = "foo"
```

**Emission honors:**
```typescript
const outputDir = item.relativeDir 
  ? path.join(rulesDir, item.relativeDir)
  : rulesDir;
await fs.mkdir(outputDir, { recursive: true });
const filepath = path.join(outputDir, sanitizeFilename(item.sourcePath));
// → .claude/rules/foo/bar.md
```

**Graceful degradation:**
- Plugins that don't support subdirectories ignore `relativeDir`
- Falls back to flattening all files to root
- No breaking changes for existing plugins

---

### Q3: Where should AgentSkillsIO parsing utilities live?

**Answer: Dedicated module in `@a16njs/models`** ✅

**This IS the 3rd plugin needing it:**
1. `packages/plugin-cursor/src/discover.ts` (lines 245-316)
2. `packages/plugin-claude/src/discover.ts` (similar code)
3. `packages/plugin-a16n/src/discover.ts` (Phase 9, will need it)

**Options evaluated:**

| Location | Pros | Cons | Verdict |
|----------|------|------|---------|
| **@a16njs/models** | ✅ Precedent (helpers.ts exists)<br>✅ Co-located with types<br>✅ Already imported by all plugins<br>✅ No circular deps | None significant | **✅ CHOSEN** |
| Engine | Central orchestration | ❌ Should only orchestrate, not parse | ❌ Wrong layer |
| New package | Clean separation | ❌ Overkill for parsing utilities | ❌ Over-engineering |

**Rationale for `@a16njs/models`:**

1. **Precedent exists:** `helpers.ts` already has utilities:
   - `getUniqueFilename()` - File naming logic
   - `createId()` - ID generation
   - Type guards (`isGlobalPrompt()`, etc.)

2. **Co-location:** Parsing logic lives with skill type definitions

3. **Already imported:** All plugins import `@a16njs/models`

4. **No circular deps:** Engine imports models, not vice versa

5. **Right abstraction:** Models = types + type-related utilities

**Proposed location:**
```
packages/models/src/agentskills-io.ts  (NEW FILE)
```

**API Design:**

```typescript
/**
 * Frontmatter structure for AgentSkills.io SKILL.md files.
 */
export interface ParsedSkillFrontmatter {
  /** Skill name (optional, defaults to directory name) */
  name?: string;
  /** Description for activation matching (required) */
  description?: string;
  /** If true, only invoked via /name command */
  disableModelInvocation?: boolean;
  /** Hooks configuration (Claude-specific, emit warning) */
  hooks?: Record<string, unknown>;
}

export interface ParsedSkill {
  frontmatter: ParsedSkillFrontmatter;
  body: string;
}

/**
 * Parse YAML-like frontmatter from an AgentSkills.io SKILL.md file.
 * Follows AgentSkills.io standard format.
 */
export function parseSkillFrontmatter(content: string): ParsedSkill;

/**
 * Read all files in a skill directory (excluding SKILL.md).
 * Returns a map of filename → content.
 */
export async function readSkillFiles(skillDir: string): Promise<Record<string, string>>;
```

**Migration:**
1. ✅ Extract parsing from `plugin-cursor`
2. ✅ Extract parsing from `plugin-claude`
3. ✅ Use shared implementation in `plugin-a16n`
4. Reduces ~150 lines of duplicated code per plugin

---

## Final Architectural Decisions

### D1: Plugin Naming
- **Package:** `@a16njs/plugin-a16n`
- **Plugin ID:** `'a16n'`
- **CLI Usage:** `--from a16n`, `--to a16n`
- **Rationale:** Cleaner user experience, matches tool name

### D2: Directory Structure Preservation
- **Field:** `relativeDir?: string` on `AgentCustomization`
- **Purpose:** Preserve subdirectory structure across conversions
- **Example:** `foo/bar.mdc` → `relativeDir: "foo"` → `foo/bar.md`
- **Benefit:** Maintains organization, no data loss

### D3: ManualPrompt Naming
- **Remove:** `promptName` from IR frontmatter
- **Derive:** From filename (`code-review.md` → `"code-review"`)
- **Benefit:** Eliminates redundancy, simpler format

### D4: AgentSkillsIO Parsing
- **Location:** `packages/models/src/agentskills-io.ts`
- **Exports:** `parseSkillFrontmatter()`, `readSkillFiles()`, interfaces
- **Rationale:** 3rd plugin needs it, reduce duplication

### D5: Version Compatibility
- **Rule:** Same major + stability = compatible
- **Examples:**
  - `v1beta1` ↔ `v1beta2` = ✅ Compatible
  - `v1beta1` ↔ `v1` = ❌ Incompatible (stability change)
  - `v1` ↔ `v2` = ❌ Incompatible (major change)

### D6: Source Path Retention
- **Keep:** `sourcePath` field in IR
- **Purpose:** Debugging, provenance tracking, tooling support

---

## Impact Summary

### Models Package Changes
- Add `relativeDir` field to `AgentCustomization`
- Create `agentskills-io.ts` module with parsing utilities
- Add `IRVersion` type and version utilities
- **Effort:** +2 hours (now 5 hours total for M1)

### Plugin Implementation
- Honor `relativeDir` in discovery (extract from path)
- Honor `relativeDir` in emission (create subdirectories)
- Use shared AgentSkillsIO utilities
- Derive `promptName` from filename for ManualPrompt

### Testing
- Test `relativeDir` preservation in round-trips
- Test AgentSkillsIO parsing utilities
- Test version compatibility logic
- **Effort:** +1 hour (now 4 hours for M7)

### Total Effort Impact
- **Original:** 21 hours
- **Updated:** 24 hours
- **Increase:** +3 hours (well-justified by quality improvements)

---

## Implementation Notes

### relativeDir Extraction Pattern
```typescript
// In discovery
function extractRelativeDir(sourcePath: string, baseDir: string): string {
  const fullDir = path.dirname(sourcePath);
  const relativeDir = fullDir.replace(baseDir + '/', '');
  return relativeDir === baseDir ? '' : relativeDir;
}
```

### relativeDir Emission Pattern
```typescript
// In emission
const baseDir = path.join(root, '.a16n', item.type);
const targetDir = item.relativeDir 
  ? path.join(baseDir, item.relativeDir)
  : baseDir;
await fs.mkdir(targetDir, { recursive: true });
const filePath = path.join(targetDir, `${slugify(item.name)}.md`);
```

### ManualPrompt Name Derivation
```typescript
// When reading IR
const filename = path.basename(filePath, '.md');
const promptName = filename; // Already slugified
```

---

## References

- Research documented: 2026-02-03
- Decisions summarized in: `memory-bank/tasks.md` (Architectural Decisions section)
- Implementation plan: `memory-bank/tasks.md` (7 milestones, 24 hours)
- Current focus: `memory-bank/activeContext.md`
- Progress tracking: `memory-bank/progress.md`
- Implementation starts: Milestone 1 & 2 (parallel)

---

## Implementation Amendments (2026-02-04)

After initial planning, 10 critical amendments were identified:

### Amendment 1: `metadata` Field NOT Serialized to IR
- `metadata` is transient, used only during in-memory conversions
- NOT written to `.a16n/` files
- Tool-specific pass-through; IR captures canonical representation only

### Amendment 2: `name` vs `sourcePath` Clarity
- Base `AgentCustomization` does NOT get a `name` field
- `sourcePath` becomes **optional** (omitted when emitted from a16n plugin)
- Filename IS the identifier (slugified from original basename)
- `relativeDir` captures subdirectory structure

### Amendment 3: Use Enum Values for Directory Names
- Directory names must match `CustomizationType` enum values (kebab-case)
- `.a16n/global-prompt/`, `.a16n/file-rule/`, etc.
- Use `item.type` directly as directory name

### Amendment 4: Fix `relativeDir` Extraction Logic
```typescript
function extractRelativeDir(sourcePath: string, baseDir: string): string {
  const fullDir = path.dirname(sourcePath);
  if (fullDir === baseDir || fullDir === '.') return '';
  return path.relative(baseDir, fullDir);
}
```

### Amendment 5: Correct `IRVersion` Type Definition
- Must require trailing number: `v1beta1` ✓, `v1` ✗
- Runtime validation via `parseIRVersion()`
- Regex: `/^v(\d+)([a-z]*)(\d+)$/`

### Amendment 6: Breaking Change to `AgentCustomization`
```typescript
export interface AgentCustomization {
  id: string;
  type: CustomizationType;
  sourcePath?: string;          // CHANGED: now optional
  content: string;
  metadata: Record<string, unknown>;
  version: IRVersion;           // NEW: required
  relativeDir?: string;         // NEW: optional
}
```
This is a `feat!:` breaking change.

### Amendment 7: AgentSkillIO Verbatim Handling
- `.a16n/agent-skill-io/<name>/` contains verbatim AgentSkills.io structure
- `SKILL.md` uses AgentSkills.io format (NOT a16n frontmatter)
- No `version` field injected
- AgentSkills.io standard IS the on-disk IR for this type

### Amendment 8: SimpleAgentSkill Identity
- `description` + location matter, NOT `metadata.name`
- Frontmatter: `version`, `type`, `description`, `relativeDir` only
- No `name` field in frontmatter
- Round-trip may lose `metadata.name` (acceptable)

### Amendment 9: ManualPrompt + `relativeDir` Crucial
- `relativeDir` is CRUCIAL for identity (provides namespace)
- `promptName = relativeDir ? path.join(relativeDir, basename) : basename`
- Example: `shared/company/pr.md` → promptName: `'shared/company/pr'`

### Amendment 10: Version Compatibility Semantics
- **Newer client reads older file:** ✅ GUARANTEED
- **Older client reads newer file:** ⚠️ MAY work
- `areVersionsCompatible(reader, file)`: reader must be >= file revision

---

## Memory Bank Organization Note

This creative doc contains the **full research and rationale**. The core memory bank files reference this doc but don't duplicate the detailed content:

- `tasks.md` - Has decision summary table with reference here
- `activeContext.md` - Brief mention with reference here  
- `progress.md` - Notes research completed, references here

This prevents duplication while maintaining traceability.
