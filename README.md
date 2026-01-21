# a16n

**Agent customization portability for AI coding tools.**

Convert your Cursor rules to Claude Code config, or vice versa. Take your agent customization anywhere.

[![npm version](https://img.shields.io/npm/v/a16n.svg)](https://www.npmjs.com/package/a16n)

## Why a16n?

You've spent time crafting the perfect rules for your AI coding assistant. Then you want to try a different tool, and you're back to square one.

a16n solves this:

```bash
npx a16n convert --from cursor --to claude .
```

Your Cursor rules become Claude Code configuration. Done.

## Installation

```bash
# Use directly with npx (no install needed)
npx a16n convert --from cursor --to claude .

# Or install globally
npm install -g a16n

# Or add to your project
npm install --save-dev a16n
```

## Quick Start

### Convert Cursor → Claude Code

```bash
a16n convert --from cursor --to claude ./my-project
```

This reads:
- `.cursor/rules/*.mdc`

And writes:
- `CLAUDE.md`

### Convert Claude Code → Cursor

```bash
a16n convert --from claude --to cursor ./my-project
```

This reads:
- `CLAUDE.md` (including nested ones)

And writes:
- `.cursor/rules/*.mdc`

### See What Would Happen (Dry Run)

```bash
a16n convert --from cursor --to claude --dry-run .
```

### Discover Without Converting

```bash
a16n discover --from cursor .
```

Lists all agent customization found, useful for debugging.

## Supported Tools

| Tool | Plugin | Status |
|------|--------|--------|
| Cursor | `@a16n/plugin-cursor` | ✅ Bundled |
| Claude Code | `@a16n/plugin-claude` | ✅ Bundled |
| Codex | Community | 🔌 [See plugins](#community-plugins) |
| Windsurf | Community | 🔌 [See plugins](#community-plugins) |

## Understanding Conversions

Different tools have different capabilities. a16n handles this transparently.

### What Translates Cleanly

| Concept | Cursor | Claude Code |
|---------|--------|-------------|
| Global prompts | `alwaysApply: true` rules | `CLAUDE.md` |
| File-specific rules | `globs: [...]` rules | Tool hooks |
| Context-triggered | `description: ...` rules | Skills |

### What Doesn't Translate

| Feature | From | To | Behavior |
|---------|------|-----|----------|
| `.cursorignore` | Cursor | Claude | ⚠️ Skipped (no equivalent) |
| Multiple `alwaysApply` rules | Cursor | Claude | ⚠️ Merged into one file |

a16n always warns you when conversions are lossy or irreversible.

### Example Warning Output

```
⚠ Merged 3 Cursor rules with alwaysApply:true into single CLAUDE.md
  Sources: general.mdc, style.mdc, testing.mdc
  Note: Converting back will produce 1 file, not 3

⚠ Skipped .cursorignore (Claude Code has no equivalent)
  Patterns: node_modules/**, dist/**

✓ Wrote CLAUDE.md (3 sections, 127 lines)
✓ Conversion complete: 4 items processed, 2 warnings
```

## CLI Reference

```
a16n <command> [options]

Commands:
  convert     Convert agent customization between tools
  discover    List agent customization without converting
  plugins     Show available plugins

Convert Options:
  --from, -f    Source agent (required)
  --to, -t      Target agent (required)
  --dry-run     Show what would happen without writing
  --json        Output as JSON (for scripting)
  --quiet       Suppress non-error output

Examples:
  a16n convert --from cursor --to claude .
  a16n convert -f claude -t cursor ./project --dry-run
  a16n discover --from cursor . --json
  a16n plugins
```

## Community Plugins

a16n automatically discovers plugins from npm. Install any `@a16n/plugin-*` or `a16n-plugin-*` package:

```bash
npm install -g a16n-plugin-codex
a16n plugins  # Now shows 'codex'
a16n convert --from cursor --to codex .
```

### Available Community Plugins

- [`a16n-plugin-codex`](https://github.com/example/a16n-plugin-codex) — OpenAI Codex CLI support
- [`a16n-plugin-windsurf`](https://github.com/example/a16n-plugin-windsurf) — Windsurf IDE support
- [`a16n-plugin-continue`](https://github.com/example/a16n-plugin-continue) — Continue.dev support

*Want to add your plugin? Open a PR to update this list.*

## Writing Plugins

Plugins implement a simple interface:

```typescript
import { A16nPlugin, CustomizationType } from '@a16n/models';

const myPlugin: A16nPlugin = {
  id: 'my-agent',
  name: 'My Agent',
  supports: [CustomizationType.GlobalPrompt, CustomizationType.FileRule],
  
  async discover(root: string) {
    // Find and parse your agent's config files
    // Return { items: [...], warnings: [...] }
  },
  
  async emit(models, root) {
    // Write models to disk in your agent's format
    // Return { written: [...], warnings: [...], unsupported: [...] }
  }
};

export default myPlugin;
```

See the [Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT.md) for details.

## Programmatic API

```typescript
import { A16nEngine } from '@a16n/engine';
import cursorPlugin from '@a16n/plugin-cursor';
import claudePlugin from '@a16n/plugin-claude';

const engine = new A16nEngine([cursorPlugin, claudePlugin]);

// Convert
const result = await engine.convert({
  source: 'cursor',
  target: 'claude',
  root: './my-project',
});

console.log(`Wrote ${result.written.length} files`);
console.log(`Warnings: ${result.warnings.length}`);

// Discover only
const discovered = await engine.discover('cursor', './my-project');
console.log(`Found ${discovered.items.length} customizations`);
```

## FAQ

**Q: Will converting back and forth preserve everything?**

No. Some conversions are lossy. For example, three separate Cursor rules become one `CLAUDE.md` file. Converting back produces one Cursor rule, not three. a16n warns you when this happens.

**Q: What if my target tool doesn't support a feature?**

a16n skips unsupported features and warns you. Your conversion still completes with everything that can be translated.

**Q: Can I use this in CI?**

Yes. Use `--json` for machine-readable output and check the exit code (non-zero if errors occurred).

```bash
a16n convert --from cursor --to claude . --json || echo "Conversion failed"
```

**Q: How do I add support for a new tool?**

Write a plugin! See [Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT.md). If it's useful to others, publish it to npm as `a16n-plugin-<name>`.

**Q: Why "a16n"?**

It's "agent customization" shortened like "i18n" (internationalization) and "l10n" (localization). Count the letters between 'a' and 'n' in "agentcustomizatio**n**" — there are 16.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

- 🐛 **Bug reports**: Open an issue with reproduction steps
- 💡 **Feature requests**: Open an issue describing the use case
- 🔌 **New plugins**: Publish to npm, then PR to add to the community list
- 📖 **Documentation**: PRs welcome for typos, clarifications, examples

## License

MIT © [Your Name]

---

<p align="center">
  <i>a16n: Take your agent customization anywhere.</i>
</p>
