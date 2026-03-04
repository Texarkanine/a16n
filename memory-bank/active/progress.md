# Progress

Fix GitHub issue #70: replace regex-based YAML frontmatter parsing in the Claude plugin with a proper YAML parser (gray-matter) so that valid YAML in `.claude/rules/*.md` and `.claude/skills/*/SKILL.md` is handled correctly.

**Complexity:** Level 1

## 2026-03-04 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified task as Level 1 (bug fix, single component)
    - Created ephemeral files: projectbrief.md, activeContext.md, tasks.md, progress.md
* Decisions made
    - Use gray-matter in plugin-claude (same as plugin-a16n and models) for consistency
    - Keep Cursor MDC parsing regex-based per issue scope

## 2026-03-04 - BUILD - COMPLETE

* Work completed
    - Added gray-matter to plugin-claude dependencies
    - Rewrote parseClaudeRuleFrontmatter: gray-matter parse, coerce `paths` from unknown to string[], parseError on failure
    - Rewrote parseSkillFrontmatter: gray-matter parse, cherry-pick name/description/disable-model-invocation/hasHooks, parseError on failure
    - Removed parseHooksSection (handled by gray-matter)
    - Added fixture claude-yaml-edge-cases and 2 new tests (YAML comments + multi-path rule, folded multi-line skill description)
    - Post-review: removed redundant paths re-normalization in discover loop, added else-branch for non-string/non-array paths, added hasHooks boolean flag for presence-based skip, surfaced parseError as WarningCode.Skipped warnings
    - Final cleanup: removed dead `hooks` field from SkillFrontmatter, simplified `'hooks' in data`, removed redundant guard, typed raw as unknown
* Verification
    - plugin-claude: 122 tests passed (58 discover, 64 emit); build clean; full monorepo build and test suite green
