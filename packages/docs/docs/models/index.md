---
sidebar_position: 3
---

# Models

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

a16n uses a unified taxonomy to represent agent customizations across different tools.

### CustomizationType Enum

```typescript
enum CustomizationType {
  /** Always-applied prompts (CLAUDE.md, alwaysApply rules) */
  GlobalPrompt = 'global-prompt',
  
  /** Context-triggered by description matching */
  AgentSkill = 'agent-skill',
  
  /** Triggered by file glob patterns */
  FileRule = 'file-rule',
  
  /** Files/patterns to exclude from agent context */
  AgentIgnore = 'agent-ignore',
  
  /** Explicitly invoked prompts (slash commands) */
  ManualPrompt = 'manual-prompt',
}
```

### Type Mapping

| Type | Cursor | Claude |
|------|--------|--------|
| **GlobalPrompt** | `.cursor/rules/*.mdc` with `alwaysApply: true` | `CLAUDE.md` |
| **AgentSkill** | `.cursor/rules/*.mdc` with `description:` | `.claude/skills/*/SKILL.md` |
| **FileRule** | `.cursor/rules/*.mdc` with `globs:` | Hook + glob-hook |
| **AgentIgnore** | `.cursorignore` | `.claude/settings.json` deny |
| **ManualPrompt** | `.cursor/commands/*.md` | Skill with invoke description |

---

## Core Interfaces

### AgentCustomization

Base interface for all customization items:

```typescript
interface AgentCustomization {
  /** Unique identifier for this item */
  id: string;
  
  /** The type of customization */
  type: CustomizationType;
  
  /** Original file path where this was discovered */
  sourcePath: string;
  
  /** The actual prompt/rule content */
  content: string;
  
  /** Tool-specific extras that don't fit the standard model */
  metadata: Record<string, unknown>;
}
```

### GlobalPrompt

Always-applied prompts:

```typescript
interface GlobalPrompt extends AgentCustomization {
  type: CustomizationType.GlobalPrompt;
}
```

### AgentSkill

Description-triggered skills:

```typescript
interface AgentSkill extends AgentCustomization {
  type: CustomizationType.AgentSkill;
  
  /** What triggers this skill */
  description: string;
}
```

### FileRule

Glob-pattern-triggered rules:

```typescript
interface FileRule extends AgentCustomization {
  type: CustomizationType.FileRule;
  
  /** File patterns that trigger this rule */
  globs: string[];
}
```

### AgentIgnore

Ignore patterns:

```typescript
interface AgentIgnore extends AgentCustomization {
  type: CustomizationType.AgentIgnore;
  
  /** Gitignore-style patterns */
  patterns: string[];
}
```

### ManualPrompt

Slash command prompts:

```typescript
interface ManualPrompt extends AgentCustomization {
  type: CustomizationType.ManualPrompt;
  
  /** Prompt name for invocation (e.g., "review" for /review) */
  promptName: string;
}
```

---

## Type Guards

Runtime type checking utilities:

```typescript
import {
  isGlobalPrompt,
  isAgentSkill,
  isFileRule,
  isAgentIgnore,
  isManualPrompt,
} from '@a16njs/models';

const item: AgentCustomization = /* ... */;

if (isFileRule(item)) {
  // TypeScript knows item.globs is available
  console.log(item.globs);
}

if (isAgentSkill(item)) {
  // TypeScript knows item.description is available
  console.log(item.description);
}
```

---

## Plugin Interface

### A16nPlugin

The contract that all format plugins must implement:

```typescript
interface A16nPlugin {
  /** Unique identifier, e.g., 'cursor', 'claude' */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Which customization types this plugin supports */
  supports: CustomizationType[];

  /**
   * Discover all agent customizations in a directory tree.
   * @param root - The root directory to search
   * @returns All customizations found and any warnings
   */
  discover(root: string): Promise<DiscoveryResult>;

  /**
   * Emit customization models to disk in this plugin's format.
   * @param models - The customizations to emit
   * @param root - The root directory to write to
   * @param options - Optional emit options (e.g., dryRun)
   * @returns Info about what was written and any issues
   */
  emit(
    models: AgentCustomization[], 
    root: string, 
    options?: EmitOptions
  ): Promise<EmitResult>;
}
```

### DiscoveryResult

Result of plugin discovery:

```typescript
interface DiscoveryResult {
  /** All customization items found */
  items: AgentCustomization[];
  
  /** Any warnings encountered during discovery */
  warnings: Warning[];
}
```

### EmitResult

Result of plugin emission:

```typescript
interface EmitResult {
  /** Files that were written (or would be written in dry-run) */
  written: WrittenFile[];
  
  /** Any warnings encountered during emission */
  warnings: Warning[];
  
  /** Items that could not be represented by this plugin */
  unsupported: AgentCustomization[];
}
```

### WrittenFile

Information about a written file:

```typescript
interface WrittenFile {
  /** Path to the written file */
  path: string;
  
  /** Type of customization written */
  type: CustomizationType;
  
  /** How many models went into this file (1 for 1:1, more if merged) */
  itemCount: number;
  
  /** True if this file was created fresh; false if merged/edited existing */
  isNewFile: boolean;
  
  /** Source AgentCustomizations that contributed to this output */
  sourceItems?: AgentCustomization[];
}
```

### EmitOptions

Options for emission:

```typescript
interface EmitOptions {
  /** If true, calculate what would be written without actually writing */
  dryRun?: boolean;
}
```

---

## Warning System

### WarningCode Enum

```typescript
enum WarningCode {
  /** Multiple items were collapsed into one file */
  Merged = 'merged',
  
  /** Feature was translated imperfectly */
  Approximated = 'approximated',
  
  /** Feature was not supported and omitted */
  Skipped = 'skipped',
  
  /** Existing file was replaced */
  Overwritten = 'overwritten',
  
  /** File was renamed to avoid collision */
  FileRenamed = 'file-renamed',
  
  /** Git-ignored source with tracked output (or vice versa) */
  BoundaryCrossing = 'boundary-crossing',
  
  /** Sources have conflicting git status */
  GitStatusConflict = 'git-status-conflict',
}
```

### Warning Interface

```typescript
interface Warning {
  /** The type of warning */
  code: WarningCode;
  
  /** Human-readable description of the issue */
  message: string;
  
  /** Source files that were affected (optional) */
  sources?: string[];
  
  /** Additional details (optional) */
  details?: Record<string, unknown>;
}
```

---

## Helper Functions

### createId

Create a unique identifier for a customization:

```typescript
import { createId } from '@a16njs/models';

const id = createId(CustomizationType.GlobalPrompt, '.cursor/rules/core.mdc');
// → "global-prompt::.cursor/rules/core.mdc"
```

---

## Usage Example

```typescript
import {
  CustomizationType,
  type A16nPlugin,
  type AgentCustomization,
  type GlobalPrompt,
  type DiscoveryResult,
  isGlobalPrompt,
  isFileRule,
  createId,
} from '@a16njs/models';

// Create a customization
const rule: GlobalPrompt = {
  id: createId(CustomizationType.GlobalPrompt, 'rules.mdc'),
  type: CustomizationType.GlobalPrompt,
  sourcePath: 'rules.mdc',
  content: 'Always use TypeScript strict mode.',
  metadata: {},
};

// Type guard usage
function processItem(item: AgentCustomization) {
  if (isGlobalPrompt(item)) {
    console.log('Global:', item.content);
  } else if (isFileRule(item)) {
    console.log('FileRule:', item.globs.join(', '));
  }
}
```

---

## See Also

- [Engine](/engine) - How the engine uses these types
- [Plugin Development](/plugin-development) - Creating custom plugins
- [Understanding Conversions](/understanding-conversions) - The conversion taxonomy
