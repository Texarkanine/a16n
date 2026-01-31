---
sidebar_position: 2
---

# Engine

The **@a16njs/engine** package provides the core conversion engine that orchestrates the translation between AI agent configuration formats.

## Installation

```bash
npm install @a16njs/engine
```

## Overview

The engine is responsible for:

- Loading plugins for source and target formats
- Orchestrating the discover → convert → emit pipeline
- Managing the internal representation of configuration data
- Handling validation and error reporting

## Programmatic API

Use the engine directly in your code for custom integrations:

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

// Or discover without converting
const discovered = await engine.discover('cursor', './my-project');
console.log(`Found ${discovered.items.length} customizations`);
```

## Architecture

The engine uses a plugin-based architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        A16nEngine                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Plugins │ →  │  Discover   │ →  │ Internal Model (IR) │  │
│  └─────────┘    └─────────────┘    └─────────────────────┘  │
│                                              ↓               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                        Emit                              ││
│  │   IR → Target Plugin → File System                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Stages

1. **Discovery** - Source plugin finds and parses configuration files
2. **Intermediate Representation** - Config is converted to tool-agnostic format
3. **Emission** - Target plugin writes configuration in its format

## API Reference

### `A16nEngine`

The main engine class.

#### Constructor

```typescript
new A16nEngine(plugins: Plugin[])
```

#### Methods

##### `convert(options: ConvertOptions): Promise<ConvertResult>`

Convert configuration between formats.

```typescript
interface ConvertOptions {
  source: string;      // Source plugin ID
  target: string;      // Target plugin ID
  root: string;        // Project root path
  dryRun?: boolean;    // Don't write files
}

interface ConvertResult {
  discovered: Item[];        // Items found by source plugin
  written: WrittenFile[];    // Files written (or would be written)
  warnings: Warning[];       // Conversion warnings
  unsupported: Item[];       // Items that couldn't be converted
}
```

##### `discover(source: string, root: string): Promise<DiscoveryResult>`

Discover configuration without converting.

```typescript
interface DiscoveryResult {
  items: Item[];
  warnings: Warning[];
}
```

##### `listPlugins(): PluginInfo[]`

List registered plugins.

```typescript
interface PluginInfo {
  id: string;
  name: string;
  supports: string[];
}
```

## Error Handling

The engine throws errors for:
- Unknown source or target plugin
- File system errors
- Plugin validation errors

```typescript
try {
  const result = await engine.convert({
    source: 'unknown',
    target: 'claude',
    root: '.',
  });
} catch (error) {
  console.error('Conversion failed:', error.message);
}
```

## See Also

- [Models](/models) - Shared type definitions
- [Plugin Development](/plugin-development) - Creating custom plugins
- [CLI Reference](/cli/reference) - Command-line interface
