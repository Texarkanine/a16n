---
sidebar_position: 5
---

# Plugin: Claude

The **@a16njs/plugin-claude** package implements the Claude Code format plugin for reading and writing `CLAUDE.md` files, `.claude/skills/*/SKILL.md` files, and `.claude/settings.json` permissions.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-claude
```

---

## Supported Customization Types

| Type | Claude Format | Description |
|------|---------------|-------------|
| **GlobalPrompt** | `CLAUDE.md` | Always-active instructions |
| **FileRule** | Hooks + `.a16n/rules/` | Glob-triggered via hooks |
| **AgentSkill** | `.claude/skills/*/SKILL.md` | Description-triggered skills |
| **AgentIgnore** | `.claude/settings.json` deny | Files to exclude |
| **ManualPrompt** | Skill with invoke description | *Emitted only* |

:::note
Claude has no dedicated command concept. ManualPrompts from Cursor are emitted as skills with a description enabling `/command-name` invocation. The Claude plugin never *discovers* ManualPrompts—conversion is one-way (Cursor → Claude only).
:::

---

## Supported Files

### Discovery

The plugin discovers customizations from:

- **`CLAUDE.md`** - Root Claude configuration (GlobalPrompt)
- **`*/CLAUDE.md`** - Nested Claude configuration files (GlobalPrompt)
- **`.claude/skills/*/SKILL.md`** - Skills with description frontmatter (AgentSkill)
- **`.claude/settings.json`** - Permission deny rules (AgentIgnore)

:::note
- Skills with `hooks:` in their frontmatter are skipped (not convertible to Cursor)
- Only `Read()` permission denials are discovered (other types like `Bash()` or `Edit()` are ignored)
:::

### Emission

The plugin writes:

- **`CLAUDE.md`** - GlobalPrompt items (merged with section headers)
- **`.a16n/rules/<name>.txt`** - FileRule content files
- **`.claude/settings.local.json`** - FileRule hook configurations
- **`.claude/skills/<name>/SKILL.md`** - AgentSkill items
- **`.claude/settings.json`** - AgentIgnore patterns as permission denials

---

## File Formats

### CLAUDE.md (GlobalPrompt)

The main project instructions file:

```markdown
# Project Guidelines

Use TypeScript strict mode for all code.
Prefer functional programming patterns.
Write comprehensive tests for all features.

## Code Style

- Use 2-space indentation
- Prefer const over let
- Use meaningful variable names
```

### Nested CLAUDE.md

Directory-specific instructions:

```
project/
├── CLAUDE.md              # Root instructions
├── frontend/
│   └── CLAUDE.md          # Frontend-specific
└── backend/
    └── CLAUDE.md          # Backend-specific
```

---

### SKILL.md (AgentSkill)

Skills with description-based triggering:

```markdown
---
description: Testing best practices and patterns
---

When writing tests:
- Write unit tests first (TDD)
- Aim for 80% code coverage
- Mock external dependencies
- Use descriptive test names
```

### SKILL.md from ManualPrompt

When Cursor commands are converted to Claude:

```markdown
---
name: "review"
description: "Invoke with /review"
---

Review this code for:
- Security vulnerabilities
- Performance issues
- Code style violations
```

The `description: "Invoke with /review"` enables slash command invocation in Claude, mirroring Cursor's `/review` behavior.

---

### settings.local.json (FileRule via Hooks)

FileRules are converted using `@a16njs/glob-hook` for runtime glob matching:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx @a16njs/glob-hook --globs '**/*.tsx,**/*.jsx' --context-file '.a16n/rules/react.txt'"
          }
        ]
      }
    ]
  }
}
```

The corresponding context file:

**.a16n/rules/react.txt**
```
React-specific guidelines:
- Use functional components with hooks
- Prefer named exports
- Keep components focused
```

:::warning
FileRule conversion emits an "Approximated" warning because hook-based matching may differ slightly from Cursor's native glob matching.
:::

---

### settings.json (AgentIgnore via permissions.deny)

AgentIgnore patterns are converted to `permissions.deny` Read rules:

```json
{
  "permissions": {
    "deny": [
      "Read(./dist/**)",
      "Read(./.env)",
      "Read(./**/*.log)",
      "Read(./secrets/**)"
    ]
  }
}
```

#### Pattern Conversion Rules

| .cursorignore | permissions.deny |
|---------------|------------------|
| `dist/` | `Read(./dist/**)` |
| `.env` | `Read(./.env)` |
| `*.log` | `Read(./**/*.log)` |
| `**/*.tmp` | `Read(./**/*.tmp)` |

:::warning
AgentIgnore conversion emits an "Approximated" warning because Claude's permission system may behave slightly differently than `.cursorignore`.
:::

---

## Programmatic Usage

```typescript
import claudePlugin from '@a16njs/plugin-claude';
import { A16nEngine } from '@a16njs/engine';

// Create engine with Claude plugin
const engine = new A16nEngine([claudePlugin]);

// Discover Claude configuration
const result = await claudePlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}

// Emit to Claude format
const items = [/* AgentCustomization items */];
const emitResult = await claudePlugin.emit(items, './my-project');
console.log(`Wrote ${emitResult.written.length} files`);
```

### Dry Run

```typescript
// Calculate what would be written without writing
const emitResult = await claudePlugin.emit(items, './my-project', {
  dryRun: true,
});

for (const file of emitResult.written) {
  console.log(`Would write: ${file.path}`);
}
```

---

## Plugin Details

### ID and Name

```typescript
{
  id: 'claude',
  name: 'Claude Code',
  supports: [
    'global-prompt',
    'agent-skill',
    'file-rule',
    'agent-ignore',
    'manual-prompt'
  ]
}
```

### Metadata

The plugin stores Claude-specific metadata:

```typescript
{
  // For CLAUDE.md files
  metadata: {
    isNested: false,  // or true for nested CLAUDE.md
    directory: '.',   // relative directory path
  }
}
```

---

## Emission Behavior

### GlobalPrompt Merging

Multiple GlobalPrompts are merged into a single `CLAUDE.md` with section headers:

```markdown
# a16n: core-rules

Always use TypeScript strict mode.

# a16n: code-style

Use 2-space indentation.
Prefer const over let.
```

:::info
A "Merged" warning is emitted when multiple sources are combined.
:::

### FileRule Directory Structure

FileRules create a directory structure:

```
project/
├── .a16n/
│   └── rules/
│       ├── react.txt
│       ├── testing.txt
│       └── api.txt
└── .claude/
    └── settings.local.json
```

### Skill Directory Structure

Each skill gets its own directory:

```
project/
└── .claude/
    └── skills/
        ├── testing/
        │   └── SKILL.md
        └── auth/
            └── SKILL.md
```

---

## Conversion Notes

### From Cursor

| Cursor | Claude | Notes |
|--------|--------|-------|
| `alwaysApply: true` | `CLAUDE.md` section | Multiple merged |
| `globs: **/*.tsx` | Hook + glob-hook | ⚠️ Approximated |
| `description: "..."` | `.claude/skills/*/SKILL.md` | Direct mapping |
| `.cursorignore` | `permissions.deny` | ⚠️ Approximated |
| `.cursor/commands/*.md` | Skill with invoke description | Simple only |

### To Cursor

| Claude | Cursor | Notes |
|--------|--------|-------|
| `CLAUDE.md` | `alwaysApply: true` rule | Single file |
| Nested `CLAUDE.md` | Separate rules | Per directory |
| Skills with hooks | Not converted | ⚠️ Skipped |
| Skills with description | `description:` rule | Direct mapping |
| `permissions.deny` | `.cursorignore` | ⚠️ Approximated |

---

## See Also

- [Plugin: Cursor](/plugin-cursor) - Cursor IDE format plugin
- [Glob Hook](/glob-hook) - File pattern matching for hooks
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Plugin interface documentation
