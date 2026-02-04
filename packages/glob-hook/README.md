# @a16njs/glob-hook

[![npm version](https://img.shields.io/npm/v/@a16njs/glob-hook.svg)](https://www.npmjs.com/package/@a16njs/glob-hook)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=glob-hook)](https://codecov.io/gh/Texarkanine/a16n)

CLI tool for glob-based file path matching in Claude Code hooks. Part of the [a16n](https://github.com/texarkanine/a16n) project.

## Why This Package?

Claude Code hooks use a `matcher` field that matches **tool names** (Read, Write), not file paths. To apply rules to specific file patterns (like `**/*.tsx` for React files), you need external tooling.

**glob-hook** bridges this gap:
- Reads hook input from stdin (JSON with `tool_input.file_path`)
- Matches the file path against glob patterns using [micromatch](https://github.com/micromatch/micromatch)
- Outputs `additionalContext` if matched, enabling pattern-based rule injection

## Installation

```bash
# Via npx (recommended for hooks)
npx @a16njs/glob-hook --globs "**/*.tsx" --context-file "rules.txt"

# Or install globally
npm install -g @a16njs/glob-hook
```

## Usage

### Basic Usage

```bash
# Pipe hook JSON to glob-hook
echo '{"tool_input":{"file_path":"src/Button.tsx"}}' | \
  npx @a16njs/glob-hook \
    --globs "**/*.tsx" \
    --context-file ".a16n/rules/react.txt"
```

### In Claude Code Hooks

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

## Options

| Option | Required | Description |
|--------|----------|-------------|
| `--globs` | Yes | Comma-separated glob patterns (e.g., `"**/*.ts,**/*.tsx"`) |
| `--context-file` | Yes | Path to file containing context to inject when matched |

## Output Format

### When Pattern Matches

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

## Glob Pattern Examples

| Pattern | Matches |
|---------|---------|
| `**/*.tsx` | All `.tsx` files in any directory |
| `**/*.ts,**/*.tsx` | All TypeScript files |
| `src/components/**` | All files under `src/components/` |
| `*.config.js` | Config files in root |
| `**/*.test.ts` | All test files |

Patterns use [micromatch](https://github.com/micromatch/micromatch) syntax with `dot: true` (matches dotfiles).

## Requirements

- Node.js >= 18.0.0

## Documentation

Full documentation available at <https://texarkanine.github.io/a16n/glob-hook>.
