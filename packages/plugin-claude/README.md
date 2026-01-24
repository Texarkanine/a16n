# @a16n/plugin-claude

Claude Code plugin for a16n. Discovers and emits Claude configuration.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16n/plugin-claude
```

## Supported Types

This plugin supports three customization types:

| Type | Claude Format | Description |
|------|---------------|-------------|
| **GlobalPrompt** | `CLAUDE.md` | Always-active instructions |
| **FileRule** | `.claude/settings.local.json` + `.a16n/rules/` | Glob-triggered via hooks |
| **AgentSkill** | `.claude/skills/*/SKILL.md` | Description-triggered skills |

## Supported Files

### Discovery

- `CLAUDE.md` - Root Claude configuration (GlobalPrompt)
- `*/CLAUDE.md` - Nested Claude configuration files (GlobalPrompt)
- `.claude/skills/*/SKILL.md` - Skills with description frontmatter (AgentSkill)

> **Note:** Skills with `hooks:` in their frontmatter are skipped (not convertible to Cursor).

### Emission

- **GlobalPrompt** → `CLAUDE.md` (merged with section headers)
- **FileRule** → `.a16n/rules/<name>.txt` + `.claude/settings.local.json` with hooks
- **AgentSkill** → `.claude/skills/<name>/SKILL.md` with description frontmatter

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

FileRules are converted using `@a16n/glob-hook` for runtime glob matching:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Read|Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "npx @a16n/glob-hook --globs \"**/*.tsx\" --context-file \".a16n/rules/react.txt\""
      }]
    }]
  }
}
```

> **Note:** FileRule conversion emits an "Approximated" warning because hook-based matching may differ slightly from Cursor's native glob matching.

## Usage

```typescript
import claudePlugin from '@a16n/plugin-claude';
import { A16nEngine } from '@a16n/engine';

const engine = new A16nEngine([claudePlugin]);

// Discover Claude configuration
const result = await claudePlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

// Emit to Claude format
await claudePlugin.emit(result.items, './my-project');
```

## License

MIT
