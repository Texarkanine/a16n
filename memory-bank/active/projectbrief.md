# Project Brief: Issue #71 — ManualPrompt emit to Cursor commands

## User Story

As a Cursor user converting agent configurations, I want ManualPrompts to be emitted as `.cursor/commands/` files (Cursor's native slash-command format) rather than as skills with `disable-model-invocation: true`, so that the slash-command experience is preserved.

## Problem

`formatManualPromptSkillMd()` in `packages/plugin-cursor/src/emit.ts` writes ManualPrompts as `.cursor/skills/<name>/SKILL.md` with `disable-model-invocation: true` in frontmatter. Cursor ignores this flag (it's a Claude Code extension), so the emitted file appears as a regular agent-requestable skill instead of a manual-only prompt.

## Requirements

1. Emit ManualPrompts to `.cursor/commands/<name>.md` (Cursor's native command format)
2. Preserve the slash-command user experience for ManualPrompt items
3. Maintain round-trip capability where possible
4. Update tests to validate the new emission path

## Scope

- `packages/plugin-cursor/src/emit.ts` — ManualPrompt emission block, `formatManualPromptSkillMd()`
- Integration test fixtures as needed
- Discovery side may need review for round-trip consistency
