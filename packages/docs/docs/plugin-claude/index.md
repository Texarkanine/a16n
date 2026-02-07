---
sidebar_position: 5
---

# Claude Code Plugin Overview

The **@a16njs/plugin-claude** package implements agent customization awareness for [Claude Code](https://code.claude.com/).

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-claude
```

---

## Supported Files

### Discovery

* [CLAUDE.md](https://docs.anthropic.com/en/docs/claude-code/memory): `CLAUDE.md`, `*/CLAUDE.md`
	* [GlobalPrompt](/models#globalprompt)
* [Claude Rules](https://docs.anthropic.com/en/docs/claude-code/memory#modular-rules-with-claude%2Frules%2F): `.claude/rules/*.md` (including subdirectories)
	* Rules without `paths:` frontmatter: [GlobalPrompt](/models#globalprompt)
	* Rules with `paths:` frontmatter: [FileRule](/models#filerule)
* [Claude Skills](https://docs.anthropic.com/en/docs/claude-code/skills): `.claude/skills/*/SKILL.md`
	* Simple Skills (single SKILL.md file only)
		* `disable-model-invocation: true`: [ManualPrompt](/models#manualprompt)
		* others: [SimpleAgentSkill](/models#simpleagentskill)
	* Complex Skills (hooks, multiple files, resources): Skipped w/ Warning
* [Claude Settings](https://docs.anthropic.com/en/docs/claude-code/settings): `.claude/settings.json`
	* `permissions.deny` with `Read()`: [AgentIgnore](/models#agentignore)
	* Other permission types: Skipped

### Emission

* [GlobalPrompt](/models#globalprompt): `.claude/rules/<name>.md` (individual files)
* [FileRule](/models#filerule): `.claude/rules/<name>.md` with `paths:` YAML frontmatter (native support)
* [SimpleAgentSkill](/models#simpleagentskill): `.claude/skills/<name>/SKILL.md`
* [AgentIgnore](/models#agentignore): `.claude/settings.json` with `permissions.deny`
* [ManualPrompt](/models#manualprompt): `.claude/skills/<name>/SKILL.md` with `enable-model-invocation: false`

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

## See Also

- [Plugin Claude API Reference](/plugin-claude/api) - Complete API documentation
- [Plugin: Cursor](/plugin-cursor) - Cursor IDE format plugin
- [Plugin: a16n IR](/plugin-a16n) - Intermediate representation format plugin
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
