---
title: Plugin Development
description: How to create plugins for a16n
---

# Plugin Development

:::danger Work in Progress

**This library is currently in early development (pre-1.0).** The plugin API is subject to change without notice. If you're interested in building a plugin, please wait until the API stabilizes or be prepared to update your code frequently.

:::

## Overview

a16n uses a plugin architecture to support different AI coding tools. Each plugin handles:

1. **Discovery** - Finding agent customization files in a project
2. **Emission** - Writing converted files to the target format

## Plugin Interface

Plugins implement the `Plugin` interface from `@a16njs/models`:

```typescript
import { Plugin, CustomizationType } from '@a16njs/models';

const myPlugin: Plugin = {
  id: 'my-agent',
  name: 'My Agent',
  supports: [CustomizationType.GlobalPrompt, CustomizationType.FileRule],
  
  async discover(root: string) {
    // Find and parse your agent's config files
    // Return { items: [...], warnings: [...] }
  },
  
  async emit(models, root, options) {
    // Write models to disk in your agent's format
    // Return { written: [...], warnings: [...], unsupported: [...] }
  }
};

export default myPlugin;
```

## Key Concepts

### Items (Intermediate Representation)

Items are the tool-agnostic representation of agent customization:

```typescript
interface Item {
  type: CustomizationType;
  sourcePath: string;
  content: string;
  metadata?: Record<string, unknown>;
}
```

### CustomizationType

The types of customization a16n understands:

- `GlobalPrompt` - Always-applied system prompts
- `FileRule` - File-specific rules (with globs)
- `AgentRequested` - Context-triggered rules
- `AgentIgnore` - File ignore patterns
- `AgentSkill` - Reusable skills/capabilities

### Discovery

Discovery scans a project and returns found items:

```typescript
async discover(root: string): Promise<DiscoveryResult> {
  const items: Item[] = [];
  const warnings: Warning[] = [];
  
  // Scan for config files
  // Parse and convert to Items
  
  return { items, warnings };
}
```

### Emission

Emission converts items to the target format and writes files:

```typescript
async emit(
  items: Item[],
  root: string,
  options?: EmitOptions
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: Item[] = [];
  
  for (const item of items) {
    if (canConvert(item)) {
      // Convert and write
    } else {
      unsupported.push(item);
    }
  }
  
  return { written, warnings, unsupported };
}
```

## Project Structure

Recommended plugin structure:

```
packages/plugin-example/
├── src/
│   ├── index.ts        # Plugin entry point
│   ├── discover.ts     # Discovery logic
│   └── emit.ts         # Emission logic
├── test/
│   ├── fixtures/       # Test fixtures
│   ├── discover.test.ts
│   └── emit.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Publishing

Community plugins can be published to npm:

- **Scoped**: `@a16njs/plugin-<name>` (requires organization membership)
- **Unscoped**: `a16n-plugin-<name>` (anyone can publish)

a16n automatically discovers installed plugins matching these patterns.

## Example: Minimal Plugin

```typescript
import type { Plugin, Item, DiscoveryResult, EmitResult } from '@a16njs/models';
import { CustomizationType } from '@a16njs/models';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const minimalPlugin: Plugin = {
  id: 'minimal',
  name: 'Minimal Plugin',
  supports: [CustomizationType.GlobalPrompt],

  async discover(root: string): Promise<DiscoveryResult> {
    const configPath = join(root, 'minimal.config');
    try {
      const content = await readFile(configPath, 'utf-8');
      return {
        items: [{
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'minimal.config',
          content,
        }],
        warnings: [],
      };
    } catch {
      return { items: [], warnings: [] };
    }
  },

  async emit(items: Item[], root: string): Promise<EmitResult> {
    const written = [];
    const unsupported = [];

    for (const item of items) {
      if (item.type === CustomizationType.GlobalPrompt) {
        const path = join(root, 'minimal.config');
        await writeFile(path, item.content);
        written.push({ path, isNewFile: true });
      } else {
        unsupported.push(item);
      }
    }

    return { written, warnings: [], unsupported };
  },
};

export default minimalPlugin;
```

## Existing Plugins

Reference these for implementation patterns:

- [@a16njs/plugin-cursor](/plugin-cursor) - Cursor IDE support
- [@a16njs/plugin-claude](/plugin-claude) - Claude Code support

## Resources

- [Models Package](/models) - Type definitions
- [Engine Package](/engine) - Core conversion engine
- [GitHub Repository](https://github.com/Texarkanine/a16n) - Source code
