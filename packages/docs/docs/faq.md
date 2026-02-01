---
title: FAQ
description: Frequently asked questions about a16n
---

# Frequently Asked Questions

## General

### What is a16n?

a16n (short for "agent customization") is a tool for converting AI coding agent customization between different toolchains, such as Claude Code and Cursor. It lets you maintain your AI assistant preferences in one format and convert them to work with multiple tools.

### What tools are supported?

Currently supported:
- **Cursor** - The AI-first code editor
- **Claude Code** - Anthropic's AI coding assistant

Other toolchains may be supported via third-party plugins. See [Plugin Development](/plugin-development) for more information.

### Can I preview changes before writing?

Yes, use the `--dry-run` flag:

```bash
npx a16n convert --from cursor --to claude --dry-run
```

### What happens to my source files?

By default, source files are preserved. Use `--delete-source` to remove them after conversion:

```bash
npx a16n convert --from cursor --to claude --delete-source
```

### Can I use this in CI?

Yes. Use `--json` for machine-readable output and check the exit code (non-zero if errors occurred):

```bash
a16n convert --from cursor --to claude . --json || echo "Conversion failed"
```

## Conversions

### Will converting back and forth preserve everything?

No. Some conversions are lossy. For example, three separate Cursor rules become one `CLAUDE.md` file. Converting back produces one Cursor rule, not three. a16n warns you when this happens.

See [Understanding Conversions](/understanding-conversions) for details.

### What if my target tool doesn't support a feature?

a16n skips unsupported features and warns you. Your conversion still completes with everything that can be translated.

## Troubleshooting

### Why are some files not converted?

Some files may be:
- Not recognized as agent customization
- In an unsupported format
- Already in the target format
- Using features that can't be converted

Use `--verbose` to see detailed output:

```bash
npx a16n convert --from cursor --to claude --verbose
```

### How do I report a bug?

Please open an issue on [GitHub](https://github.com/Texarkanine/a16n/issues).

## Development

### How do I contribute?

See the [GitHub repository](https://github.com/Texarkanine/a16n) for contribution guidelines.

### How do I add support for a new tool?

Write a plugin! See [Plugin Development](/plugin-development). If it's useful to others, publish it to npm as `a16n-plugin-<name>`.

### Can I build my own plugin?

Yes, but the API is still in development. See [Plugin Development](/plugin-development) for details.
