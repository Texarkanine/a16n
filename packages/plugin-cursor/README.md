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
- `.cursor/skills/**/SKILL.md` - Agent skills (recursive under category directories)
- `.cursor/commands/**/*.md` - Command files (recursive)
- `.cursorignore` - Gitignore-style patterns for files to exclude

> **Note:** Legacy `.cursorrules` files are not supported. Use `.cursor/rules/*.mdc` instead.

**Skills with `paths:`** are treated as glob-scoped FileRules when the skill is otherwise bare (description + body, no ride-along files). Cursor's `paths:` is the same scoping contract as a rule's `globs:` / Claude `paths:`. Skills that also have resource files or `disable-model-invocation: true` cannot make that translation without losing semantics, so those are refused (`skipped`) rather than converted into an always-wider skill.

### Commands

Commands in `.cursor/commands/*.md` are prepackaged prompts invoked via `/command-name`.

**Every command is discovered**, and its content is preserved byte-for-byte. Commands are plain prompt text to Cursor — the filename is the command name and the whole file is the prompt — so nothing in a command file needs interpreting at discovery time.

**Commands opening with a `---` block** get one `approximated` warning. Cursor commands do not support frontmatter, so such a block is prose the author wrote rather than configuration. a16n keeps it as body content and tells you it did, rather than stripping it or passing it through silently. This is common in half-migrated setups, since Claude Code commands *do* support frontmatter.

### Emission

- Creates `.cursor/rules/<name>.mdc` files with appropriate frontmatter
- Creates `.cursor/commands/<name>.md` files for AgentCommand items
- Creates `.cursorignore` from AgentIgnore patterns

### AgentSkills.io Spec Fields

Skills may carry `license`, `compatibility`, `metadata`, and `allowed-tools`. What happens to them depends on the surface being written and on whether Cursor acts on them:

| Field | `.cursor/skills/*/SKILL.md` | `.cursor/rules/*.mdc` |
| --- | --- | --- |
| `license` | Written | Dropped, `approximated` |
| `compatibility` | Written | Dropped, `approximated` |
| `metadata` | Written | Dropped, `approximated` |
| `allowed-tools` | Written, but `skipped` | Dropped, `skipped` |

`SKILL.md` carries arbitrary frontmatter keys, so nothing is lost on disk. `.mdc` has a fixed schema and carries none of them.

`allowed-tools` warns even where it is written, because Cursor does not enforce tool restrictions: the emitted skill is more permissive than the source. That is a behavior change, not a formatting one, so it fails closed — and `--delete-source` will keep the original file as a result.

Exactly one warning is raised per skill per surface, naming the fields actually lost, rather than one warning per field.

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
