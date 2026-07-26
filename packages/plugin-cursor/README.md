# @a16njs/plugin-cursor

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-cursor.svg)](https://www.npmjs.com/package/@a16njs/plugin-cursor)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-cursor)](https://codecov.io/gh/Texarkanine/a16n)

Cursor IDE plugin for a16n. Discovers and emits Cursor rules.

## Stability

As of `1.0.0`, the plugin's `discover`/`emit` behavior and supported-type contract are stable and follow semantic versioning: breaking changes to the public API bump the major version.

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
| **SimpleAgentSkill** | `description: "..."` frontmatter | Triggered by context matching |
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

**Every command is discovered**, and its content is preserved byte-for-byte. Commands are plain prompt text to Cursor — the filename is the command name and the whole file is the prompt — so nothing in a command file needs interpreting at discovery time.

**Commands opening with a `---` block** get one `approximated` warning. Cursor commands do not support frontmatter, so such a block is prose the author wrote rather than configuration. a16n keeps it as body content and tells you it did, rather than stripping it or passing it through silently. This is common in half-migrated setups, since Claude Code commands *do* support frontmatter.

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

Full documentation available at <https://texarkanine.github.io/a16n/plugin-cursor>.
