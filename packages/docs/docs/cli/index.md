---
sidebar_position: 1
---

# CLI

The **a16n CLI** provides command-line tools for converting AI agent configuration files between Cursor and Claude formats.

## Installation

```bash
npm install -g a16n
```

## Usage

### Cursor to Claude

Convert Cursor IDE configuration to Claude Code format:

```bash
a16n cursor-to-claude --source .cursor --target ./
```

### Claude to Cursor

Convert Claude Code configuration to Cursor IDE format:

```bash
a16n claude-to-cursor --source ./CLAUDE.md --target .cursor
```

## Command Options

_(Detailed command options and flags will be documented here)_

## Examples

_(Common usage examples will be provided here)_

## See Also

- [Engine](/engine) - Core conversion engine
