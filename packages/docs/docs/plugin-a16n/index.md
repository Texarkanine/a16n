---
sidebar_position: 6
---

# a16n IR Plugin Overview

The **@a16njs/plugin-a16n** package enables reading and writing the a16n intermediate representation (IR) to/from disk in a human-readable, git-friendly format with versioned schema support.

## Why?

The a16n IR format serves as a **hub format** - convert any supported format to IR, then store it and distribute it when you don't know which tool(s) consumers will be using.

This is only marginally better than just choosing a single tool's format as your canonical format, and using `a16n convert` to just translate normally - with the bonus that you don't have to worry about the version of the IR format on-disk.

You'd only choose to convert `--to a16n` and store the IR if you had multiple tools you wanted to support *and* they had disjoint sets of supported features.

For example consider [AgentIngnore](/models#agentignore): currently, Cursor supports `.cursorignore`, but Codex does not have a tool-enforced exclude for file patterns. If you chose Codex as your canonical format, you wouldn't be able to store an AgentIgnore. Then, Cursor users wouldn't be able to run `a16n convert --from codex --to cursor` to get a `.cursorignore`.

In contrast, if you stored an `AgentIgnore` in the IR format, cursor users could run `a16n convert --from a16n --to cursor` and get their `.cursorignore`, and Codex users who ran `a16n convert --from a16n --to codex` would just see the upstream `AgentIgnore` get skipped.

:::caution Rare & Unusual
This is unlikely to be a common use-case. Don't overthink it and don't marry yourself to this major-version-0 IR unless you're sure you know what you're doing!
:::

## Installation

This plugin is bundled with the `a16n` CLI. For programmatic use:

```bash
npm install @a16njs/plugin-a16n
```

---

## Directory Structure

The plugin reads/writes files in the `.a16n/` directory:

```
.a16n/
├── global-prompt/
│   ├── coding-standards.md
│   └── security-rules.md
├── file-rule/
│   └── typescript-style.md
├── simple-agent-skill/
│   └── code-review.md
├── agent-skill-io/
│   └── deploy-helper/
│       ├── SKILL.md
│       └── resources/
├── agent-ignore/
│   └── build-artifacts.md
└── manual-prompt/
    └── generate-tests.md
```

Each IR type gets its own subdirectory, and each item is a separate Markdown file. [AgentSkillIO](/models#agentskillio) items use subdirectories with the standard [AgentSkills.io](https://agentskills.io) format.

---

## File Format

Each IR file contains YAML frontmatter with metadata and Markdown content:

```markdown
---
version: v1beta1
type: global-prompt
relativeDir: shared/standards
---

# Coding Standards

Always follow these coding standards...
```

### Frontmatter Fields

- `version` (required): IR version (e.g., `v1beta1`) — [Kubernetes-style versioning](https://kubernetes.io/docs/reference/using-api/#api-versioning)
- `type` (required): CustomizationType enum value (kebab-case) — see [Customization Types](/models#customization-types)
- `relativeDir` (optional): Relative directory path for preserving structure
- Type-specific fields (e.g., `globs` for [FileRule](/models#filerule), `description` for [SimpleAgentSkill](/models#simpleagentskill))

The filename serves as the item's identifier — no separate `name` field is needed.

---

## Supported Types

### Discovery

All six IR types are discoverable from `.a16n/`:

| IR Type | Location | Notes |
|---------|----------|-------|
| [GlobalPrompt](/models#globalprompt) | `.a16n/global-prompt/*.md` | Always-applied prompts |
| [FileRule](/models#filerule) | `.a16n/file-rule/*.md` | Glob-triggered rules |
| [SimpleAgentSkill](/models#simpleagentskill) | `.a16n/simple-agent-skill/*.md` | Description-triggered skills |
| [AgentSkillIO](/models#agentskillio) | `.a16n/agent-skill-io/*/SKILL.md` | Complex skills with resources |
| [AgentIgnore](/models#agentignore) | `.a16n/agent-ignore/*.md` | Exclusion patterns |
| [ManualPrompt](/models#manualprompt) | `.a16n/manual-prompt/*.md` | User-invoked prompts |

### Emission

All six IR types can be emitted to `.a16n/`:

| IR Type | Output | Notes |
|---------|--------|-------|
| [GlobalPrompt](/models#globalprompt) | `.a16n/global-prompt/<name>.md` | YAML frontmatter + content |
| [FileRule](/models#filerule) | `.a16n/file-rule/<name>.md` | Includes `globs:` in frontmatter |
| [SimpleAgentSkill](/models#simpleagentskill) | `.a16n/simple-agent-skill/<name>.md` | Includes `description:` in frontmatter |
| [AgentSkillIO](/models#agentskillio) | `.a16n/agent-skill-io/<name>/` | Standard AgentSkills.io format |
| [AgentIgnore](/models#agentignore) | `.a16n/agent-ignore/<name>.md` | Includes `patterns:` in frontmatter |
| [ManualPrompt](/models#manualprompt) | `.a16n/manual-prompt/<name>.md` | Includes `promptName` via `relativeDir` |

---

## Version Compatibility

The plugin uses Kubernetes-style version semantics:

- **Forward compatible**: A reader with version `v1beta2` can read files with `v1beta1`
- **Major version must match**: `v1` is not compatible with `v2`
- **Stability must match**: `beta` is not compatible with `alpha` or `stable`
- Files with incompatible versions are still processed but emit a `VersionMismatch` warning

---

## Programmatic Usage

```typescript
import a16nPlugin from '@a16njs/plugin-a16n';
import { A16nEngine } from '@a16njs/engine';

// Create engine with a16n plugin
const engine = new A16nEngine([a16nPlugin]);

// Discover IR files from .a16n/ directory
const result = await a16nPlugin.discover('./my-project');
console.log(`Found ${result.items.length} items`);

for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}

// Emit to IR format
const items = [/* AgentCustomization items */];
const emitResult = await a16nPlugin.emit(items, './my-project');
console.log(`Wrote ${emitResult.written.length} files`);
```

### Dry Run

```typescript
// Calculate what would be written without writing
const emitResult = await a16nPlugin.emit(items, './my-project', {
  dryRun: true,
});

for (const file of emitResult.written) {
  console.log(`Would write: ${file.path}`);
}
```

---

## CLI Usage

```bash
# Convert from another format to IR
a16n convert --from cursor --to a16n
a16n convert --from claude --to a16n

# Convert from IR to another format
a16n convert --from a16n --to cursor
a16n convert --from a16n --to claude

# Discover IR files
a16n discover --from a16n
```

The a16n IR format serves as a **hub format** — convert any supported format to IR, then from IR to any other format. This enables cross-format workflows without direct format-to-format conversion logic.

---

## API Reference

For complete plugin API details, see the [Plugin a16n API Reference](/plugin-a16n/api).

---

## See Also

- [Plugin a16n API Reference](/plugin-a16n/api) - Complete API documentation
- [Understanding Conversions](/understanding-conversions) - Conversion details
- [Models](/models) - Type definitions
