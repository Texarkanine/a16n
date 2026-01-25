# @a16njs/glob-hook

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

## Integration with a16n

This package is part of the a16n conversion pipeline. When converting Cursor FileRules to Claude:

1. a16n reads Cursor rules with glob patterns
2. For each rule, a16n generates:
   - A context file (`.a16n/rules/<name>.txt`)
   - A hook configuration using glob-hook
3. Claude hooks invoke glob-hook to match file patterns

## Requirements

- Node.js >= 18.0.0

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm --filter @a16njs/glob-hook test

# Build
pnpm --filter @a16njs/glob-hook build
```

## License

MIT
