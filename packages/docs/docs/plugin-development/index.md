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

Plugins implement the `A16nPlugin` interface from `@a16njs/models`. See the [Models API Reference](/models/api) for complete interface documentation.

The key methods are:

- **`discover(root)`** - Scan a directory and return found customizations
- **`emit(models, root, options)`** - Write customizations to disk in the plugin's format

```typescript
import type { A16nPlugin } from '@a16njs/models';
import { CustomizationType } from '@a16njs/models';

const myPlugin: A16nPlugin = {
  id: 'my-agent',
  name: 'My Agent',
  supports: [CustomizationType.GlobalPrompt, CustomizationType.FileRule],
  
  async discover(root: string) {
    // Return { items: [...], warnings: [...] }
  },
  
  async emit(models, root, options) {
    // Return { written: [...], warnings: [...], unsupported: [...] }
  }
};

export default myPlugin;
```

---

## Key Concepts

### Customization Types

Plugins declare which types they support via the `supports` array:

- `GlobalPrompt` - Always-applied system prompts
- `AgentSkill` - Description-triggered contextual rules
- `FileRule` - File pattern-triggered rules
- `AgentIgnore` - File ignore patterns
- `ManualPrompt` - Slash commands

See [Understanding Conversions](/understanding-conversions) for detailed explanations.

### Discovery

Discovery scans a project directory and returns customizations in the intermediate representation:

```typescript
async discover(root: string): Promise<DiscoveryResult> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];
  
  // Scan for config files specific to this tool
  // Parse and convert to AgentCustomization items
  
  return { items, warnings };
}
```

### Emission

Emission converts intermediate representation back to the plugin's native format:

```typescript
async emit(
  items: AgentCustomization[],
  root: string,
  options?: EmitOptions
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];

  for (const item of items) {
    if (this.supports.includes(item.type)) {
      // Convert and write file
    } else {
      unsupported.push(item);
    }
  }

  return { written, warnings, unsupported };
}
```

---

## Project Structure

Recommended plugin structure:

```
packages/plugin-example/
├── src/
│   ├── index.ts        # Plugin entry point & exports
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

---

## Learning from Existing Plugins

The best way to understand plugin development is to study the existing implementations:

### [@a16njs/plugin-cursor](/plugin-cursor)

The Cursor plugin demonstrates:
- MDC file parsing (YAML frontmatter + markdown body)
- Multiple file types (rules, commands, ignore files)
- Frontmatter-based type classification

Key files:
- `discover.ts` - Glob-based file discovery, MDC parsing
- `emit.ts` - MDC generation with proper frontmatter
- `mdc.ts` - MDC format utilities

### [@a16njs/plugin-claude](/plugin-claude)

The Claude plugin demonstrates:
- Single-file aggregation (`CLAUDE.md` merging)
- Settings JSON handling
- Hook configuration generation for FileRules

Key files:
- `discover.ts` - CLAUDE.md parsing, settings.json reading
- `emit.ts` - Section-based file merging, hook generation

---

## Publishing

Community plugins can be published to npm:

- **Scoped**: `@a16njs/plugin-<name>` (requires organization membership)
- **Unscoped**: `a16n-plugin-<name>` (anyone can publish)

a16n automatically discovers installed plugins matching these patterns.

---

## See Also

- [Models API Reference](/models/api) - Plugin interface documentation
- [Plugin: Cursor](/plugin-cursor) - Cursor implementation details
- [Plugin: Claude](/plugin-claude) - Claude implementation details
- [Understanding Conversions](/understanding-conversions) - Type taxonomy
- [GitHub Repository](https://github.com/Texarkanine/a16n) - Source code
