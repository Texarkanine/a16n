---
sidebar_position: 1
slug: /
---

# Introduction

Welcome to the **a16n** documentation!

## What is a16n?

**a16n** (short for "a]gent customizatio[n") is a toolkit for converting AI agent customization between different AI coding tools.

## Why a16n?

Different AI coding tools have their own formats for customizing agent behavior:
- **Cursor** uses `.cursor/rules/*.mdc` files
- **Claude Code** uses `CLAUDE.md` and `.claude/settings.json`

a16n lets you:
- Convert your existing customizations when switching tools
- Maintain customizations in one format while using multiple tools
- Understand how different tools map similar concepts

## Key Features

- **Bidirectional conversion** between Cursor and Claude formats
- **Warning system** for lossy or impossible conversions
- **Metadata preservation** including file-specific rules and globs
- **Git integration** for managing output file tracking
- **Plugin architecture** for extensibility
- **Type-safe** with full TypeScript support

## Quick Start

### Using npx (no install)

```bash
# Convert Cursor rules to Claude format
npx a16n convert --from cursor --to claude

# Convert Claude rules to Cursor format  
npx a16n convert --from claude --to cursor
```

### Global Installation

```bash
npm install -g a16n

# Then use without npx
a16n convert --from cursor --to claude
```

### Preview Changes

Use `--dry-run` to see what would happen without writing files:

```bash
npx a16n convert --from cursor --to claude --dry-run
```

### Discover Without Converting

List agent customization files without converting:

```bash
npx a16n discover --from cursor
```

## Next Steps

- [CLI Reference](/cli) - Full command documentation
- [Understanding Conversions](/understanding-conversions) - How conversion mapping works
- [FAQ](/faq) - Common questions and answers

## Packages

a16n is organized as a monorepo with several packages:

| Package | Description |
|---------|-------------|
| [a16n](/cli) | CLI tool |
| [@a16njs/engine](/engine) | Core conversion engine |
| [@a16njs/models](/models) | Type definitions |
| [@a16njs/plugin-cursor](/plugin-cursor) | Cursor IDE support |
| [@a16njs/plugin-claude](/plugin-claude) | Claude Code support |
| [@a16njs/glob-hook](/glob-hook) | Glob-based hook for Claude |

## Contributing

This project is open source under the AGPL-3.0 license. Contributions are welcome!

Visit our [GitHub repository](https://github.com/Texarkanine/a16n) to get started.
