# Task: Support `relativeDir` Nesting Across All Plugins

## Description

The `relativeDir` field exists on `AgentCustomization` and is fully supported in the a16n (IR) plugin, but the Cursor and Claude plugins don't consistently set or use it. When converting between formats, all directory nesting beyond the plugin root (e.g., `.cursor/rules/shared/niko/Core/` → `shared/niko/Core`) is lost — files get flattened into a single directory.

The fix is to propagate `relativeDir` support through all discover and emit functions in the Cursor and Claude plugins.

## Complexity
Level: 3
Type: Cross-Package Feature (plugin-cursor, plugin-claude)

## Test Planning (TDD)

### Behaviors to Test

**Cursor Discover:**
1. Rules in subdirectories get `relativeDir` set from directory path
2. Rules at root level (`.cursor/rules/foo.mdc`) get `relativeDir: undefined`
3. Deeply nested rules (e.g., `shared/niko/Core/`) get full subdirectory as `relativeDir`
4. `relativeDir` is set on GlobalPrompt, FileRule, and SimpleAgentSkill types
5. Existing ManualPrompt `relativeDir` behavior is unchanged

**Claude Discover:**
6. Rules in `.claude/rules/subdir/` get `relativeDir` set
7. Rules at root level (`.claude/rules/foo.md`) get `relativeDir: undefined`
8. Deeply nested rules get full subdirectory path

**Claude Emit:**
9. Items with `relativeDir` emit to subdirectory under `.claude/rules/`
10. Items without `relativeDir` emit to flat `.claude/rules/` (backward compat)
11. Subdirectories are created automatically
12. `sourceItems` on `WrittenFile` correctly tracks nesting (for path rewriter)
13. Filename collision handling works within subdirectories

**Cursor Emit:**
14. Items with `relativeDir` emit to subdirectory under `.cursor/rules/`
15. Items without `relativeDir` emit to flat `.cursor/rules/` (backward compat)
16. Subdirectories are created automatically

**Integration:**
17. Round-trip Cursor→a16n→Claude preserves directory nesting
18. Path rewriting with `--rewrite-path-refs` produces correct nested target paths

### Test Infrastructure
- Framework: Vitest
- Existing test files:
  - `packages/plugin-cursor/test/discover.test.ts` — has `cursor-nested` fixture, tests `relativeDir` on ManualPrompts
  - `packages/plugin-cursor/test/emit.test.ts` — temp dir pattern
  - `packages/plugin-claude/test/discover.test.ts` — fixture-based
  - `packages/plugin-claude/test/emit.test.ts` — temp dir pattern
  - `packages/engine/test/engine.test.ts` — integration tests with rewritePathRefs
  - `packages/engine/test/path-rewriter.test.ts` — unit tests
- Fixtures:
  - `packages/plugin-cursor/test/fixtures/cursor-nested/` — already has shared/local subdirs
  - New fixture needed for deeper nesting
  - New fixture needed for Claude nested rules

### New Test Files Needed
- None (all tests go in existing test files)

### New Fixtures Needed
- `packages/plugin-cursor/test/fixtures/cursor-nested-deep/from-cursor/.cursor/rules/shared/niko/Core/file-verification.mdc`
- `packages/plugin-cursor/test/fixtures/cursor-nested-deep/from-cursor/.cursor/rules/shared/niko/Level1/workflow-level1.mdc`
- `packages/plugin-claude/test/fixtures/claude-nested-rules/from-claude/.claude/rules/niko/Core/file-verification.md`
- `packages/plugin-claude/test/fixtures/claude-nested-rules/from-claude/.claude/rules/niko/Level1/workflow-level1.md`

## Technology Stack
- Language: TypeScript
- Build Tool: Turbo + tsc
- Test: Vitest
- No new dependencies

## Technology Validation Checkpoints
- [x] Project initialization command verified (existing monorepo)
- [x] Required dependencies identified (none new)
- [x] Build configuration validated (existing)
- [x] Hello world verification N/A (feature change, not new project)
- [x] Test build passes successfully (existing tests pass)

## Status
- [x] Initialization complete
- [x] Investigation complete
- [x] Test planning complete (TDD)
- [x] Planning complete
- [x] Phase 1: Cursor Discover — set `relativeDir` on rules
- [x] Phase 2: Claude Discover — set `relativeDir` on rules
- [x] Phase 3: Claude Emit — use `relativeDir` for nesting
- [x] Phase 4: Cursor Emit — use `relativeDir` for nesting
- [x] Phase 5: Integration verification
- [x] Final verification (build + all tests)
- [x] **BUILD COMPLETE** — all 645 tests pass across 8 packages

## Implementation Plan

### Phase 1: Cursor Discover — set `relativeDir` on rules
**File:** `packages/plugin-cursor/src/discover.ts`

1. Modify the rule classification loop (around line 555) to compute `relativeDir`:
   ```typescript
   const sourcePath = `.cursor/rules/${file}`;
   const dir = nodePath.dirname(file);
   const relativeDir = dir === '.' ? undefined : dir.split(nodePath.sep).join('/');
   ```
2. Pass `relativeDir` into `classifyRule()` (add parameter)
3. Set `relativeDir` on all returned items inside `classifyRule()`

**Tests (discover.test.ts):**
- Add `relativeDir` assertions to existing `cursor-nested` test
- New test with `cursor-nested-deep` fixture for multi-level nesting
- Verify `relativeDir: undefined` for root-level rules

### Phase 2: Claude Discover — set `relativeDir` on rules  
**File:** `packages/plugin-claude/src/discover.ts`

1. In the `.claude/rules/` discovery loop (around line 644), compute `relativeDir` from `rulePath`:
   ```typescript
   // rulePath = '.claude/rules/niko/Core/file-verification.md'
   // Strip prefix '.claude/rules/' → 'niko/Core/file-verification.md'
   // dirname → 'niko/Core'
   const ruleRelPath = normalizedPath.replace(/^\.claude\/rules\//, '');
   const dir = path.posix.dirname(ruleRelPath);
   const relativeDir = dir === '.' ? undefined : dir;
   ```
2. Set `relativeDir` on GlobalPrompt and FileRule items

**Tests (discover.test.ts):**
- New test with `claude-nested-rules` fixture
- Verify `relativeDir` is set for nested rules
- Verify `relativeDir: undefined` for root-level rules

### Phase 3: Claude Emit — use `relativeDir` for nesting
**File:** `packages/plugin-claude/src/emit.ts`

1. For GlobalPrompts (line ~292-328): use `relativeDir` to compute `rulesDir` subdirectory
   ```typescript
   const targetDir = gp.relativeDir
     ? path.join(rulesDir, gp.relativeDir)
     : rulesDir;
   if (!dryRun) {
     await fs.mkdir(targetDir, { recursive: true });
   }
   const rulePath = path.join(targetDir, filename);
   ```
2. For FileRules (line ~330-388): same pattern
3. Unique filename tracking should be scoped per-directory (or stay global to prevent any collisions — design decision)

**Tests (emit.test.ts):**
- Test: items with `relativeDir` emit to `.claude/rules/<relativeDir>/`
- Test: items without `relativeDir` still go to flat `.claude/rules/`
- Test: `WrittenFile.path` reflects the nested path (critical for path rewriter)
- Test: subdirectories are created

### Phase 4: Cursor Emit — use `relativeDir` for nesting
**File:** `packages/plugin-cursor/src/emit.ts`

1. For GlobalPrompts (line ~444-475): use `relativeDir` to compute output directory
2. For FileRules (line ~477-510): same pattern
3. Same structure as Claude emit changes

**Tests (emit.test.ts):**
- Test: items with `relativeDir` emit to `.cursor/rules/<relativeDir>/`
- Test: items without `relativeDir` still go to flat `.cursor/rules/`
- Test: subdirectories are created

### Phase 5: Integration Verification
- Run full build: `npm run build` across all packages
- Run all test suites: verify existing tests still pass
- Verify path rewriting integration: existing engine tests with `rewritePathRefs` should naturally produce nested target paths once Claude emit uses `relativeDir`

## Dependencies
- `@a16njs/models` — `relativeDir` field already exists, no changes needed
- `plugin-a16n` — already supports `relativeDir`, no changes needed
- `@a16njs/engine` — path-rewriter derives target paths from actual emit output, no changes needed

## Challenges & Mitigations
- **Unique filename collision scope**: When using `relativeDir`, should filename uniqueness be tracked globally (all files across all subdirs) or per-directory? Global is safer and matches current behavior — files in different subdirs shouldn't collide in practice, but global tracking prevents edge cases. **Mitigation**: Keep filename tracking global.
- **Path traversal**: Malicious `relativeDir` values like `../../etc` could write outside the target directory. **Mitigation**: Add path traversal validation (resolve + check relative path doesn't start with `..`), similar to what the a16n plugin already does.
- **Backward compatibility**: Projects that already converted to flat `.claude/rules/` won't suddenly have nesting unless `relativeDir` is set on items. **Mitigation**: All changes are additive — when `relativeDir` is `undefined`, behavior is unchanged.

## Creative Phases Required
- None identified. Design decisions are straightforward — follow the a16n plugin's existing pattern for `relativeDir` handling.
