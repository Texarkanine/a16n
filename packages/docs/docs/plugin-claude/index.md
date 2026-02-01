---
sidebar_position: 5
---

# Claude Code Plugin Overview

The **@a16njs/plugin-claude** package implements the Claude Code format plugin for reading and writing `.claude/rules/*.md` files, `.claude/skills/*/SKILL.md` files, and `.claude/settings.json` permissions.

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
* [Claude Rules](https://docs.anthropic.com/en/docs/claude-code/memory#modular-rules-with-claude%2Frules%2F): `.claude/rules/*.md` (including subdirectories)
	* Rules without `paths:` frontmatter: GlobalPrompt
	* Rules with `paths:` frontmatter: FileRule
* [Claude Skills](https://docs.anthropic.com/en/docs/claude-code/skills): `.claude/skills/*/SKILL.md`
	* Simple Skills (single SKILL.md file only)
		* `disable-model-invocation: true`: ManualPrompt
		* others: AgentSkill
	* Complex Skills (hooks, multiple files, resources): Skipped
* [Claude Settings](https://docs.anthropic.com/en/docs/claude-code/settings): `.claude/settings.json`
	* `permissions.deny` with `Read()`: AgentIgnore
	* Other permission types: Skipped

### Emission

* GlobalPrompt: `.claude/rules/<name>.md` (individual files)
* FileRule: `.claude/rules/<name>.md` with `paths:` YAML frontmatter (native support)
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

- **GlobalPrompts** are written to individual `.claude/rules/<name>.md` files
- **FileRules** are written to `.claude/rules/<name>.md` with native `paths:` YAML frontmatter (lossless conversion using Claude's native modular rules feature)
- **AgentSkills** are written to `.claude/skills/<name>/SKILL.md`
- **ManualPrompts** are emitted as skills with `description: "Invoke with /command"` to enable slash command invocation

:::tip Native FileRule Support
As of January 2026, Claude Code natively supports glob-based file rules via the `paths:` frontmatter in `.claude/rules/*.md` files. FileRules are now converted losslessly without requiring any additional tools or hooks.
:::

---

## See Also

- [Plugin Claude API Reference](/plugin-claude/api) - Complete API documentation
- [Plugin: Cursor](/plugin-cursor) - Cursor IDE format plugin
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
