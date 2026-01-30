---
sidebar_position: 1
slug: /
---

# Introduction

Welcome to the **a16n** documentation!

## What is a16n?

**a16n** (short for "agent customization") is a toolkit for translating AI agent configuration files between different tools' formats.

## Key Features

- 🔄 **Bidirectional conversion** between Cursor and Claude formats
	- Does its best to warn & inform you about lossy or impossible conversions
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

## Next Steps

- Explore the [CLI documentation](/cli) to learn about available commands
- Read about the [architecture](/engine) to understand the plugin system

## Contributing

This project is open source. Contributions are welcome!

Visit our [GitHub repository](https://github.com/Texarkanine/a16n) to get started.
