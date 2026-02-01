---
sidebar_position: 4
---

# Cursor Plugin Overview

The **@a16njs/plugin-cursor** package implements agent customization awareness for [Cursor](https://cursor.com/).

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-cursor
```

---

## Supported Files

### Discovery

* [Cursor Rules](https://cursor.com/docs/context/rules): `.cursor/rules/**/*.mdc`
	* `alwaysApply: true`: [GlobalPrompt](/models#globalprompt)
	* `globs: ...`: FileRule
	* `description: "..."`: [SimpleAgentSkill](/models#simpleagentskill)
* [Cursor Skills](https://cursor.com/docs/context/skills): `.cursor/skills/**/*.md`
	* Simple Skills
		* `disable-model-invocation: true`: [ManualPrompt](/models#manualprompt)
		* others: [SimpleAgentSkill](/models#simpleagentskill)
	* Complex Skills (more than one file): Skipped
* [Cursor Commands](https://cursor.com/docs/context/commands): `.cursor/commands/**/*.md`
	* Simple Commands: [ManualPrompt](/models#manualprompt)
	* Complex Commands (placeholders, $ARGUMENTS, $1, etc.): Skipped
* [Cursor Ignore](https://cursor.com/docs/context/ignore-files): `.cursorignore`
	* [AgentIgnore](/models#agentignore)

### Emission

* [GlobalPrompt](/models#globalprompt): Cursor Rule with `alwaysApply: true`
* [FileRule](/models#filerule): Cursor Rule with `globs: ...`
* [SimpleAgentSkill](/models#simpleagentskill): Cursor Skill
* [AgentIgnore](/models#agentignore): `.cursorignore` entry
* [ManualPrompt](/models#manualprompt): Cursor Command

---

## Rule Classification Priority

When Cursor Rule frontmatter contains multiple keys, rules are classified by first match:

1. **`alwaysApply: true`** → GlobalPrompt
2. **`globs:` present** → FileRule
3. **`description:` present** → AgentSkill
4. **No frontmatter** → ManualPrompt (fallback)

---

## Programmatic Usage

```typescript
import cursorPlugin from '@a16njs/plugin-cursor';
import { A16nEngine } from '@a16njs/engine';

// Create engine with Cursor plugin
const engine = new A16nEngine([cursorPlugin]);

// Discover Cursor customizations
const result = await cursorPlugin.discover('./my-project');
console.log(`Found ${result.items.length} rules`);

for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}

// Emit to Cursor format
const items = [/* AgentCustomization items */];
const emitResult = await cursorPlugin.emit(items, './my-project');
console.log(`Wrote ${emitResult.written.length} files`);
```

### Dry Run

```typescript
// Calculate what would be written without writing
const emitResult = await cursorPlugin.emit(items, './my-project', {
  dryRun: true,
});

for (const file of emitResult.written) {
  console.log(`Would write: ${file.path}`);
}
```

---

## API Reference

For complete plugin API details, see the [Plugin Cursor API Reference](/plugin-cursor/api).

---

## See Also

- [Plugin Cursor API Reference](/plugin-cursor/api) - Complete API documentation
- [Plugin: Claude](/plugin-claude) - Claude Code format plugin
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
