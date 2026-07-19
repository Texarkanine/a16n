# Cursor Plugin Overview

> The **@a16njs/plugin-cursor** package implements agent customization awareness for [Cursor](https://cursor.com/).

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
	* **Simple Skills** (only SKILL.md, no ride-along files):
		* `disable-model-invocation: true` → [ManualPrompt](/models#manualprompt)
		* `description:` present → [SimpleAgentSkill](/models#simpleagentskill)
		* Neither → Skipped w/ Warning
	* **Complex Skills** (SKILL.md + 1 or more additional files in [optional directories](https://agentskills.io/specification#optional-directories)):
		* `description:` present → [AgentSkillIO](/models#agentskillio)
		* `description:` missing → Skipped w/ Warning
* [Cursor Commands](https://cursor.com/docs/context/commands): `.cursor/commands/**/*.md`
	* Simple Commands: [ManualPrompt](/models#manualprompt)
	* Complex Commands (placeholders, $ARGUMENTS, $1, etc.): Skipped
* [Cursor Ignore](https://cursor.com/docs/context/ignore-files): `.cursorignore`
	* [AgentIgnore](/models#agentignore)

### Emission

* [GlobalPrompt](/models#globalprompt): Cursor Rule with `alwaysApply: true`
* [FileRule](/models#filerule): Cursor Rule with `globs: ...`
* [SimpleAgentSkill](/models#simpleagentskill): Cursor Skill
* [AgentSkillIO](/models#agentskillio): Cursor Skill directory (SKILL.md **and** all ride-along files under `scripts/`, `references/`, `assets/`, etc.)
* [AgentIgnore](/models#agentignore): `.cursorignore` entry
* [ManualPrompt](/models#manualprompt): Cursor Agent Skill (`.cursor/skills/<name>/SKILL.md` with `disable-model-invocation: true`; legacy Commands discovery supported but non-roundtrip)

---

## Rule Classification Priority

When Cursor Rule frontmatter contains multiple keys, rules are classified by first match:

1. **`alwaysApply: true`** → GlobalPrompt
2. **`globs:` present** → FileRule
3. **`description:` present** → SimpleAgentSkill
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
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
