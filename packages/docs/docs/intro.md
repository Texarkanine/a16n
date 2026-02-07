---
sidebar_position: 1
slug: /
---

# Introduction

**a16n** (short for "agent customization") is a toolkit for converting AI agent customization between different AI coding tools.

## Why a16n?

Different AI coding tools have their own formats for customizing agent behavior:

- **Cursor** uses `.cursor/rules/*.mdc` files
- **Claude Code** uses `CLAUDE.md` and `.claude/settings.json`
- Many toolchains understand the [AgentSkills.io](https://agentskills.io) format.

a16n lets you:
- Convert your existing customizations when switching tools
- Maintain customizations in one format while distributing to multiple tools
- Understand how different tools map similar concepts

## Key Features

- **Warning system** for lossy or impossible conversions
- **Git integration** for managing output file tracking
- **Plugin architecture** for extensibility
- **API & CLI** - use it in scripts or integrate it into your own tools

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
| [@a16njs/plugin-a16n](/plugin-a16n) | a16n IR format (hub for cross-format conversion) |
| [@a16njs/glob-hook](/glob-hook) | Helper CLI for custom glob-based hooks |

## Contributing

This project is open source & contributions are welcome!

Visit our [GitHub repository](https://github.com/Texarkanine/a16n) to get started.
