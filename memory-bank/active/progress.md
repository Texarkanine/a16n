# Progress

Fix GitHub issue #70: replace regex-based YAML frontmatter parsing in the Claude plugin with a proper YAML parser (gray-matter) so that valid YAML in `.claude/rules/*.md` and `.claude/skills/*/SKILL.md` is handled correctly.

**Complexity:** Level 1

## 2026-03-04 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Loaded Niko memory-bank paths and complexity rules
    - Confirmed persistent memory-bank files exist; no in-flight work
    - Classified task as Level 1 (bug fix, single component)
    - Created ephemeral files: projectbrief.md, activeContext.md, tasks.md, progress.md
* Decisions made
    - Use gray-matter in plugin-claude (same as plugin-a16n and models) for consistency
    - Keep Cursor MDC parsing regex-based per issue scope

## 2026-03-04 - BUILD - COMPLETE

* Work completed
    - Added gray-matter to plugin-claude dependencies; rewrote parseClaudeRuleFrontmatter and parseSkillFrontmatter (removed parseHooksSection) in discover.ts to use gray-matter
    - Rule frontmatter: paths normalized to string array; body and metadata preserved; parse errors fall back to empty frontmatter and full content as body
    - Skill frontmatter: name, description, disable-model-invocation, hooks (nested) read from parsed data; hooks detection for skip-rule unchanged
    - Added fixture claude-yaml-edge-cases and two tests: rule with YAML comments and multiple paths, skill with folded multi-line description
* Verification
    - plugin-claude: 122 tests passed (58 discover, 64 emit); lint and build passed; full monorepo build and tests passed
