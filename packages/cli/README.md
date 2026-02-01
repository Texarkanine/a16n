# a16n

[![npm version](https://img.shields.io/npm/v/a16n.svg)](https://www.npmjs.com/package/a16n)

Agent customization portability for AI coding tools.

## Installation

```bash
# Use directly with npx (no install needed)
npx a16n convert --from cursor --to claude .

# Or install globally
npm install -g a16n
```

## Commands

### convert

Convert agent customization between tools.

```bash
a16n convert --from cursor --to claude ./my-project
a16n convert --from claude --to cursor ./my-project

# Dry run (show what would happen)
a16n convert --from cursor --to claude --dry-run .

# JSON output (for scripting)
a16n convert --from cursor --to claude --json .
```

Options:
- `-f, --from <agent>` - Source agent (required)
- `-t, --to <agent>` - Target agent (required)
- `--dry-run` - Show what would happen without writing
- `--json` - Output as JSON
- `-q, --quiet` - Suppress non-error output

### discover

List agent customization without converting.

```bash
a16n discover --from cursor .
a16n discover --from claude . --json
```

Options:
- `-f, --from <agent>` - Agent to discover (required)
- `--json` - Output as JSON

### plugins

Show available plugins.

```bash
a16n plugins
```

## Supported Agents

| Agent | Plugin | Status |
|-------|--------|--------|
| Cursor | @a16njs/plugin-cursor | ✅ Bundled |
| Claude Code | @a16njs/plugin-claude | ✅ Bundled |

## Examples

```bash
# Convert Cursor rules to Claude
a16n convert --from cursor --to claude .

# Convert Claude config to Cursor
a16n convert --from claude --to cursor .

# Preview conversion
a16n convert --from cursor --to claude --dry-run .

# List what's in a project
a16n discover --from cursor .
```

## Documentation

Full documentation available at <https://texarkanine.github.io/a16n/cli>.
