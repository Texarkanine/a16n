---
sidebar_position: 2
---

# Engine

The **@a16njs/engine** package provides the core conversion engine that orchestrates the translation between AI agent configuration formats. Use this for programmatic integrations or building custom tools.

## Installation

```bash
npm install @a16njs/engine
```

---

## Quick Start

```typescript
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';

// Create engine with plugins
const engine = new A16nEngine([cursorPlugin, claudePlugin]);

// Convert between formats
const result = await engine.convert({
  source: 'cursor',
  target: 'claude',
  root: './my-project',
});

console.log(`Wrote ${result.written.length} files`);
console.log(`Warnings: ${result.warnings.length}`);
```

---

## Architecture

The engine uses a plugin-based architecture with a three-stage pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                        A16nEngine                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Plugins │ →  │  Discover   │ →  │ Internal Model (IR) │  │
│  └─────────┘    └─────────────┘    └─────────────────────┘  │
│                                              ↓              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                        Emit                             ││
│  │   IR → Target Plugin → File System                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Stages

1. **Discovery** - Source plugin finds and parses configuration files
2. **Intermediate Representation** - Config is converted to tool-agnostic format
3. **Emission** - Target plugin writes configuration in its format

---

## API Reference

### A16nEngine

The main engine class that orchestrates plugins.

#### Constructor

```typescript
new A16nEngine(plugins: A16nPlugin[])
```

Creates an engine with the given plugins registered.

```typescript
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';

const engine = new A16nEngine([cursorPlugin, claudePlugin]);
```

---

### engine.convert()

Convert customizations from one format to another.

```typescript
async convert(options: ConversionOptions): Promise<ConversionResult>
```

#### ConversionOptions

```typescript
interface ConversionOptions {
  /** Source plugin ID (e.g., 'cursor', 'claude') */
  source: string;
  
  /** Target plugin ID (e.g., 'cursor', 'claude') */
  target: string;
  
  /** Project root directory */
  root: string;
  
  /** If true, only discover without writing files */
  dryRun?: boolean;
}
```

#### ConversionResult

```typescript
interface ConversionResult {
  /** Items discovered from source */
  discovered: AgentCustomization[];
  
  /** Files written to target */
  written: WrittenFile[];
  
  /** Warnings from discovery and emission */
  warnings: Warning[];
  
  /** Items that couldn't be represented by target */
  unsupported: AgentCustomization[];
}
```

#### Examples

```typescript
// Basic conversion
const result = await engine.convert({
  source: 'cursor',
  target: 'claude',
  root: './my-project',
});

// Dry run (no writes)
const preview = await engine.convert({
  source: 'cursor',
  target: 'claude',
  root: './my-project',
  dryRun: true,
});

console.log('Would write:', preview.written.map(f => f.path));
```

---

### engine.discover()

Discover customizations without converting.

```typescript
async discover(pluginId: string, root: string): Promise<DiscoveryResult>
```

#### DiscoveryResult

```typescript
interface DiscoveryResult {
  /** All customization items found */
  items: AgentCustomization[];
  
  /** Any warnings encountered during discovery */
  warnings: Warning[];
}
```

#### Example

```typescript
// Discover Cursor customizations
const result = await engine.discover('cursor', './my-project');

console.log(`Found ${result.items.length} customizations`);
for (const item of result.items) {
  console.log(`  ${item.type}: ${item.sourcePath}`);
}
```

---

### engine.listPlugins()

List all registered plugins.

```typescript
listPlugins(): PluginInfo[]
```

#### PluginInfo

```typescript
interface PluginInfo {
  /** Plugin ID */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Customization types supported */
  supports: CustomizationType[];
  
  /** How the plugin was loaded */
  source: 'bundled' | 'installed';
}
```

#### Example

```typescript
const plugins = engine.listPlugins();

for (const plugin of plugins) {
  console.log(`${plugin.id}: ${plugin.name}`);
  console.log(`  Supports: ${plugin.supports.join(', ')}`);
}
```

---

### engine.getPlugin()

Get a plugin by its ID.

```typescript
getPlugin(id: string): A16nPlugin | undefined
```

#### Example

```typescript
const cursorPlugin = engine.getPlugin('cursor');

if (cursorPlugin) {
  // Use plugin directly
  const result = await cursorPlugin.discover('./my-project');
}
```

---

### engine.registerPlugin()

Register an additional plugin after construction.

```typescript
registerPlugin(plugin: A16nPlugin): void
```

#### Example

```typescript
import myCustomPlugin from './my-plugin';

const engine = new A16nEngine([cursorPlugin, claudePlugin]);
engine.registerPlugin(myCustomPlugin);
```

---

## Error Handling

The engine throws errors for:

- Unknown source or target plugin
- File system errors (permissions, missing directories)
- Plugin validation errors

```typescript
try {
  const result = await engine.convert({
    source: 'unknown',
    target: 'claude',
    root: '.',
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Conversion failed:', error.message);
    // → "Unknown source: unknown"
  }
}
```

### Error Types

| Error | Cause |
|-------|-------|
| `Unknown source: <id>` | Source plugin not registered |
| `Unknown target: <id>` | Target plugin not registered |
| `ENOENT: no such file` | Path doesn't exist |
| `EACCES: permission denied` | File system permission error |

---

## Complete Example

```typescript
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';

async function migrateProject(projectPath: string) {
  // Create engine
  const engine = new A16nEngine([cursorPlugin, claudePlugin]);
  
  // First, discover what exists
  console.log('Discovering Cursor customizations...');
  const discovery = await engine.discover('cursor', projectPath);
  console.log(`Found ${discovery.items.length} items`);
  
  if (discovery.items.length === 0) {
    console.log('No customizations found.');
    return;
  }
  
  // Show what was found
  for (const item of discovery.items) {
    console.log(`  - ${item.type}: ${item.sourcePath}`);
  }
  
  // Preview conversion
  console.log('\nPreviewing conversion...');
  const preview = await engine.convert({
    source: 'cursor',
    target: 'claude',
    root: projectPath,
    dryRun: true,
  });
  
  console.log(`Would write ${preview.written.length} files:`);
  for (const file of preview.written) {
    console.log(`  - ${file.path}`);
  }
  
  if (preview.warnings.length > 0) {
    console.log(`\nWarnings (${preview.warnings.length}):`);
    for (const warning of preview.warnings) {
      console.log(`  ⚠ [${warning.code}] ${warning.message}`);
    }
  }
  
  // Perform actual conversion
  console.log('\nConverting...');
  const result = await engine.convert({
    source: 'cursor',
    target: 'claude',
    root: projectPath,
  });
  
  console.log(`\nDone! Wrote ${result.written.length} files.`);
}

migrateProject('./my-project').catch(console.error);
```

---

## See Also

- [Models](/models) - Type definitions and interfaces
- [Plugin Development](/plugin-development) - Creating custom plugins
- [CLI Reference](/cli) - Command-line interface
