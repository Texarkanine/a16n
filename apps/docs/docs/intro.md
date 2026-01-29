---
sidebar_position: 1
---

# Introduction

Welcome to the **a16n** documentation!

## What is a16n?

**a16n** (short for "align") is a toolkit for translating AI agent configuration files between different IDE formats. It enables seamless conversion between:

- **Cursor IDE** (`.cursor/rules/*.mdc`, `.cursorignore`)
- **Claude Code** (`CLAUDE.md`, `.claude/settings.json`)

## Key Features

- 🔄 **Bidirectional conversion** between Cursor and Claude formats
- 📝 **Preserves metadata** including file-specific rules and ignore patterns
- 🎯 **CLI tool** for easy integration into workflows
- 🧩 **Plugin architecture** for extensibility
- 🔍 **Type-safe** with full TypeScript support

## Quick Start

Install via npm:

```bash
npm install -g a16n
```

Convert Cursor rules to Claude format:

```bash
a16n cursor-to-claude --source .cursor --target ./
```

Convert Claude rules to Cursor format:

```bash
a16n claude-to-cursor --source ./CLAUDE.md --target .cursor
```

## Package Overview

| Package | Description |
|---------|-------------|
| [`a16n` (CLI)](/docs/cli) | Command-line interface for conversion operations |
| [`@a16njs/engine`](/docs/engine) | Core conversion engine |
| [`@a16njs/models`](/docs/models) | Shared types and interfaces |
| [`@a16njs/plugin-cursor`](/docs/plugin-cursor) | Cursor IDE format plugin |
| [`@a16njs/plugin-claude`](/docs/plugin-claude) | Claude Code format plugin |
| [`@a16njs/glob-hook`](/docs/glob-hook) | Glob pattern hook system |

## Next Steps

- Explore the [CLI documentation](/docs/cli) to learn about available commands
- Read about the [architecture](/docs/engine) to understand the plugin system

## Contributing

This project is open source. Contributions are welcome!

Visit our [GitHub repository](https://github.com/your-org/a16n) to get started.
