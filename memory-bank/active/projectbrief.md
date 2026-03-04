# Project Brief

## User Story

As a maintainer/developer, I want the Claude plugin to parse YAML frontmatter in `.claude/rules/*.md` and `.claude/skills/*/SKILL.md` using a proper YAML parser so that valid YAML (multi-line strings, quoted values, comments, nested structures) is handled correctly and the current regex-based parsing is no longer fragile.

## Use-Case(s)

### Use-Case 1

Users add frontmatter with multi-line description (e.g. `description: >` or `|`) and expect it to be parsed correctly.

### Use-Case 2

Users use quoted strings or special characters in frontmatter values and expect them to be preserved.

## Requirements

1. Replace regex-based `parseClaudeRuleFrontmatter` and `parseSkillFrontmatter` (and `parseHooksSection`) in `packages/plugin-claude/src/discover.ts` with a proper YAML parser.
2. Use the same approach as the rest of the repo: `gray-matter` is already used in `@a16njs/plugin-a16n` and `@a16njs/models` for frontmatter.
3. Preserve existing behavior: paths (array/string), rule/skill frontmatter fields, hooks detection for skipping skills.
4. Cursor MDC parsing remains regex-based (out of scope).

## Constraints

1. Do not change the Cursor plugin or MDC format.
2. Maintain backward compatibility with existing fixture content and discovery tests.

## Acceptance Criteria

1. Claude rule frontmatter is parsed with gray-matter; `paths` (array or string) normalized to array; body and metadata preserved.
2. Skill frontmatter is parsed with gray-matter; `name`, `description`, `disable-model-invocation`, `hooks` (nested) read from parsed data; body preserved.
3. All existing discover tests pass.
4. New tests (or existing coverage) demonstrate that valid YAML edge cases (e.g. multi-line scalar, quoted string) are handled.
