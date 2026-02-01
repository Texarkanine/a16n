---
sidebar_position: 5
---

# Claude Code Plugin Overview

The **@a16njs/plugin-claude** package implements the Claude Code format plugin for reading and writing `CLAUDE.md` files, `.claude/skills/*/SKILL.md` files, and `.claude/settings.json` permissions.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-claude
```

---

## Supported Files

### Discovery

* [CLAUDE.md](https://docs.anthropic.com/en/docs/claude-code/memory): `CLAUDE.md`, `*/CLAUDE.md`
	* GlobalPrompt
* [Claude Skills](https://docs.anthropic.com/en/docs/claude-code/skills): `.claude/skills/*/SKILL.md`
	* Simple Skills (single SKILL.md file only)
		* `disable-model-invocation: true`: ManualPrompt
		* others: AgentSkill
	* Complex Skills (hooks, multiple files, resources): Skipped
* [Claude Settings](https://docs.anthropic.com/en/docs/claude-code/settings): `.claude/settings.json`
	* `permissions.deny` with `Read()`: AgentIgnore
	* Other permission types: Skipped

### Emission

* GlobalPrompt: `CLAUDE.md` (merged with section headers)
* FileRule: `.a16n/rules/<name>.txt` + `.claude/settings.local.json` hook
* AgentSkill: `.claude/skills/<name>/SKILL.md`
* AgentIgnore: `.claude/settings.json` with `permissions.deny`
* ManualPrompt: `.claude/skills/<name>/SKILL.md` with `enable-model-invocation: false`

---

## Programmatic Usage

```typescript
import claudePlugin from '@a16njs/plugin-claude';
import { A16nEngine } from '@a16njs/engine';

// Create engine with Claude plugin
const engine = new A16nEngine([claudePlugin]);

// Discover Claude configuration
const result = await claudePlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}

// Emit to Claude format
const items = [/* AgentCustomization items */];
const emitResult = await claudePlugin.emit(items, './my-project');
console.log(`Wrote ${emitResult.written.length} files`);
```

### Dry Run

```typescript
// Calculate what would be written without writing
const emitResult = await claudePlugin.emit(items, './my-project', {
  dryRun: true,
});

for (const file of emitResult.written) {
  console.log(`Would write: ${file.path}`);
}
```

---

## API Reference

For complete plugin API details, see the [Plugin Claude API Reference](/plugin-claude/api).

---

## Emission Behavior

- **GlobalPrompts** are merged into a single `CLAUDE.md` with section headers (emits "Merged" warning)
- **FileRules** create `.a16n/rules/*.txt` content files and `.claude/settings.local.json` hook configuration (emits "Approximated" warning)
- **AgentSkills** are written to `.claude/skills/<name>/SKILL.md`
- **ManualPrompts** are emitted as skills with `description: "Invoke with /command"` to enable slash command invocation

---

## See Also

- [Plugin Claude API Reference](/plugin-claude/api) - Complete API documentation
- [Plugin: Cursor](/plugin-cursor) - Cursor IDE format plugin
- [Glob Hook](/glob-hook) - File pattern matching for hooks
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
