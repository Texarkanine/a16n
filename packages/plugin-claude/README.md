# @a16n/plugin-claude

Claude Code plugin for a16n. Discovers and emits Claude configuration.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16n/plugin-claude
```

## Supported Files

### Discovery

- `CLAUDE.md` - Root Claude configuration
- `*/CLAUDE.md` - Nested Claude configuration files

### Emission

- Creates `CLAUDE.md` at project root
- Merges multiple GlobalPrompts into single file with section headers

## CLAUDE.md Format

Claude uses plain Markdown files for configuration:

```markdown
# Project Guidelines

Your instructions for Claude here.
```

Nested `CLAUDE.md` files provide directory-specific context.

## Usage

```typescript
import claudePlugin from '@a16n/plugin-claude';
import { A16nEngine } from '@a16n/engine';

const engine = new A16nEngine([claudePlugin]);

// Discover Claude configuration
const result = await claudePlugin.discover('./my-project');
console.log(`Found ${result.items.length} CLAUDE.md files`);

// Emit to Claude format
await claudePlugin.emit(items, './my-project');
```

## Conversion Behavior

When emitting multiple GlobalPrompts, they are merged into a single `CLAUDE.md`:

```markdown
## From: .cursor/rules/style.mdc

Style guidelines...

---

## From: .cursor/rules/testing.mdc

Testing guidelines...
```

A `Merged` warning is emitted when this occurs.

## License

MIT
