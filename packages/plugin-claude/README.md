# @a16njs/plugin-claude

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-claude.svg)](https://www.npmjs.com/package/@a16njs/plugin-claude)

Claude Code plugin for a16n. Discovers and emits Claude configuration.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-claude
```

## Supported Types

This plugin supports five customization types:

| Type | Claude Format | Description |
|------|---------------|-------------|
| **GlobalPrompt** | `CLAUDE.md` | Always-active instructions |
| **FileRule** | `.claude/settings.local.json` + `.a16n/rules/` | Glob-triggered via hooks |
| **AgentSkill** | `.claude/skills/*/SKILL.md` | Description-triggered skills |
| **AgentIgnore** | `.claude/settings.json` `permissions.deny` | Files to exclude |
| **AgentCommand** | *Emitted only* | Cursor commands become skills |

> **Note:** Claude has no dedicated command concept. AgentCommands from Cursor are emitted as skills with a description enabling `/command-name` invocation. The Claude plugin never *discovers* AgentCommands—conversion is one-way (Cursor → Claude only).

## Supported Files

### Discovery

- `CLAUDE.md` - Root Claude configuration (GlobalPrompt)
- `*/CLAUDE.md` - Nested Claude configuration files (GlobalPrompt)
- `.claude/skills/*/SKILL.md` - Skills with description frontmatter (AgentSkill)
- `.claude/settings.json` - Permissions deny rules (AgentIgnore)

> **Note:** Skills with `hooks:` in their frontmatter are skipped (not convertible to Cursor).
> **Note:** Only `Read()` permission denials are discovered (other types like `Bash()` or `Edit()` are ignored).

### Emission

- **GlobalPrompt** → `CLAUDE.md` (merged with section headers)
- **FileRule** → `.a16n/rules/<name>.txt` + `.claude/settings.local.json` with hooks
- **AgentSkill** → `.claude/skills/<name>/SKILL.md` with description frontmatter
- **AgentIgnore** → `.claude/settings.json` with `permissions.deny` Read rules
- **AgentCommand** → `.claude/skills/<commandName>/SKILL.md` with `Invoke with /command` description

## File Formats

### CLAUDE.md (GlobalPrompt)

```markdown
# Project Guidelines

Your instructions for Claude here.
```

### SKILL.md (AgentSkill)

```markdown
---
description: Testing best practices
---

Write unit tests first.
Aim for 80% code coverage.
```

### settings.local.json (FileRule via hooks)

FileRules are converted using `@a16njs/glob-hook` for runtime glob matching:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Read|Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "npx @a16njs/glob-hook --globs \"**/*.tsx\" --context-file \".a16n/rules/react.txt\""
      }]
    }]
  }
}
```

## Usage

```typescript
import claudePlugin from '@a16njs/plugin-claude';
import { A16nEngine } from '@a16njs/engine';

const engine = new A16nEngine([claudePlugin]);

// Discover Claude configuration
const result = await claudePlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

// Emit to Claude format
await claudePlugin.emit(result.items, './my-project');
```

## Documentation

Full documentation available at <https://texarkanine.github.io/a16n/plugin-claude>.
