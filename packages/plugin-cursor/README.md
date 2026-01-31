# @a16njs/plugin-cursor

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-cursor.svg)](https://www.npmjs.com/package/@a16njs/plugin-cursor)
[![Documentation](https://img.shields.io/badge/docs-a16n.dev-blue)](https://a16n.dev/plugin-cursor)

Cursor IDE plugin for a16n. Discovers and emits Cursor rules.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-cursor
```

## Supported Types

This plugin supports five customization types:

| Type | Format | Description |
|------|--------|-------------|
| **GlobalPrompt** | `alwaysApply: true` frontmatter | Always-active rules |
| **FileRule** | `globs: **/*.ts` frontmatter | Triggered by file patterns |
| **AgentSkill** | `description: "..."` frontmatter | Triggered by context matching |
| **AgentIgnore** | `.cursorignore` file | Files/patterns to exclude |
| **AgentCommand** | `.cursor/commands/*.md` files | Explicitly invoked slash commands |

## Supported Files

### Discovery

- `.cursor/rules/**/*.mdc` - MDC format rules with frontmatter (recursive)
- `.cursor/commands/**/*.md` - Command files (recursive)
- `.cursorignore` - Gitignore-style patterns for files to exclude

> **Note:** Legacy `.cursorrules` files are not supported. Use `.cursor/rules/*.mdc` instead.

### Commands

Commands in `.cursor/commands/*.md` are prepackaged prompts invoked via `/command-name`.

**Simple commands** (just prompt text) are discovered and can be converted to Claude skills.

**Complex commands** are skipped with a warning. Complex commands contain features that cannot be converted:

| Feature | Example | Reason |
|---------|---------|--------|
| `$ARGUMENTS` | `Fix issue #$ARGUMENTS` | Runtime argument injection |
| Positional params | `Review PR #$1` | Runtime argument injection |
| Bash execution | `!git branch --show-current` | Shell execution |
| File references | `@src/utils.js` | Context injection |
| `allowed-tools` | Frontmatter key | Tool permissions |

### Emission

- Creates `.cursor/rules/<name>.mdc` files with appropriate frontmatter
- Creates `.cursor/commands/<name>.md` files for AgentCommand items
- Creates `.cursorignore` from AgentIgnore patterns

## MDC Format

Cursor uses MDC (Markdown Configuration) format with YAML frontmatter:

```markdown
---
alwaysApply: true
---

Always-applied rule content.
```

```markdown
---
globs: **/*.tsx,**/*.jsx
---

React-specific guidelines.
```

```markdown
---
description: Authentication and authorization patterns
---

Auth-related guidelines.
```

## Usage

```typescript
import cursorPlugin from '@a16njs/plugin-cursor';
import { A16nEngine } from '@a16njs/engine';

const engine = new A16nEngine([cursorPlugin]);

// Discover Cursor rules
const result = await cursorPlugin.discover('./my-project');
console.log(`Found ${result.items.length} rules`);

// Emit to Cursor format
await cursorPlugin.emit(result.items, './my-project');
```

## Documentation

Full documentation available at [a16n.dev/plugin-cursor](https://a16n.dev/plugin-cursor).
