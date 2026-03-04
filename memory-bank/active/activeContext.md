# Active Context

## Current Task
Issue #71 — ManualPrompt emit to Cursor commands

## Phase
BUILD - COMPLETE

## What Was Done
- Replaced ManualPrompt emission from `.cursor/skills/*/SKILL.md` (with `disable-model-invocation: true`) to `.cursor/commands/<name>.md` (plain content, no frontmatter)
- Removed `formatManualPromptSkillMd()` — replaced with `getUniqueCommandFilename()`
- Added `relativeDir` support and path-traversal validation for command emission
- Decoupled ManualPrompt namespace from skill namespace (no more false collisions)
- Updated 15 tests; added 3 new tests (relativeDir nesting, path-traversal relativeDir, no-frontmatter)
- All 129 plugin-cursor tests pass; full monorepo build and test suite green

## Next Step
QA phase
