# @a16njs/plugin-claude

## 0.2.0

### Minor Changes

- 051a464: feat: Add AgentCommand support (Cursor commands → Claude skills)

  - Add `AgentCommand` type to models package with `commandName` field
  - Add `isAgentCommand()` type guard
  - Cursor plugin discovers `.cursor/commands/**/*.md` files
    - Simple commands (plain prompt text) become AgentCommand
    - Complex commands ($ARGUMENTS, !, @, allowed-tools) are skipped with warning
  - Claude plugin emits AgentCommand as `.claude/skills/*/SKILL.md`
    - Skills include `description: "Invoke with /command-name"` for slash invocation
  - Claude plugin never discovers AgentCommand (one-way conversion)
  - Cursor plugin supports command pass-through emission

### Patch Changes

- Updated dependencies [051a464]
  - @a16njs/models@0.1.0

## 0.1.0

### Minor Changes

- eba0dd4: Add AgentIgnore bidirectional support and CLI polish

  Phase 3 implementation:

  - Cursor plugin: `.cursorignore` discovery and emission
  - Claude plugin: `permissions.deny` Read rules discovery and emission
  - Bidirectional conversion between `.cursorignore` ↔ `permissions.deny`
  - CLI `--verbose` flag for debugging output
  - Improved warning formatting with icons and hints (chalk)
  - Improved error messages with suggestions
