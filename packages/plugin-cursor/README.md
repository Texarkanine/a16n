# @a16n/plugin-cursor

Cursor IDE plugin for a16n. Discovers and emits Cursor rules.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16n/plugin-cursor
```

## Supported Files

### Discovery

- `.cursor/rules/*.mdc` - MDC format rules with frontmatter

> **Note:** Legacy `.cursorrules` files are not supported. Use `.cursor/rules/*.mdc` instead.
> A community plugin `a16n-plugin-cursor-legacy` could be created for legacy support if needed.

### Emission

- Creates `.cursor/rules/<name>.mdc` files with `alwaysApply: true` frontmatter

## MDC Format

Cursor uses MDC (Markdown Configuration) format with YAML frontmatter:

```markdown
---
alwaysApply: true
description: Optional description
globs: **/*.ts
---

Your rule content here.
```

### Frontmatter Fields

- `alwaysApply` - If true, rule is always active (GlobalPrompt)
- `description` - Context trigger description (AgentSkill, Phase 2)
- `globs` - File patterns that trigger the rule (FileRule, Phase 2)

## Usage

```typescript
import cursorPlugin from '@a16n/plugin-cursor';
import { A16nEngine } from '@a16n/engine';

const engine = new A16nEngine([cursorPlugin]);

// Discover Cursor rules
const result = await cursorPlugin.discover('./my-project');
console.log(`Found ${result.items.length} rules`);

// Emit to Cursor format
await cursorPlugin.emit(items, './my-project');
```

## Phase 1 Limitations

Currently only supports `alwaysApply: true` rules (GlobalPrompt type).
Support for `description` and `globs` will be added in Phase 2.

## License

MIT
