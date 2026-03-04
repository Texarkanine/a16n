# Active Context

## Current Task: issue-70 — Replace regex frontmatter with YAML parser (Claude plugin)
**Phase:** BUILD - COMPLETE

## What Was Done
- Replaced regex-based `parseClaudeRuleFrontmatter`, `parseSkillFrontmatter`, and `parseHooksSection` with gray-matter-based parsing
- Added gray-matter dependency to plugin-claude
- Added YAML edge-case fixture and tests (comments in paths, folded multi-line description)
- Post-review hardening: removed redundant paths normalization in discover loop, added fallback for unexpected YAML types, added `hasHooks` boolean flag for presence-based skip, surfaced parse errors as warnings instead of silently swallowing
- Final cleanup: removed dead `hooks` field from SkillFrontmatter, simplified hooks detection to `'hooks' in data`, removed redundant `if (data)` guard, typed `raw` as `unknown` for clarity

## Outcome
- All 122 plugin-claude tests pass; full monorepo build and test suite green
- Level 1 task complete; no reflect/archive needed per workflow
