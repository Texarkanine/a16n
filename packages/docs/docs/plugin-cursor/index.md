---
sidebar_position: 4
---

# Plugin: Cursor

The **@a16njs/plugin-cursor** package implements the Cursor IDE format plugin for reading and writing `.cursor/rules/*.mdc` files, `.cursor/commands/*.md` files, and `.cursorignore` patterns.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-cursor
```

---

## Supported Customization Types

| Type | Cursor Format | Description |
|------|---------------|-------------|
| **GlobalPrompt** | `alwaysApply: true` in frontmatter | Always-active rules |
| **FileRule** | `globs: **/*.ts` in frontmatter | Triggered by file patterns |
| **AgentSkill** | `description: "..."` in frontmatter | Triggered by context matching |
| **AgentIgnore** | `.cursorignore` file | Files/patterns to exclude |
| **ManualPrompt** | `.cursor/commands/*.md` files | Explicitly invoked slash commands |

---

## Supported Files

### Discovery

The plugin discovers customizations from:

- **`.cursor/rules/**/*.mdc`** - MDC format rules with YAML frontmatter (recursive)
- **`.cursor/commands/**/*.md`** - Command files (recursive)
- **`.cursorignore`** - Gitignore-style patterns for files to exclude

:::note
Legacy `.cursorrules` files are not supported. Use `.cursor/rules/*.mdc` instead.
:::

### Emission

The plugin writes:

- **`.cursor/rules/<name>.mdc`** - Rule files with appropriate frontmatter
- **`.cursor/commands/<name>.md`** - Command files for ManualPrompt items
- **`.cursorignore`** - From AgentIgnore patterns

---

## MDC File Format

Cursor uses MDC (Markdown Configuration) format with YAML frontmatter.

### GlobalPrompt (Always Applied)

```markdown
---
alwaysApply: true
---

This rule is always active. Use TypeScript strict mode.
Prefer functional components over class components.
```

### FileRule (Glob Triggered)

```markdown
---
globs: **/*.tsx,**/*.jsx
---

React-specific guidelines:
- Use functional components with hooks
- Prefer named exports over default exports
- Keep components under 300 lines
```

### AgentSkill (Description Triggered)

```markdown
---
description: Authentication and authorization patterns
---

When working with authentication:
- Use JWT tokens for API authentication
- Store tokens in httpOnly cookies
- Implement refresh token rotation
```

### Rule Without Frontmatter

Rules without frontmatter are treated as GlobalPrompt:

```markdown
General coding guidelines that always apply.
```

---

## Classification Priority

When frontmatter contains multiple keys, rules are classified by first match:

1. **`alwaysApply: true`** → GlobalPrompt
2. **`globs:` present** → FileRule
3. **`description:` present** → AgentSkill
4. **No frontmatter** → GlobalPrompt (fallback)

---

## Command Files

Commands in `.cursor/commands/*.md` are prepackaged prompts invoked via `/command-name`.

### Simple Command

```markdown
Review this code for:
- Security vulnerabilities
- Performance issues
- Code style violations
```

The filename (minus `.md`) becomes the command name: `review.md` → `/review`

### Complex Commands (Skipped)

Commands with dynamic features are skipped with a warning because they cannot be converted:

| Feature | Example | Reason |
|---------|---------|--------|
| `$ARGUMENTS` | `Fix issue #$ARGUMENTS` | Runtime argument injection |
| Positional params | `Review PR #$1` | Runtime argument injection |
| Bash execution | `!git branch --show-current` | Shell execution |
| File references | `@src/utils.js` | Context injection |
| `allowed-tools` | Frontmatter key | Tool permissions |

---

## .cursorignore Format

The `.cursorignore` file uses gitignore-style patterns:

```gitignore
# Build output
dist/
build/
.next/

# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# Secrets
secrets/
*.pem
*.key
```

### Pattern Syntax

| Pattern | Matches |
|---------|---------|
| `dist/` | Directory and all contents |
| `*.log` | All `.log` files |
| `!important.log` | Negation (don't ignore) |
| `**/*.tmp` | Recursive matching |
| `.env` | Exact file match |

---

## Programmatic Usage

```typescript
import cursorPlugin from '@a16njs/plugin-cursor';
import { A16nEngine } from '@a16njs/engine';

// Create engine with Cursor plugin
const engine = new A16nEngine([cursorPlugin]);

// Discover Cursor customizations
const result = await cursorPlugin.discover('./my-project');
console.log(`Found ${result.items.length} rules`);

for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}

// Emit to Cursor format
const items = [/* AgentCustomization items */];
const emitResult = await cursorPlugin.emit(items, './my-project');
console.log(`Wrote ${emitResult.written.length} files`);
```

### Dry Run

```typescript
// Calculate what would be written without writing
const emitResult = await cursorPlugin.emit(items, './my-project', {
  dryRun: true,
});

for (const file of emitResult.written) {
  console.log(`Would write: ${file.path}`);
}
```

---

## API Reference

For complete plugin API details, see the [Plugin Cursor API Reference](/plugin-cursor/api).

---

## Conversion Notes

### To Claude

| Cursor | Claude | Notes |
|--------|--------|-------|
| `alwaysApply: true` | `CLAUDE.md` section | Multiple merged into one file |
| `globs: **/*.tsx` | Hook + glob-hook | ⚠️ Approximated |
| `description: "..."` | `.claude/skills/*/SKILL.md` | Direct mapping |
| `.cursorignore` | `permissions.deny` | ⚠️ Approximated |
| `.cursor/commands/*.md` | Skill with invoke description | Simple commands only |

### From Claude

| Claude | Cursor | Notes |
|--------|--------|-------|
| `CLAUDE.md` | `alwaysApply: true` rule | Single file |
| Skills with hooks | Not converted | Skipped |
| Skills with description | `description:` rule | Direct mapping |
| `permissions.deny` | `.cursorignore` | ⚠️ Approximated |

---

## See Also

- [Plugin Cursor API Reference](/plugin-cursor/api) - Complete API documentation
- [Plugin: Claude](/plugin-claude) - Claude Code format plugin
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
