# Current Task: issue-70 — Claude plugin YAML frontmatter

**Complexity:** Level 1

## Build

- [x] Add `gray-matter` dependency to `@a16njs/plugin-claude`
- [x] Replace `parseClaudeRuleFrontmatter` with gray-matter; normalize `paths` to array; preserve body and metadata
- [x] Replace `parseSkillFrontmatter` and `parseHooksSection` with gray-matter; map `disable-model-invocation`, `hooks`, name, description; preserve body
- [x] Run plugin-claude tests (and full suite); add/confirm tests for YAML edge cases if needed
- [x] Post-review hardening: redundant normalization, type-safety fallback, hasHooks flag, parseError surfacing
- [x] Final cleanup: remove dead code, simplify hooks detection, tighten types
- [x] Update memory-bank progress; commit with conventional message
