# @a16n/plugin-cursor

Cursor IDE plugin for a16n. Discovers and emits Cursor rules.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16n/plugin-cursor
```

## Supported Types

This plugin supports four customization types:

| Type | Format | Description |
|------|--------|-------------|
| **GlobalPrompt** | `alwaysApply: true` frontmatter | Always-active rules |
| **FileRule** | `globs: **/*.ts` frontmatter | Triggered by file patterns |
| **AgentSkill** | `description: "..."` frontmatter | Triggered by context matching |
| **AgentIgnore** | `.cursorignore` file | Files/patterns to exclude |

## Supported Files

### Discovery

- `.cursor/rules/**/*.mdc` - MDC format rules with frontmatter (recursive)
- `.cursorignore` - Gitignore-style patterns for files to exclude

> **Note:** Legacy `.cursorrules` files are not supported. Use `.cursor/rules/*.mdc` instead.

### Classification Priority

Rules are classified based on frontmatter (first match wins):

1. `alwaysApply: true` → GlobalPrompt
2. `globs:` present → FileRule  
3. `description:` present → AgentSkill
4. No frontmatter → GlobalPrompt (fallback)

### Emission

- Creates `.cursor/rules/<name>.mdc` files with appropriate frontmatter
- Creates `.cursorignore` from AgentIgnore patterns

## .cursorignore Format

The `.cursorignore` file uses gitignore-style patterns:

```text
# Build output
dist/
build/

# Environment
.env
.env.local

# Logs
*.log

# Secrets
secrets/
```

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
import cursorPlugin from '@a16n/plugin-cursor';
import { A16nEngine } from '@a16n/engine';

const engine = new A16nEngine([cursorPlugin]);

// Discover Cursor rules
const result = await cursorPlugin.discover('./my-project');
console.log(`Found ${result.items.length} rules`);

// Emit to Cursor format
await cursorPlugin.emit(result.items, './my-project');
```

## License

MIT
