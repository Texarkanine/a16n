# @a16njs/plugin-claude

[![npm version](https://img.shields.io/npm/v/@a16njs/plugin-claude.svg)](https://www.npmjs.com/package/@a16njs/plugin-claude)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=plugin-claude)](https://codecov.io/gh/Texarkanine/a16n)

Claude Code plugin for a16n. Discovers and emits Claude configuration.

## Stability

As of `1.0.0`, the plugin's `discover`/`emit` behavior and supported-type contract are stable and follow semantic versioning: breaking changes to the public API bump the major version.

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-claude
```

## Supported Types

This plugin supports five customization types:

| Type | Claude Format | Description |
|------|---------------|-------------|
| **GlobalPrompt** | `.claude/rules/*.md` | Always-active instructions |
| **FileRule** | `.claude/rules/*.md` with `paths:` frontmatter | Glob-triggered via native paths |
| **SimpleAgentSkill** | `.claude/skills/*/SKILL.md` | Description-triggered skills |
| **AgentIgnore** | `.claude/settings.json` `permissions.deny` | Files to exclude |
| **AgentCommand** | *Emitted only* | Cursor commands become skills |

> **Note:** Claude has no dedicated command concept. AgentCommands from Cursor are emitted as skills with a description enabling `/command-name` invocation. The Claude plugin never *discovers* AgentCommands—conversion is one-way (Cursor → Claude only).

## Supported Files

### Discovery

- `CLAUDE.md` - Root Claude configuration (GlobalPrompt)
- `*/CLAUDE.md` - Nested Claude configuration files (GlobalPrompt)
- `.claude/rules/*.md` - Native Claude rules (GlobalPrompt if no `paths:`, FileRule if `paths:` present)
- `.claude/skills/*/SKILL.md` - Skills with description frontmatter (SimpleAgentSkill)
- `.claude/settings.json` - Permissions deny rules (AgentIgnore)

> **Note:** Skills with `hooks:` in their frontmatter are skipped (not supported by AgentSkills.io).
> **Note:** Only `Read()` permission denials are discovered (other types like `Bash()` or `Edit()` are ignored).

### Spec Compliance

a16n's IR is shaped after the [AgentSkills.io specification](https://agentskills.io/specification). Claude is a large superset of that spec, so a Claude-only feature is a portability hazard on ingest no matter where the skill is being converted to. Skills using one are still discovered, with their content untouched — you get one `approximated` warning naming the features whose *runtime behavior* does not survive:

| Category | Features |
|----------|----------|
| Frontmatter keys | `argument-hint:`, `arguments:`, `model:`, `effort:`, `context:`, `agent:`, `shell:`, `disallowed-tools:`, `user-invocable:` |
| Body substitutions | `$ARGUMENTS`, `` !`cmd` `` bash injection, `${CLAUDE_*}` variables, `@path` file includes |

`hooks:` is deliberately absent from that list: it is skipped outright rather than advised. Losing a substitution leaves visibly broken output, but losing a `PreToolUse` hook leaves a clean-looking skill that no longer enforces what it claims to. Restriction-removing loss fails closed; substitution-breaking loss fails open.

`paths:` and `disable-model-invocation:` are also non-spec, but a16n models them natively, so they convert without a warning.

`$1` positionals and `$name` named arguments are absent for a different reason: neither can appear in a skill that is not already warned about by `$ARGUMENTS`, `arguments:`, or `argument-hint:`. Reporting a loss is this warning's job; listing every construct in your body that depends on that loss would be linting your file. So the advisory names what will not survive, once.

Detection is otherwise conservative where Claude syntax collides with ordinary shell or prose: `@` references need path shape, so `@reviewer` and `@scope/pkg` stay silent. The tradeoff is a known false negative on extensionless references like `@src/utils`, which are lexically identical to a scoped package name.

### Emission

- **GlobalPrompt** → `.claude/rules/<name>.md` (individual files)
- **FileRule** → `.claude/rules/<name>.md` with `paths:` YAML frontmatter
- **SimpleAgentSkill** → `.claude/skills/<name>/SKILL.md` with description frontmatter
- **AgentIgnore** → `.claude/settings.json` with `permissions.deny` Read rules
- **AgentCommand** → `.claude/skills/<commandName>/SKILL.md` with `Invoke with /command` description

## File Formats

### .claude/rules/*.md (GlobalPrompt)

Rules without `paths:` frontmatter apply to all files:

```markdown
## From: .cursor/rules/general.mdc

Your instructions for Claude here.
```

### .claude/rules/*.md (FileRule)

Rules with `paths:` frontmatter apply only when working with matching files:

```markdown
---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

## From: .cursor/rules/react.mdc

Use functional components with hooks.
```

### SKILL.md (SimpleAgentSkill)

```markdown
---
description: Testing best practices
---

Write unit tests first.
Aim for 80% code coverage.
```

## Usage

```typescript
import claudePlugin from '@a16njs/plugin-claude';
import { A16nEngine } from '@a16njs/engine';

const engine = new A16nEngine([claudePlugin]);

// Discover Claude configuration
const result = await claudePlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

// Emit to Claude format
await claudePlugin.emit(result.items, './my-project');
```

## Documentation

Full documentation available at <https://texarkanine.github.io/a16n/plugin-claude>.
