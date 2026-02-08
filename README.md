# a16n

[![npm version](https://img.shields.io/npm/v/a16n.svg)](https://www.npmjs.com/package/a16n)

**Agent customization portability for AI coding tools.**

Convert your Cursor rules to Claude Code config, or vice versa. Take your agent customization anywhere.

## Quick Start

```bash
# Convert Cursor rules to Claude Code
npx a16n convert --from cursor --to claude

# Convert Claude Code to Cursor
npx a16n convert --from claude --to cursor

# Preview changes (dry run)
npx a16n convert --from cursor --to claude --dry-run

# Read from one directory, write to another
npx a16n convert --from cursor --to claude --from-dir ./proj-a --to-dir ./proj-b
```

## Installation

```bash
# Use directly with npx (no install needed)
npx a16n convert --from cursor --to claude

# Or install globally
npm install -g a16n
```

## Supported Tools

| Tool | Status |
|------|--------|
| Cursor | ✅ Supported |
| Claude Code | ✅ Supported |

## Documentation

Full documentation is available at <https://texarkanine.github.io/a16n/>:

- [CLI Reference](https://texarkanine.github.io/a16n/cli/reference) - Complete command documentation
- [Understanding Conversions](https://texarkanine.github.io/a16n/understanding-conversions) - How conversion mapping works
- [FAQ](https://texarkanine.github.io/a16n/faq) - Common questions
- [Plugin Development](https://texarkanine.github.io/a16n/plugin-development) - Creating plugins (API unstable)

## Packages

| Package | Description |
|---------|-------------|
| [a16n](https://www.npmjs.com/package/a16n) | CLI tool |
| [@a16njs/engine](https://www.npmjs.com/package/@a16njs/engine) | Core conversion engine |
| [@a16njs/models](https://www.npmjs.com/package/@a16njs/models) | Type definitions |
| [@a16njs/plugin-cursor](https://www.npmjs.com/package/@a16njs/plugin-cursor) | Cursor IDE support |
| [@a16njs/plugin-claude](https://www.npmjs.com/package/@a16njs/plugin-claude) | Claude Code support |
| [@a16njs/glob-hook](https://www.npmjs.com/package/@a16njs/glob-hook) | Helper CLI for custom glob-based hooks (optional) |

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

<p align="center">
  <i>a16n: Take your agent customization anywhere.</i>
</p>
