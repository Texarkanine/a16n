---
sidebar_position: 7
---

# AGENTS.md Plugin Overview

The **@a16njs/plugin-agentsmd** package implements agent customization awareness for the [AGENTS.md](https://agents.md/) standard — the cross-tool "README for agents" stewarded by the Agentic AI Foundation.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-agentsmd
```

---

## Supported Files

### Discovery

* [AGENTS.md](https://agents.md/): `AGENTS.md` at the repository root
	* [GlobalPrompt](/models#globalprompt)
* Nested `AGENTS.md` at any directory depth (e.g. `packages/web/AGENTS.md`)
	* [FileRule](/models#filerule) with `globs: ['<dir>/**']`

Per the AGENTS.md standard, a nested AGENTS.md provides instructions scoped to its subtree ("the closest AGENTS.md wins"). a16n encodes that scoping as a directory-shaped glob, which converts into native path-scoped rules in other tools:

* Cursor: `.cursor/rules/<dir>/AGENTSMD.mdc` with `globs: <dir>/**`
* Claude Code: `.claude/rules/<dir>/AGENTSMD.md` with `paths:` frontmatter

Discovery skips dot-directories (`.git`, `.cursor`, ...) and `node_modules`.

### Emission

* [GlobalPrompt](/models#globalprompt): root `AGENTS.md`
	* Multiple GlobalPrompts are concatenated into the single root file, with a `merged` warning
	* GlobalPrompts discovered from *nested* `CLAUDE.md` files keep their directory: `src/CLAUDE.md` → `src/AGENTS.md`
* [FileRule](/models#filerule): `<dir>/AGENTS.md` — **only** when the rule's globs are a single directory-shaped pattern (`<dir>/**` or `<dir>/**/*`)
	* Any other glob shape cannot be represented in AGENTS.md → Skipped w/ Warning
* All other types ([SimpleAgentSkill](/models#simpleagentskill), [AgentSkillIO](/models#agentskillio), [ManualPrompt](/models#manualprompt), [AgentIgnore](/models#agentignore)): Unsupported

:::warning Lossy conversion

AGENTS.md is plain markdown — no frontmatter, globs, skills, commands, or ignore rules. Converting a rich configuration *into* AGENTS.md discards everything that cannot be expressed as always-on or directory-scoped prose, and a16n will tell you about each loss through its standard warnings. Converting *out of* AGENTS.md is lossless.

:::

Emission deterministically overwrites target files: output depends only on the converted items, so repeated conversions converge instead of accumulating. Replacing a pre-existing `AGENTS.md` whose content differs produces an `overwritten` warning.

When converting *out of* AGENTS.md into Cursor or Claude rules, a16n rewrites the rule stem `AGENTS` to `AGENTSMD` so rule files do not collide with magic `AGENTS.md` behavior in harnesses that treat that basename specially. This means AGENTS.md inputs become `AGENTSMD.mdc` (Cursor) or `AGENTSMD.md` (Claude). If a file already exists at that emitted path, normal deterministic-overwrite behavior applies for that target format.

---

## Programmatic Usage

```typescript
import agentsmdPlugin from '@a16njs/plugin-agentsmd';
import { A16nEngine } from '@a16njs/engine';

// Create engine with the AGENTS.md plugin
const engine = new A16nEngine([agentsmdPlugin]);

// Discover AGENTS.md files
const result = await agentsmdPlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}

// Emit to AGENTS.md format
const items = [/* AgentCustomization items */];
const emitResult = await agentsmdPlugin.emit(items, './my-project');
console.log(`Wrote ${emitResult.written.length} files`);
```

### Dry Run

```typescript
// Calculate what would be written without writing
const emitResult = await agentsmdPlugin.emit(items, './my-project', {
  dryRun: true,
});

for (const file of emitResult.written) {
  console.log(`Would write: ${file.path}`);
}
```

---

## API Reference

For complete plugin API details, see the [Plugin AGENTS.md API Reference](/plugin-agentsmd/api).

---

## See Also

- [Plugin AGENTS.md API Reference](/plugin-agentsmd/api) - Complete API documentation
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
