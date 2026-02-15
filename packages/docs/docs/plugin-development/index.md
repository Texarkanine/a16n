---
title: Plugin Development
description: How to create plugins for a16n
---

# Plugin Development

a16n uses a plugin architecture to support different AI coding tools. Each plugin handles:

1. **Discovery** - Finding agent customization files in a project
2. **Emission** - Writing converted files to the target format

## Plugin Interface

Plugins implement the `A16nPlugin` interface from `@a16njs/models`; see the [Models API Reference](/models/api) for complete interface documentation.

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

## Key Concepts

### Customization Types

Plugins declare which types they support via the `supports` array. Entries are instances of [CustomizationType](/models/#customizationtype) from `@a16njs/models`.

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

## Project Structure

Recommended plugin structure:

```
a16n-plugin-example/
├── src/
│   ├── index.ts        # Plugin entry point & default export
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

### package.json Requirements

Your `package.json` must:

- Use the `a16n-plugin-` prefix in the package name (required for auto-discovery)
- Set `main` to point to your built entry file
- Declare `@a16njs/models` as a `peerDependency`

```json
{
  "name": "a16n-plugin-example",
  "type": "module",
  "main": "./dist/index.js",
  "peerDependencies": {
    "@a16njs/models": "^0.9.0"
  },
  "devDependencies": {
    "@a16njs/models": "^0.9.0"
  }
}
```

## Learning from Existing Plugins

The best way to understand plugin development is to study the existing implementations:

**[@a16njs/plugin-cursor](/plugin-cursor)**

The Cursor plugin demonstrates:
- MDC file parsing (YAML frontmatter + markdown body)
- Multiple file types (rules, commands, ignore files)
- Frontmatter-based type classification

**[@a16njs/plugin-claude](/plugin-claude)**

The Claude plugin demonstrates:
- Settings JSON handling

**[a16n-plugin-cursorrules](https://github.com/Texarkanine/a16n-plugin-cursorrules)**

The cursorrules plugin demonstrates:
- Community plugin naming format (`a16n-plugin-*`)
- Discovery-only support (no emission)

## Publishing

Community plugins should be published to npm with the `a16n-plugin-` prefix:

```
a16n-plugin-<name>
```

a16n automatically discovers installed packages matching the `a16n-plugin-*` naming convention by scanning `node_modules` directories. No registration or configuration is needed - just `npm install` the plugin alongside a16n.

:::note
The `@a16njs/plugin-*` scoped packages are reserved for bundled plugins maintained in the a16n monorepo. Community plugins should use the unscoped `a16n-plugin-*` convention.
:::


## See Also

- [Models API Reference](/models/api) - Plugin interface documentation
- Plugins:
	- [Plugin: Cursor](/plugin-cursor) - Cursor implementation details
	- [Plugin: Claude](/plugin-claude) - Claude implementation details
	- [Plugin: a16n](/plugin-a16n) - a16n implementation details
	- [Plugin: cursorrules](/plugin-cursorrules) - cursorrules implementation details
- [Understanding Conversions](/understanding-conversions) - Translation can be hard!
- [GitHub Repository](https://github.com/Texarkanine/a16n) - Source code
