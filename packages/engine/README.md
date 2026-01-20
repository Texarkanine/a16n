# @a16n/engine

Conversion engine for a16n. Orchestrates plugins to convert between tools.

## Installation

```bash
npm install @a16n/engine
```

## Usage

```typescript
import { A16nEngine } from '@a16n/engine';
import cursorPlugin from '@a16n/plugin-cursor';
import claudePlugin from '@a16n/plugin-claude';

// Create engine with plugins
const engine = new A16nEngine([cursorPlugin, claudePlugin]);

// Convert from Cursor to Claude
const result = await engine.convert({
  source: 'cursor',
  target: 'claude',
  root: './my-project',
});

console.log(`Discovered: ${result.discovered.length} items`);
console.log(`Written: ${result.written.length} files`);
console.log(`Warnings: ${result.warnings.length}`);

// Dry run (no writes)
const dryResult = await engine.convert({
  source: 'cursor',
  target: 'claude',
  root: './my-project',
  dryRun: true,
});

// Discover only
const discovery = await engine.discover('cursor', './my-project');
console.log(`Found: ${discovery.items.length} customizations`);

// List plugins
const plugins = engine.listPlugins();
plugins.forEach(p => console.log(`${p.id}: ${p.name}`));
```

## API

### `new A16nEngine(plugins)`

Create an engine with the given plugins.

### `engine.convert(options)`

Convert customizations from source to target format.

Options:
- `source` - Source plugin ID
- `target` - Target plugin ID  
- `root` - Project root directory
- `dryRun` - If true, only discover without writing

### `engine.discover(pluginId, root)`

Discover customizations using a specific plugin.

### `engine.listPlugins()`

List all registered plugins.

### `engine.getPlugin(id)`

Get a plugin by ID.

## License

MIT
