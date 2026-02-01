# TASK ARCHIVE: Documentation Cleanup Round 2

## METADATA

**Task ID**: DOCS-CLEANUP-R2  
**Title**: Documentation Cleanup Round 2  
**Complexity**: Level 2 (Simple Enhancement)  
**Category**: Documentation Enhancement  
**Date Started**: 2026-01-31  
**Date Completed**: 2026-02-01  
**Duration**: ~7 commits, 30 files modified

---

## SUMMARY

Addressed post-review feedback from initial documentation rollout, transforming docs from "comprehensive but unwieldy" to "focused and maintainable." Key improvements included integrating CLI versioned docs, eliminating N×N scaling problems in conversion tables, adopting Discovery/Emission pattern for plugin pages, and linking to canonical documentation instead of replicating format details.

**Impact**:
- CLI docs now generate automatically for all versions
- Documentation scales linearly (not exponentially) as plugins are added
- Maintenance burden reduced via canonical doc links
- Future AgentSkills.io support documented in roadmap

---

## REQUIREMENTS

### Primary Goals

1. **CLI Versioned Docs** - Integrate CLI doc generation into versioned API pipeline
2. **Remove N×N Conversion Tables** - Eliminate plugin-to-plugin mapping tables that don't scale
3. **Clean Up Models Page** - Remove tool-specific implementation details
4. **Simplify Plugin Pages** - Link to canonical docs instead of replicating format details
5. **Fix Docusaurus Version Mismatch** - Align all Docusaurus packages to same version

### Success Criteria

- ✅ CLI docs appear in versions.json with correct tag format
- ✅ Plugin-to-plugin conversion tables removed
- ✅ Models page focuses on IR types, not tool mappings
- ✅ Plugin pages link to official Cursor/Claude documentation
- ✅ All tests pass (395/395)
- ✅ Docs build successfully
- ✅ Docusaurus packages aligned to 3.9.2

---

## IMPLEMENTATION

### Phase 1: CLI Versioned Docs Integration

**Files Modified**:
- `packages/docs/scripts/generate-versioned-api.ts`

**Changes**:
1. Imported `generateCliDocsForVersion` from `generate-cli-docs.ts`
2. Added CLI tag processing loop after library packages
3. Fixed `versions.json` manifest generation for CLI's different tag format (`a16n@X.Y.Z`)
4. Added CLI-specific pagination handling (uses `reference/` instead of `api/`)

**Key Code**:
```typescript
// CLI uses custom generator, not TypeDoc
const cliTags = tagGroups.get('cli');
if (cliTags && cliTags.length > 0) {
  console.log(`\nProcessing cli (${cliTags.length} versions):`);
  for (const tag of cliTags) {
    const commit = getTagCommit(tag.fullTag);
    checkoutAllPackagesFromCommit(commit);
    await generateCliDocsForVersion(outputDir, tag.version);
    results.push({ pkg: 'cli', version: tag.version, success: true });
    restoreAllPackagesToHead();
  }
}
```

**Outcome**: CLI versions (0.3.0, 0.4.0) now generate automatically with correct pagination.

### Phase 2: Remove Plugin-to-Plugin Conversion Tables

**Files Modified**:
- `packages/docs/docs/plugin-cursor/index.md`
- `packages/docs/docs/plugin-claude/index.md`

**Changes**:
- Removed "Conversion Notes" sections showing Cursor↔Claude mappings
- Eliminated N×N documentation burden (4 paths with 2 plugins, 9 with 3 plugins)

**Rationale**: Users can use `--dry-run` to preview conversions. Plugin pages document what each plugin does, not how they interact.

### Phase 3: Clean Up Models Page

**Files Modified**:
- `packages/docs/docs/models/index.md`

**Changes**:
1. Removed "How Each Tool Implements Them" table (tool-specific, doesn't belong)
2. Removed "Quick Reference" code example section (duplicated info)
3. Simplified "Conceptual Distinctions" to remove tool references

**Outcome**: Models page focuses on IR types (GlobalPrompt, AgentSkill, etc.), not tool implementations.

### Phase 4: Simplify Plugin Pages & Discovery/Emission Pattern

**Files Modified**:
- `packages/docs/docs/plugin-cursor/index.md`
- `packages/docs/docs/plugin-claude/index.md`

**Changes**:
1. Removed verbose format documentation:
   - Command Files section (Cursor)
   - .cursorignore Format section (Cursor)
   - File Formats section (Claude)
   - Detailed settings.json examples (Claude)

2. Added canonical documentation links:
   ```markdown
   :::tip Canonical Documentation
   For complete details on Cursor's rule format, see 
   [Cursor's official documentation](https://docs.cursor.com/context/rules-for-ai).
   :::
   ```

3. Restructured to Discovery/Emission pattern:
   - **Discovery**: List files with classification logic (prose + bullets)
   - **Emission**: Show a16n type → output format (simple table)

**Example Structure**:
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

### Phase 5: Docusaurus Version Alignment

**Files Modified**:
- `packages/docs/package.json`
- `pnpm-lock.yaml`

**Issue**: Mismatched Docusaurus versions caused peer dependency conflicts:
- `@docusaurus/core`, `@docusaurus/preset-classic`: `^3.6.3`
- `@docusaurus/theme-mermaid`: `^3.9.2` ⚠️

**Solution**: Upgraded all Docusaurus packages to `^3.9.2` (latest stable):
- `@docusaurus/core`
- `@docusaurus/faster`
- `@docusaurus/preset-classic`
- `@docusaurus/theme-mermaid`
- `@docusaurus/module-type-aliases`
- `@docusaurus/types`

**Verification**: Build succeeded, all tests passed.

### Roadmap Updates

**Files Modified**:
- `planning/ROADMAP.md`

**Changes**:
Added "Future: Full AgentSkills.io Standard Support" roadmap item documenting:
- Current limitation (simple skills only)
- Two implementation options (rename vs full support)
- Smart emission routing based on skill complexity
- Estimated scope (16-24 hours)

---

## TESTING

### Build Verification
```bash
pnpm --filter docs build
# ✅ Generated 9 versioned docs (including CLI 0.3.0, 0.4.0)
# ✅ Build time: ~190s
# ✅ No errors
```

### Test Suite
```bash
pnpm test --silent
# ✅ 395/395 tests passed
# ✅ All packages: cli, engine, models, plugin-cursor, plugin-claude, glob-hook, docs
```

### Manual Verification
- ✅ CLI docs appear in versions.json: `"cli": ["0.4.0", "0.3.0"]`
- ✅ Pagination links work correctly
- ✅ Canonical doc links are valid
- ✅ Discovery/Emission structure is clear and scannable
- ✅ No broken internal links

---

## LESSONS LEARNED

### 1. Documentation Scales Differently Than Code

**Pattern**: Code complexity grows linearly (add plugin → implement discovery/emission). Documentation complexity can grow exponentially (plugin-to-plugin conversion tables).

**Solution**: Document what each component does (linear), not how they interact (exponential). Let users compose understanding from independent descriptions.

### 2. Prose Beats Tables for Branching Logic

**Anti-pattern**: Complex tables showing "if X then Y, else if Z then W"

**Better**: Numbered priority lists that read as decision trees:
```markdown
1. `alwaysApply: true` → GlobalPrompt
2. `globs:` present → FileRule
3. `description:` present → AgentSkill
4. None of above → ManualPrompt
```

### 3. Link Out for Tool-Specific Details

**Old approach**: Document Cursor's syntax, command features, etc.
**Problems**: Maintenance burden, version skew, duplication

**New approach**: Link to canonical docs, document only a16n's behavior:
- "Cursor Ignore uses gitignore-style patterns: AgentIgnore"
- "See [Cursor's official documentation](https://docs.cursor.com)"

### 4. Discovery ≠ Emission Bidirectionality

**Insight**: Documentation symmetry ≠ implementation symmetry
- Cursor Rules discovery: complex (one file → 4 possible types)
- Cursor Rules emission: simple (4 types → 4 distinct files)

**Lesson**: Direction matters more than format. Separate Discovery/Emission sections acknowledge this asymmetry.

### 5. Roadmap Items Emerge from Doc Work

**Pattern**: Simplifying docs revealed product gaps:
- AgentSkill vs AgentSkillIO distinction
- Simple vs complex skill handling
- Emission target decisions

**Action**: Captured in roadmap immediately with problem statement, options, and scope estimate.

### 6. Upgrade Rather Than Downgrade Dependencies

**Context**: Docusaurus 3.9.2 was latest stable, but core packages were at 3.6.3.

**Decision**: Upgraded all packages to 3.9.2 instead of downgrading theme-mermaid to 3.6.3.

**Rationale**: Stay current with upstream improvements, avoid technical debt.

---

## PROCESS IMPROVEMENTS

### 1. Build Early, Build Often
For doc-heavy changes, `pnpm build` provides faster feedback than code review. Catches broken links, invalid frontmatter, pagination cycles.

### 2. Separate Structure from Content
- Commit 1: Remove sections (structure)
- Commit 2: Add Discovery/Emission (structure)  
- Commit 3: Add canonical links (content)

Easier code review—structural changes are high-signal.

### 3. Document Limitations Before Building Workarounds
Don't over-engineer. Document current limitation ("simple skills only"), create roadmap item, let user feedback prioritize.

### 4. Idempotent Generation Scripts
For scripts that re-run during development:
```typescript
const cleanedFrontmatter = frontmatter
  .split('\n')
  .filter(line => !line.startsWith('pagination_next:'))
  .join('\n');
```
Clean previous output before writing new output.

---

## METRICS

| Metric | Value |
|--------|-------|
| Files Changed | 30 |
| Lines Added | 3,290 |
| Lines Removed | 446 |
| Net Change | +2,844 |
| Commits | 7 |
| Test Pass Rate | 395/395 (100%) |
| Build Time | ~190s |
| CLI Versions Generated | 2 (0.3.0, 0.4.0) |
| Total Versioned Docs | 9 |

**Most Impactful Changes**:
1. `generate-versioned-api.ts` - CLI integration (+105 lines)
2. `plugin-cursor/index.md` - Discovery/Emission rewrite (+112/-112)
3. `plugin-claude/index.md` - Discovery/Emission rewrite (+102/-102)
4. `ROADMAP.md` - AgentSkills.io future work (+45 lines)

---

## REFERENCES

- **Reflection**: `memory-bank/reflection/reflection-DOCS-CLEANUP-R2.md`
- **Planning**: Detailed in original `memory-bank/tasks.md`
- **Related Commits**: 7 commits on documentation branch
- **PR**: Documentation Cleanup Round 2 (pending)

---

## NEXT STEPS

### Immediate
1. ✅ Archive task documentation
2. ✅ Clear Memory Bank for next task
3. Open PR for review
4. Merge to main after approval

### Short-Term
1. **User Testing**: Have unfamiliar user navigate docs
   - Can they find how to convert Cursor → Claude?
   - Is Discovery/Emission pattern clear?

2. **Link Validation**: Verify external links remain valid
   - Cursor official docs
   - Claude official docs

### Medium-Term
1. **Full AgentSkills.io Support** (from roadmap)
   - Define `AgentSkillIO` type
   - Implement smart emission routing
   - Handle skill resources

2. **API Reference Landing Pages**
   - Version picker component
   - Migration guides between versions

---

## CONCLUSION

Successfully transformed documentation from comprehensive but scaling-challenged to focused and maintainable. Key wins:

1. **CLI versioned docs** now generate automatically
2. **N×N conversion tables** eliminated
3. **Discovery/Emission pattern** provides clear template for future plugins
4. **Canonical linking** reduces maintenance burden
5. **Docusaurus 3.9.2** alignment eliminates peer dependency conflicts
6. **Roadmap gaps** identified and documented

Documentation is now positioned to scale gracefully as plugins are added. The work revealed important product gaps (AgentSkillsIO support) that are tracked in roadmap for prioritization.

**Status**: Complete and archived.
