# @a16njs/plugin-agentsmd

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-agentsmd.svg)](https://www.npmjs.com/package/@a16njs/plugin-agentsmd)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-agentsmd)](https://codecov.io/gh/Texarkanine/a16n)

[AGENTS.md](https://agents.md/) plugin for a16n. Discovers and emits AGENTS.md files at any directory depth.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-agentsmd
```

## Supported Types

| Type | AGENTS.md Format | Description |
|------|------------------|-------------|
| **GlobalPrompt** | root `AGENTS.md` | Always-active instructions |
| **FileRule** | `<dir>/AGENTS.md` | Directory-scoped instructions (directory-shaped globs only) |

AGENTS.md is plain markdown with no frontmatter, globs, skills, commands, or ignore rules, so **converting into AGENTS.md is lossy** for everything else:

- FileRules whose globs are not directory-shaped (e.g. `*.ts`) are skipped with a warning
- Skills, manual prompts, and agent-ignore rules are reported as unsupported

Converting *out of* AGENTS.md is lossless.

## Supported Files

### Discovery

- `AGENTS.md` — root instructions (GlobalPrompt)
- `<dir>/AGENTS.md` — nested instructions at any depth (FileRule with `globs: ['<dir>/**']`)

Per the [AGENTS.md standard](https://agents.md/), a nested AGENTS.md provides instructions scoped to its subtree. a16n encodes that scoping as a directory-shaped glob so it converts into native path-scoped rules:

- Cursor: `.cursor/rules/<dir>/AGENTSMD.mdc` with `globs: <dir>/**`
- Claude Code: `.claude/rules/<dir>/AGENTSMD.md` with `paths:` frontmatter

Discovery skips dot-directories and `node_modules`.

### Emission

- **GlobalPrompt** → root `AGENTS.md` (multiple prompts are concatenated, with a `merged` warning)
- **GlobalPrompt** discovered from a nested `CLAUDE.md` → `<same-dir>/AGENTS.md`
- **FileRule** with a single directory-shaped glob (`<dir>/**` or `<dir>/**/*`) → `<dir>/AGENTS.md`
- Everything else → warning or unsupported (see above)

Emission deterministically overwrites target files (output depends only on the converted items, so repeated conversions converge). Replacing a pre-existing `AGENTS.md` whose content differs produces an `overwritten` warning.

When converting AGENTS.md into Cursor/Claude rules, a16n emits `AGENTSMD.*` rule filenames. See the plugin docs for rationale and collision behavior details: <https://texarkanine.github.io/a16n/plugin-agentsmd>.

## Usage

```typescript
import agentsmdPlugin from '@a16njs/plugin-agentsmd';
import { A16nEngine } from '@a16njs/engine';

const engine = new A16nEngine([agentsmdPlugin]);

// Discover AGENTS.md files
const result = await agentsmdPlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

// Emit to AGENTS.md format
await agentsmdPlugin.emit(result.items, './my-project');
```

## Documentation

Full documentation available at <https://texarkanine.github.io/a16n/plugin-agentsmd>.
