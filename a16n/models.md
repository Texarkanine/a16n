# Models Overview

> The **@a16njs/models** package defines shared TypeScript types and interfaces used across the a16n toolkit. It provides the foundation for the plugin system and the intermediate representation (IR) used during conversions.

# Models Overview

The **@a16njs/models** package defines shared TypeScript types and interfaces used across the a16n toolkit. It provides the foundation for the plugin system and the intermediate representation (IR) used during conversions.

## Installation

```bash
npm install @a16njs/models
```

## Overview

This package provides:

- **Customization types** - The taxonomy of agent configurations
- **Type guards** - Runtime type checking utilities
- **Plugin interface** - Contract for format-specific plugins
- **Warning system** - Structured conversion warnings

---

## Customization Types

a16n uses a unified taxonomy to represent agent customizations across different tools. Understanding these types is key to working with the toolkit.

### GlobalPrompt

A GlobalPrompt is always added to the agent's context in any interaction. Examples include:

- `CLAUDE.md`
- `.claude/rules/*.md` with no `paths:`
- Cursor rules with `alwaysApply: true`

### Skills

Skills are selected to be added to the agent's context *by the agent*, based on its judgement of the task at hand.

#### SimpleAgentSkill

A SimpleAgentSkill is *just* a text file with prompt contents.

Examples include:
- Cursor rules with `description: ...`
- Claude Code skills that contain only a single `SKILL.md` file

#### AgentSkillIO

The [AgentSkills.io](https://agentskills.io) standard allows bundling additional resources, including scripts, with a skill.

### FileRule

A FileRule is added to the agent's context by the agent's driver (e.g. Cursor, Claude Code, etc.) when the agent is working with specific file(s).

Examples include:
- Cursor rules with `globs: ...`
- Claude Code rules with `paths: ...`

### ManualPrompt

A ManualPrompt is added to the agent's context on-demand by the user.
They are typically invoked by the user via a slash command (e.g. `/review`, `/test`), and don't appear in the agent's context otherwise.

Examples include:
- Cursor commands in `.cursor/commands/*.md`
- Cursor rules with no `globs` or `description`, when `@mention`'d
- AgentSkills.io Skills with `disable-model-invocation: true`

Optional `description` holds authored prose from skill frontmatter when present (skills with `disable-model-invocation: true`). Command-origin prompts leave it unset; emitters synthesize `Invoke with /<promptName>` only in that case so the emitted skill remains valid.

### AgentIgnore

An AgentIgnore is a file pattern specifying files that should be ignored - not read, not written, maybe not even visible to - the agent.

Examples include:
- `.cursorignore`
- Claude Code `permissions.deny` Read rule

---

## AgentSkills.io Spec Fields

Every skill-like type — `SimpleAgentSkill`, `AgentSkillIO`, and `ManualPrompt` — carries the four optional metadata fields defined by the [AgentSkills.io](https://agentskills.io) specification, via the shared `AgentSkillSpecFields` interface.

| IR field        | Frontmatter key  | Meaning                                                    |
| --------------- | ---------------- | ---------------------------------------------------------- |
| `license`       | `license`        | SPDX identifier or free-form license text                  |
| `compatibility` | `compatibility`  | Human-readable environment requirements                    |
| `specMetadata`  | `metadata`       | Arbitrary author-supplied string key-values                |
| `allowedTools`  | `allowed-tools`  | Tools the skill is permitted to invoke                     |

`ManualPrompt` carries them too, even though it is not itself an AgentSkills.io concept: a Claude skill with `disable-model-invocation: true` is classified as a `ManualPrompt`, so leaving the fields off that type would silently discard the `allowed-tools` of exactly the skills most likely to run shell commands.

### `metadata` vs. `specMetadata`

These are different things that collided on a name:

- **`AgentCustomization.metadata`** is transient plugin bookkeeping — discovery hints, original display names, classification breadcrumbs. It is **never serialized**; it exists only for the duration of a conversion.
- **`AgentSkillSpecFields.specMetadata`** is author-written content from the skill's `metadata:` frontmatter. It **is** serialized, and it round-trips through `.a16n/` unchanged.

The IR spells the second one `specMetadata` to keep the two apart in code. On disk it is always written under the spec's key name, `metadata`.

---

## Core Concepts

### Intermediate Representation (IR)

During conversion, all customizations are normalized into a common format (IR) before being emitted to the target format. This enables tool-agnostic transformations:

```mermaid
flowchart LR
  A[Source Files] --> B["IR<br/>(AgentCustomization[])"]
  B --> C[Target Files]
```

The base `AgentCustomization` interface provides common fields (id, type, sourcePath, content, metadata), while specialized types like `FileRule` and `SimpleAgentSkill` add type-specific fields.

### Type Guards

The package provides type guard functions for runtime type checking:

```typescript
import { isFileRule } from '@a16njs/models';

function processItem(item: AgentCustomization) {
  if (isFileRule(item)) {
    console.log('Globs:', item.globs);  // TypeScript knows globs exists
  }
}
```

Available guards: 

- `isAgentIgnore`
- `isSimpleAgentSkill`
- `isAgentSkillIO`
- `isFileRule`
- `isGlobalPrompt`
- `isManualPrompt`

---

## Warning System

Conversions may produce warnings when features can't be perfectly translated:

| Warning Code | Meaning |
|--------------|---------|
| `merged` | Multiple items combined into one file |
| `approximated` | Feature translated imperfectly |
| `skipped` | Feature not supported, omitted |
| `overwritten` | Existing file replaced |
| `file-renamed` | Renamed to avoid collision |
| `boundary-crossing` | Git-ignored source → tracked output |
| `git-status-conflict` | Sources have conflicting git status |
| `version-mismatch` | IR file version is incompatible with current reader |
| `orphan-path-ref` | Content references a source-format path not in the conversion set |

Warnings help you understand what happened during conversion and whether manual adjustments are needed.

---

## Plugin Interface

Plugins implement discovery (finding customizations) and emission (writing them). The `A16nPlugin` interface defines:

- `id` / `name` - Plugin identification
- `supports` - Which customization types the plugin handles
- `discover(root)` - Find customizations in a directory tree
- `emit(models, root, options)` - Write customizations to disk

See the [Models API Reference](/models/api) for complete interface definitions, or [Plugin Development](/plugin-development) for implementation guidance.

---

## See Also

- [Models API Reference](/models/api) - Complete interface documentation
- [Engine](/engine) - How the engine uses these types
- [Plugin Development](/plugin-development) - Creating custom plugins
- [Understanding Conversions](/understanding-conversions) - The conversion taxonomy
