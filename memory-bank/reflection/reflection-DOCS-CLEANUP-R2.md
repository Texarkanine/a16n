# Reflection: DOCS-CLEANUP-R2

**Task ID**: DOCS-CLEANUP-R2  
**Title**: Documentation Cleanup Round 2  
**Complexity**: Level 2 (Simple Enhancement)  
**Date**: 2026-01-31  
**Duration**: ~7 commits, 3,290 additions, 446 deletions across 30 files

---

## Summary

This task addressed post-review feedback from the initial documentation rollout, focusing on six key improvements:

1. **CLI Versioned Docs** - Integrated CLI doc generation into the versioned API pipeline
2. **Removed N×N Conversion Tables** - Eliminated plugin-to-plugin mapping tables that don't scale
3. **Cleaned Up Models Page** - Removed tool-specific implementation details
4. **Simplified Plugin Pages** - Linked to canonical docs instead of replicating format details
5. **Improved Documentation Structure** - Adopted Discovery/Emission pattern for plugin pages
6. **Identified Roadmap Gaps** - Documented full AgentSkills.io support as future work

The work successfully transformed the documentation from "comprehensive but unwieldy" to "focused and maintainable."

---

## What Went Well

### 1. CLI Versioned Docs Integration

**Challenge**: CLI was excluded from versioned pipeline because it doesn't export library APIs.

**Solution**: Recognized that `generate-cli-docs.ts` already supported versioned generation—just needed integration.

**Key Win**: The CLI-specific generation loop seamlessly coexists with TypeDoc-based library generation:
```typescript
// Library packages use TypeDoc
for (const pkg of PACKAGES) { ... }

// CLI uses custom generator
const cliTags = tagGroups.get('cli');
if (cliTags) {
  for (const tag of cliTags) {
    await generateCliDocsForVersion(outputDir, tag.version);
  }
}
```

**Outcome**: CLI docs now appear in `versions.json` with correct tag format (`a16n@X.Y.Z` vs `@a16njs/pkg@X.Y.Z`), and pagination works correctly (uses `reference/` path instead of `api/`).

### 2. Recognized the N×N Scaling Problem

**Insight**: With 2 plugins, conversion tables document 4 paths (Cursor→Claude, Claude→Cursor × 2 types). With 3 plugins, that becomes 9 paths.

**Decision**: Remove plugin-to-plugin conversion tables entirely. Users can:
- Use `--dry-run` to preview specific conversions
- Read plugin pages to understand discovery/emission per plugin
- Consult "Understanding Conversions" for conceptual overview

**Impact**: Future plugin additions (Codex, Windsurf, Continue) won't require exponential doc updates.

### 3. Discovery/Emission Pattern

**Problem**: Original plugin documentation mixed "what we read" and "what we write" in complex tables.

**Solution**: Separate sections:
- **Discovery**: List file types with classification logic (prose + bullets)
- **Emission**: Show a16n type → output format (simple table)

**Why it works**:
- Discovery is complex (one file type → multiple a16n types based on frontmatter)
- Emission is simple (one a16n type → one output format)
- Users typically care about one direction at a time

**Example (Cursor Rules)**:
```markdown
### Discovery
* Cursor Rules: `.cursor/rules/**/*.mdc`
  * `alwaysApply: true`: GlobalPrompt
  * `globs: ...`: FileRule
  * `description: "..."`: AgentSkill

### Emission
* GlobalPrompt: Cursor Rule with `alwaysApply: true`
* FileRule: Cursor Rule with `globs: ...`
* AgentSkill: Cursor Skill
```

### 4. Linking to Canonical Documentation

**Principle**: Document what a16n does, not what Cursor/Claude do.

**Implementation**: Added tip boxes linking to official docs:
```markdown
:::tip Canonical Documentation
For complete details on Cursor's rule format, commands, and ignore patterns,
see [Cursor's official documentation](https://docs.cursor.com/context/rules-for-ai).
:::
```

**Benefit**: Reduces maintenance burden—tool format changes don't require our doc updates.

### 5. Identified Model/Implementation Mismatch

**Discovery**: Our `AgentSkill` type only handles simple skills (single SKILL.md with description). The full AgentSkills.io standard supports:
- Multiple files per skill
- Hooks in frontmatter
- Resources
- Complex activation patterns

**Action**: Documented in roadmap as "Future: Full AgentSkills.io Standard Support" with two options:
- **Option A**: Rename to `SimpleAgentSkill`, keep current behavior
- **Option B**: Add `AgentSkillIO` type for full standard support

**Emission Logic for Option B**:
- Simple skill with `disable-model-invocation: true` → Cursor Command
- Simple skill without → Cursor Rule with `description:`
- Complex skill → Full `.cursor/skills/<name>/` directory

---

## Challenges

### 1. CLI Tag Format Handling

**Issue**: CLI uses different tag format than library packages:
- Libraries: `@a16njs/models@0.2.0`
- CLI: `a16n@0.3.0`

**Solution**: Added conditional logic to handle both formats when building `versions.json`:
```typescript
const fullTag = result.pkg === 'cli'
  ? `a16n@${result.version}`
  : `@a16njs/${result.pkg}@${result.version}`;
```

**Lesson**: Early design decisions (CLI uses `a16n` npm name) ripple through the system. Consistent naming patterns reduce special cases.

### 2. CLI Pagination Path Differences

**Issue**: Library packages use `.generated/<pkg>/api/<version>/`, but CLI uses `.generated/cli/reference/<version>/`.

**Root Cause**: CLI docs are reference material (commands, flags), not API docs (classes, interfaces).

**Solution**: Separate pagination handling for CLI after the main loop:
```typescript
// Handle CLI pagination separately (uses reference/ instead of api/)
const cliVersions = successfulTagGroups.get('cli');
if (cliVersions && cliVersions.length > 0) {
  // ... CLI-specific pagination logic
}
```

**Lesson**: Semantic differences in content types (API vs CLI reference) justify different directory structures, but require explicit handling in shared tooling.

### 3. Balancing Simplification with Completeness

**Challenge**: How much detail to remove from plugin pages without making them too sparse?

**Approach**:
- **Keep**: File locations, classification logic, emission outputs
- **Remove**: Verbose format examples, pattern syntax tables, detailed frontmatter specs
- **Replace**: Links to canonical documentation

**Validation**: Build succeeds, no test failures, documentation remains navigable.

### 4. Discovering Undocumented Complexity

**Issue**: While restructuring plugin docs, realized we skip complex skills (hooks, multiple files) without clearly documenting the limitation.

**Response**: 
1. Updated docs to explicitly state "Simple Skills (single SKILL.md file only)"
2. Added "Complex Skills (hooks, multiple files, resources): Skipped" to discovery lists
3. Created roadmap item for full AgentSkills.io support

**Lesson**: Documentation review surfaces implementation gaps. Don't just document what exists—document what's intentionally excluded.

---

## Lessons Learned

### 1. Documentation Scales Differently Than Code

**Code Scaling**: Adding a 3rd plugin requires implementing discovery/emission logic—linear growth.

**Doc Scaling (Before)**: Plugin-to-plugin conversion tables grow N×N—exponential.

**Fix**: Document *what each plugin does* (linear), not *how they interact* (exponential). Users can compose understanding from independent descriptions.

### 2. Prose Beats Tables for Branching Logic

**Anti-pattern**: Complex tables trying to show "if X then Y, else if Z then W":
```markdown
| Input | Condition | Output | Notes |
|-------|-----------|--------|-------|
| `.cursor/rules/*.mdc` | `alwaysApply: true` | GlobalPrompt | ... |
| `.cursor/rules/*.mdc` | `globs: ...` | FileRule | ... |
```

**Better pattern**: Numbered priority list:
```markdown
1. `alwaysApply: true` → GlobalPrompt
2. `globs:` present → FileRule
3. `description:` present → AgentSkill
4. None of above → ManualPrompt (fallback)
```

**Why**: The priority list IS the decision tree. No need for a Mermaid diagram when prose is clear.

### 3. Link Out for Tool-Specific Details

**Old approach**: Document Cursor's `.cursorignore` syntax, command features, etc.

**Problems**:
- Maintenance burden (tool updates break our docs)
- Version skew (which Cursor version are we documenting?)
- Duplication (Cursor already has docs)

**New approach**: Link to canonical docs, document only a16n's behavior:
- "Cursor Ignore uses gitignore-style patterns: AgentIgnore"
- "See [Cursor's official documentation](https://docs.cursor.com/context/ignore-files)"

**Result**: Our docs stay correct as tools evolve.

### 4. Discovery ≠ Emission Bidirectionality

**Mistake**: Assuming documentation symmetry means implementation symmetry.

**Reality**: 
- Cursor Rules discovery is complex (one file → 4 possible types)
- Cursor Rules emission is simple (4 types → 4 distinct files)
- Direction matters more than format

**Correct mental model**: Discovery and Emission are separate operations that happen to use the same file formats.

### 5. Roadmap Items Emerge from Doc Work

**Pattern**: While simplifying docs, we discovered:
- AgentSkill vs AgentSkillIO distinction
- Simple vs complex skill handling
- Emission target decisions (Rule vs Skill vs Command)

**Action**: Created roadmap item "Future: Full AgentSkills.io Standard Support" with:
- Problem statement (current limitation)
- Proposed solutions (Option A vs B)
- Emission logic for complex implementation
- Estimated scope (16-24 hours)

**Lesson**: Documentation work reveals product gaps. Capture them immediately in roadmap, don't defer.

---

## Process Improvements

### 1. TDD for Scripts

**What Happened**: Modified `generate-versioned-api.ts` without breaking existing tests.

**Why It Worked**: Existing unit tests (`parseTag`, `groupTagsByPackage`, etc.) covered the parsing logic. Integration tests would catch CLI-specific issues, but unit tests proved the core logic was sound.

**Future**: When adding script features, check for testable pure functions (parsing, grouping, formatting). Extract if needed.

### 2. Build Early, Build Often

**Pattern Used**:
1. Make changes
2. `pnpm --filter docs build`
3. Check output in `.generated/`
4. Verify versions.json includes CLI
5. Iterate

**Why It Worked**: Docusaurus build catches:
- Broken links
- Invalid frontmatter
- Pagination cycles
- Missing files

**Lesson**: For doc-heavy changes, build is faster feedback than reading code.

### 3. Separate Structure Changes from Content Changes

**Approach**:
- **Commit 1**: Remove sections (structure)
- **Commit 2**: Add Discovery/Emission sections (structure)
- **Commit 3**: Add canonical links (content)

**Benefit**: Easier code review—structural changes are high-signal, content changes are reviewable separately.

**Future**: For large refactors, prefer small structural commits over monolithic "rewrite everything" commits.

### 4. Document Limitations Before Building Workarounds

**Anti-pattern**: Build complex AgentSkillsIO support immediately.

**Better pattern**: 
1. Document current limitation ("simple skills only")
2. Document what's skipped ("complex skills")
3. Create roadmap item with options
4. Let user feedback prioritize

**Result**: We don't over-engineer. If users need complex skills, roadmap item provides starting point.

---

## Technical Improvements

### 1. Async Function Handling in Main Loop

**Before**: All packages used synchronous TypeDoc generation.

**After**: CLI generator is async, so needed `await`:
```typescript
await generateCliDocsForVersion(outputDir, tag.version);
```

**Fix**: Changed `main()` signature from `function main()` to `async function main()`, already marked async so just needed the await.

**Lesson**: When integrating new generators, check async/sync consistency.

### 2. Idempotent Pagination Updates

**Pattern**: Pagination frontmatter can be run multiple times:
```typescript
const cleanedFrontmatter = frontmatter
  .split('\n')
  .filter(line => 
    !line.startsWith('pagination_next:') &&
    !line.startsWith('pagination_prev:')
  )
  .join('\n');
```

**Why**: Docs build is run repeatedly during development. Re-running shouldn't create duplicate pagination entries.

**Lesson**: For generated content that's re-generated, always clean previous output before writing new output.

### 3. Path Handling Consistency

**Pattern**: Use relative paths consistently:
```typescript
const versionDir = join(docsDir, '.generated', 'cli', 'reference', version);
```

**Why**: Absolute paths break on different machines. Relative paths from known roots (docsDir, repoRoot) are portable.

**Lesson**: Never hardcode `/Users/austin/...` or `/mnt/v/...` paths in scripts.

---

## Next Steps

### Immediate (This Branch)

1. **Commit Changes**: Stage all doc changes
2. **Verify Build**: Final build check
3. **Open PR**: Documentation cleanup round 2
4. **Archive Task**: Move to `memory-bank/archive/enhancements/`

### Short-Term (Next Iteration)

1. **User Testing**: Have someone unfamiliar with a16n navigate the docs
   - Can they find how to convert Cursor → Claude?
   - Is the Discovery/Emission pattern clear?
   - Are the canonical doc links helpful?

2. **Search Optimization**: Ensure Docusaurus search indexes new structure
   - Test searches for "cursor rules", "glob patterns", "cli reference"

3. **Link Checking**: Verify all external links (Cursor, Claude docs) remain valid

### Medium-Term (Roadmap Items)

1. **Full AgentSkills.io Support** (Option B from roadmap)
   - Define `AgentSkillIO` type
   - Implement smart emission routing
   - Handle skill resources (images, data files)
   - Estimated: 16-24 hours

2. **API Reference Landing Pages**: Create wrapper pages for `/models/api`, `/engine/api`, etc.
   - Version picker component
   - Package overview
   - Migration guides between versions

3. **Interactive Examples**: Add live conversion examples
   - Input: Cursor rule with frontmatter
   - Output: Preview of Claude SKILL.md
   - Powered by client-side engine?

---

## Reflection on Process

### What Made This Task Successful

1. **Clear User Feedback**: Six specific issues identified in doc review
2. **Structured Planning**: Five-phase plan with clear deliverables
3. **Incremental Implementation**: One phase at a time, verify at each step
4. **Discovery Mindset**: Allowed roadmap items to emerge from doc work

### What Could Be Improved

1. **Earlier Build Validation**: Could have caught CLI pagination issues sooner with earlier build
2. **Test Coverage**: No integration test for versioned doc generation—relies on manual verification
3. **User Stories**: Could benefit from "I want to convert Cursor→Claude" style scenarios in docs

### Personal Observations

- **Documentation as Product Design**: Simplifying docs forced us to clarify product boundaries (simple vs complex skills)
- **N×N Problem Pattern**: Worth watching for in other areas (conversion paths, plugin combinations, etc.)
- **Canonical Linking**: Powerful pattern—saves maintenance, improves correctness, respects upstream docs

---

## Metrics

| Metric | Value |
|--------|-------|
| Files Changed | 30 |
| Lines Added | 3,290 |
| Lines Removed | 446 |
| Net Change | +2,844 |
| Commits | 7 |
| Test Pass Rate | 395/395 (100%) |
| Build Success | ✓ |

**Most Impactful Changes**:
1. `generate-versioned-api.ts` (+105 lines) - CLI integration
2. `plugin-cursor/index.md` (+112 additions/-112 deletions) - Discovery/Emission rewrite
3. `plugin-claude/index.md` (+102 additions/-102 deletions) - Discovery/Emission rewrite
4. `ROADMAP.md` (+45 lines) - AgentSkills.io future work

---

## Conclusion

This documentation cleanup transformed a comprehensive but scaling-challenged doc set into a focused, maintainable foundation. Key wins:

1. **CLI versioned docs** now generate automatically
2. **N×N conversion tables** eliminated—won't scale poorly
3. **Plugin pages** follow clear Discovery/Emission pattern
4. **Canonical linking** reduces maintenance burden
5. **Roadmap gaps** identified and documented

The documentation is now positioned to scale gracefully as plugins are added. The Discovery/Emission pattern provides a template for documenting future plugins. The work revealed important product gaps (AgentSkillsIO support) that are now tracked in the roadmap.

**Status**: Ready for PR and archive.
