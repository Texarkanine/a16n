# @a16njs/plugin-claude

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-claude.svg)](https://www.npmjs.com/package/@a16njs/plugin-claude)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-claude)](https://codecov.io/gh/Texarkanine/a16n)

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
| **GlobalPrompt** | `.claude/rules/*.md` | Always-active instructions |
| **FileRule** | `.claude/rules/*.md` with `paths:` frontmatter | Glob-triggered via native paths |
| **AgentSkill** | `.claude/skills/*/SKILL.md` | Description-triggered skills |
| **AgentIgnore** | `.claude/settings.json` `permissions.deny` | Files to exclude |
| **AgentCommand** | *Emitted only* | Cursor commands become skills |

> **Note:** Claude has no dedicated command concept. AgentCommands from Cursor are emitted as skills with a description enabling `/command-name` invocation. The Claude plugin never *discovers* AgentCommands—conversion is one-way (Cursor → Claude only).

## Supported Files

### Discovery

- `CLAUDE.md` - Root Claude configuration (GlobalPrompt)
- `*/CLAUDE.md` - Nested Claude configuration files (GlobalPrompt)
- `.claude/rules/*.md` - Native Claude rules (GlobalPrompt if no `paths:`, FileRule if `paths:` present)
- `.claude/skills/*/SKILL.md` - Skills with description frontmatter (AgentSkill)
- `.claude/settings.json` - Permissions deny rules (AgentIgnore)

> **Note:** Skills with `hooks:` in their frontmatter are skipped (not convertible to Cursor).
> **Note:** Only `Read()` permission denials are discovered (other types like `Bash()` or `Edit()` are ignored).

### Emission

- **GlobalPrompt** → `.claude/rules/<name>.md` (individual files)
- **FileRule** → `.claude/rules/<name>.md` with `paths:` YAML frontmatter
- **AgentSkill** → `.claude/skills/<name>/SKILL.md` with description frontmatter
- **AgentIgnore** → `.claude/settings.json` with `permissions.deny` Read rules
- **AgentCommand** → `.claude/skills/<commandName>/SKILL.md` with `Invoke with /command` description

## File Formats

### .claude/rules/*.md (GlobalPrompt)

Rules without `paths:` frontmatter apply to all files:

```markdown
## From: .cursor/rules/general.mdc

Your instructions for Claude here.
```

### .claude/rules/*.md (FileRule)

Rules with `paths:` frontmatter apply only when working with matching files:

```markdown
---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

## From: .cursor/rules/react.mdc

Use functional components with hooks.
```

### SKILL.md (AgentSkill)

```markdown
---
description: Testing best practices
---

Write unit tests first.
Aim for 80% code coverage.
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
