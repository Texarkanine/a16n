---
sidebar_position: 3
---

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


| Type | Description | Example Use Case |
|------|-------------|------------------|
| **GlobalPrompt** | Always-applied instructions | Coding standards, project conventions |
| **AgentSkill** | Context-triggered by description | "When doing database work..." |
| **FileRule** | Triggered by file patterns | React rules for `*.tsx` files |
| **AgentIgnore** | Files to exclude | Build outputs, secrets, node_modules |
| **ManualPrompt** | Explicitly invoked commands | `/review`, `/test` slash commands |

### Conceptual Distinctions

**GlobalPrompt vs AgentSkill**
- GlobalPrompt: "Always follow these rules" - loaded for every interaction
- AgentSkill: "When the context suggests X, also apply Y" - conditionally loaded

**FileRule vs AgentSkill**
- FileRule: Triggers based on *which files* are being edited (glob patterns)
- AgentSkill: Triggers based on *what the agent understands* about the task (semantic)

**ManualPrompt**
- User-invoked commands (e.g., `/review`, `/test`) that run on demand rather than automatically

---

## Core Concepts

### Intermediate Representation (IR)

During conversion, all customizations are normalized into a common format (IR) before being emitted to the target format. This enables tool-agnostic transformations:

```
Source Files → IR (AgentCustomization[]) → Target Files
```

The base `AgentCustomization` interface provides common fields (id, type, sourcePath, content, metadata), while specialized types like `FileRule` and `AgentSkill` add type-specific fields.

### Type Guards

The package provides type guard functions for runtime type checking:

```typescript
import { isFileRule, isAgentSkill } from '@a16njs/models';

function processItem(item: AgentCustomization) {
  if (isFileRule(item)) {
    console.log('Globs:', item.globs);  // TypeScript knows globs exists
  }
}
```

Available guards: `isGlobalPrompt`, `isAgentSkill`, `isFileRule`, `isAgentIgnore`, `isManualPrompt`

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
