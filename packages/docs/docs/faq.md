---
title: FAQ
description: Frequently asked questions about a16n
---

# Frequently Asked Questions

## General

### What is a16n?

a16n (short for "a]gent customizatio[n") is a tool for converting agent customization between different AI coding tools. It lets you maintain your AI assistant preferences in one format and convert them to work with multiple tools.

### Why "a16n"?

It's "agent customization" shortened like "i18n" (internationalization) and "l10n" (localization). Count the letters between 'a' and 'n' in "agentcustomizatio**n**" — there are 16.

### What tools are supported?

Currently supported:
- **Cursor** - The AI-first code editor
- **Claude Code** - Anthropic's AI coding assistant

### Is a16n free?

Yes, a16n is open source and free to use under the AGPL-3.0 license.

## Usage

### How do I convert from Cursor to Claude?

```bash
npx a16n convert --from cursor --to claude
```

See the [CLI Reference](/cli/reference) for all options.

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

### How do I handle git-ignored files?

Use the `--gitignore-output-with` flag:

- `none` - Don't manage git status (default)
- `ignore` - Add to `.gitignore`
- `exclude` - Add to `.git/info/exclude`
- `match` - Mirror source file git status
- `hook` - Add to pre-commit hook

Example:

```bash
npx a16n convert --from cursor --to claude --gitignore-output-with match
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
