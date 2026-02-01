---
sidebar_position: 6
---

# Glob Hook CLI

:::caution Not Required for Claude Code (January 2026+)
As of January 2026, Claude Code natively supports glob-based file rules via the `paths:` frontmatter in `.claude/rules/*.md` files. **a16n no longer uses glob-hook for Claude Code conversions** — FileRules are now emitted as native Claude rules with `paths:` frontmatter for lossless conversion.

This package remains available for custom hook configurations or other use cases, but is no longer needed for standard a16n Claude conversions.
:::

The **@a16njs/glob-hook** package is a CLI tool for glob-based file path matching in Claude Code hooks. It enables pattern-based rule injection—a capability that Claude Code hooks don't natively support.

## Why This Package?

Claude Code hooks use a `matcher` field that matches **tool names** (like `Read`, `Write`, `Edit`), not file paths. To apply rules to specific file patterns (like `**/*.tsx` for React files), you need external tooling.

**glob-hook** bridges this gap:
1. Reads hook input from stdin (JSON with `tool_input.file_path`)
2. Matches the file path against glob patterns using [micromatch](https://github.com/micromatch/micromatch)
3. Outputs `additionalContext` if matched, enabling pattern-based rule injection

## Installation

```bash
# Via npx (recommended for hooks)
npx @a16njs/glob-hook --globs "**/*.tsx" --context-file "rules.txt"

# Or install globally
npm install -g @a16njs/glob-hook
```

## CLI Usage

### Options

| Option | Required | Description |
|--------|----------|-------------|
| `--globs` | Yes | Comma-separated glob patterns (e.g., `"**/*.ts,**/*.tsx"`) |
| `--context-file` | Yes | Path to file containing context to inject when matched |

### Basic Example

```bash
# Pipe hook JSON to glob-hook
echo '{"tool_input":{"file_path":"src/Button.tsx"}}' | \
  npx @a16njs/glob-hook \
    --globs "**/*.tsx" \
    --context-file ".a16n/rules/react.txt"
```

---

## Integration with Claude Code

### Hook Configuration

Configure in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx @a16njs/glob-hook --globs '**/*.tsx,**/*.ts' --context-file '.a16n/rules/typescript.txt'"
          }
        ]
      }
    ]
  }
}
```

### Multiple Pattern Rules

You can set up multiple hooks for different file patterns:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx @a16njs/glob-hook --globs '**/*.tsx,**/*.jsx' --context-file '.a16n/rules/react.txt'"
          },
          {
            "type": "command",
            "command": "npx @a16njs/glob-hook --globs '**/*.test.ts' --context-file '.a16n/rules/testing.txt'"
          },
          {
            "type": "command",
            "command": "npx @a16njs/glob-hook --globs 'src/api/**' --context-file '.a16n/rules/api.txt'"
          }
        ]
      }
    ]
  }
}
```

---

## Output Format

### When Pattern Matches

If the file path matches any of the glob patterns, glob-hook outputs:

```json
{
  "hookSpecificOutput": {
    "additionalContext": "<contents of context file>"
  }
}
```

### When Pattern Doesn't Match

```json
{}
```

### On Error

Always outputs `{}` (empty object) and logs errors to stderr. This ensures hook failures don't break Claude Code.

---

## Glob Pattern Syntax

Patterns use [micromatch](https://github.com/micromatch/micromatch) syntax with `dot: true` (matches dotfiles).

### Common Patterns

| Pattern | Matches |
|---------|---------|
| `**/*.tsx` | All `.tsx` files in any directory |
| `**/*.ts,**/*.tsx` | All TypeScript files |
| `src/components/**` | All files under `src/components/` |
| `*.config.js` | Config files in root |
| `**/*.test.ts` | All test files |
| `!node_modules/**` | Negation (exclude pattern) |

### Pattern Examples

```bash
# React components
--globs "**/*.tsx,**/*.jsx"

# TypeScript source (excluding tests)
--globs "src/**/*.ts,!**/*.test.ts"

# API routes
--globs "src/api/**/*.ts,src/routes/**/*.ts"

# Config files
--globs "*.config.js,*.config.ts,.*.js"

# Documentation
--globs "**/*.md,**/*.mdx,docs/**"
```

---

## Integration with a16n (Legacy)

:::info Historical Context
Prior to January 2026, a16n used glob-hook to emulate Cursor's glob-based FileRules in Claude Code. This section is preserved for reference, but **a16n no longer uses this approach**.

Modern a16n versions emit FileRules as native `.claude/rules/*.md` files with `paths:` frontmatter, which Claude Code supports natively.
:::

<details>
<summary>Legacy behavior (pre-January 2026)</summary>

When a16n converted Cursor FileRules to Claude format, it used glob-hook:

1. **Discovery**: a16n reads Cursor rules with glob patterns from `.cursor/rules/*.mdc`
2. **Generation**: For each rule, a16n creates:
   - A context file (`.a16n/rules/<name>.txt`) containing the rule content
   - A hook configuration in `.claude/settings.local.json` using glob-hook
3. **Runtime**: When Claude Code triggers the hook, glob-hook matches file paths and injects context

### Example Legacy Conversion

**Cursor source** (`.cursor/rules/react.mdc`):
```markdown
---
globs: **/*.tsx,**/*.jsx
---

Use functional components with hooks.
Prefer named exports over default exports.
```

**Claude output (legacy)** (`.claude/settings.local.json`):
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "npx @a16njs/glob-hook --globs '**/*.tsx,**/*.jsx' --context-file '.a16n/rules/react.txt'"
      }]
    }]
  }
}
```

</details>

### Current Behavior

a16n now converts FileRules to native Claude rules:

**Cursor source** (`.cursor/rules/react.mdc`):
```markdown
---
globs: **/*.tsx,**/*.jsx
---

Use functional components with hooks.
Prefer named exports over default exports.
```

**Claude output (current)** (`.claude/rules/react.md`):
```markdown
---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

## From: .cursor/rules/react.mdc

Use functional components with hooks.
Prefer named exports over default exports.
```

---

## Hook Input Schema

The input from Claude Code hooks follows this structure:

```typescript
interface HookInput {
  hook_event_name?: 'PreToolUse' | 'PostToolUse';
  tool_name: string;
  tool_input: {
    file_path?: string;  // The path glob-hook matches against
    content?: string;
    command?: string;
  };
  tool_response?: {
    content?: string;
  };
}
```

---

## Requirements

- Node.js >= 18.0.0
- Claude Code with hooks support

---

## See Also

- [CLI Reference](/cli) - a16n command-line interface
- [Plugin: Claude](/plugin-claude) - Claude format details (now uses native rules)
- [Understanding Conversions](/understanding-conversions) - How conversions work
