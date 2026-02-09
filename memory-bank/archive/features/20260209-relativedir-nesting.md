# TASK ARCHIVE: Support `relativeDir` Nesting Across All Plugins

## METADATA
- **Task ID:** relativedir-nesting
- **Date Started:** 2026-02-08
- **Date Completed:** 2026-02-09
- **Complexity Level:** 3 (Intermediate Feature)
- **Type:** Cross-Package Feature (plugin-cursor, plugin-claude, cli)
- **PR:** #44

## SUMMARY

The `relativeDir` field existed on the `AgentCustomization` model and was fully supported in the a16n (IR) plugin, but the Cursor and Claude plugins didn't set or use it. When converting between formats, all directory nesting beyond the plugin root was lost -- files got flattened into a single directory. This task propagated `relativeDir` support through all discover and emit functions, then hardened it with path traversal validation and directory-aware collision tracking based on CodeRabbit review feedback.

## REQUIREMENTS

1. Cursor discover must set `relativeDir` on all rule types (GlobalPrompt, FileRule, SimpleAgentSkill, ManualPrompt) from the subdirectory path under `.cursor/rules/`
2. Claude discover must set `relativeDir` on rules from the subdirectory path under `.claude/rules/`
3. Claude emit must use `relativeDir` to create nested subdirectories when emitting rules
4. Cursor emit must use `relativeDir` to create nested subdirectories when emitting rules
5. Items without `relativeDir` must behave exactly as before (backward compatible)
6. Path traversal validation must prevent `relativeDir` from escaping the target directory
7. Filename collision tracking must be directory-aware to prevent false collisions across subdirectories

## IMPLEMENTATION

### Phase 1: Cursor Discover
- **File:** `packages/plugin-cursor/src/discover.ts`
- Computed `relativeDir` from `nodePath.dirname(file)` where `file` is relative to `.cursor/rules/`
- Added `relativeDir` parameter to `classifyRule()` function
- Set `relativeDir` on all returned item types (GlobalPrompt, FileRule, SimpleAgentSkill, ManualPrompt)

### Phase 2: Claude Discover
- **File:** `packages/plugin-claude/src/discover.ts`
- Computed `relativeDir` by stripping `.claude/rules/` prefix and taking `path.posix.dirname()`
- Set `relativeDir` on GlobalPrompt and FileRule items

### Phase 3: Claude Emit
- **File:** `packages/plugin-claude/src/emit.ts`
- When `relativeDir` is present, compute `targetDir = path.join(rulesDir, relativeDir)` and create subdirectories
- Added path traversal validation using `path.resolve()` + `startsWith()` guard
- Added `relativeDir`-qualified collision tracking keys

### Phase 4: Cursor Emit
- **File:** `packages/plugin-cursor/src/emit.ts`
- Same pattern as Claude emit: nested directory creation, traversal validation, qualified collision tracking

### CodeRabbit PR #44 Fixes (post-build)
- Added path traversal validation in both plugins (4 code blocks)
- Fixed collision tracking to use `relativeDir/filename` qualified keys
- Fixed `relativeDir="."` edge case in traversal guards (identity check)

## TESTING

### New Tests (13 total)
- 3 in `plugin-cursor/test/discover.test.ts` -- relativeDir on shallow/deep nested rules, all rule types
- 4 in `plugin-cursor/test/emit.test.ts` -- nested emit, backward compat, WrittenFile.path correctness
- 2 in `plugin-claude/test/discover.test.ts` -- relativeDir on shallow/deep nested rules
- 4 in `plugin-claude/test/emit.test.ts` -- nested emit, backward compat, WrittenFile.path correctness

### Updated Tests (2)
- `packages/cli/test/cli.test.ts` -- updated gitignore match-mode tests to expect nested output paths

### New Fixtures
- `packages/plugin-cursor/test/fixtures/cursor-nested-deep/` -- 3 files testing deep nesting (shared/niko/Core, shared/niko/Level1)
- `packages/plugin-claude/test/fixtures/claude-nested-rules/` -- 3 files testing deep nesting and root-level mix

### Final Verification
- Full build: 7 packages built successfully
- Full test suite: 645+ tests passing across 8 packages
- No regressions in any package

## LESSONS LEARNED

1. **Plan mitigations should become test cases** -- path traversal was identified in planning but not implemented until CodeRabbit caught it. Future work should treat planned mitigations as a pre-build checklist.
2. **Directory nesting requires directory-aware collision tracking** -- flat filename tracking produces false collisions when files share names across different subdirectories.
3. **Edge case: `relativeDir="."` resolves to the parent directory** -- path traversal guards using `startsWith(parent + sep)` miss the identity case and need an explicit equality check.
4. **The `relativeDir` model field was correct from the start** -- the a16n plugin already handled it. The gap was purely in the upstream Cursor/Claude plugins.

## REFERENCES
- Reflection: `memory-bank/reflection/reflection-relativedir-nesting.md`
- Prior archive (feature that exposed this gap): `memory-bank/archive/features/20260208-split-dirs-path-rewrite.md`
- Issue reproduction: `planning/path-rewrite-issue.md`
