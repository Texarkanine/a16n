---
"@a16njs/models": minor
"@a16njs/plugin-cursor": minor
"@a16njs/plugin-claude": minor
"a16n": minor
---

feat: Add AgentCommand support (Cursor commands → Claude skills)

- Add `AgentCommand` type to models package with `commandName` field
- Add `isAgentCommand()` type guard
- Cursor plugin discovers `.cursor/commands/**/*.md` files
  - Simple commands (plain prompt text) become AgentCommand
  - Complex commands ($ARGUMENTS, !, @, allowed-tools) are skipped with warning
- Claude plugin emits AgentCommand as `.claude/skills/*/SKILL.md`
  - Skills include `description: "Invoke with /command-name"` for slash invocation
- Claude plugin never discovers AgentCommand (one-way conversion)
- Cursor plugin supports command pass-through emission
