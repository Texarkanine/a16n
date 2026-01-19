# Plugin Development Guide

**How to create a16n plugins for additional AI coding tools.**

## Overview

a16n plugins bridge the gap between a16n's internal model and a specific AI coding tool's configuration format. Each plugin knows how to:

1. **Discover**: Read config files from disk and convert them to a16n models
2. **Emit**: Take a16n models and write them to disk in the tool's format

## Quick Start

```bash
# Create a new plugin project
mkdir a16n-plugin-myagent
cd a16n-plugin-myagent
npm init -y

# Install the models package
npm install @a16n/models

# Install dev dependencies
npm install -D typescript @types/node
```

## Plugin Interface

Your plugin must implement `A16nPlugin` from `@a16n/models`:

```typescript
import type {
  A16nPlugin,
  CustomizationType,
  AgentCustomization,
  DiscoveryResult,
  EmitResult,
} from '@a16n/models';

const myAgentPlugin: A16nPlugin = {
  // Unique identifier - used in CLI commands
  id: 'myagent',
  
  // Human-readable name
  name: 'My Agent IDE',
  
  // Which customization types this plugin can handle
  supports: [
    CustomizationType.GlobalPrompt,
    CustomizationType.FileRule,
  ],
  
  // Read config files from disk
  async discover(root: string): Promise<DiscoveryResult> {
    // Implementation here
  },
  
  // Write config files to disk
  async emit(models: AgentCustomization[], root: string): Promise<EmitResult> {
    // Implementation here
  },
};

export default myAgentPlugin;
```

## Implementing Discovery

Discovery scans a project directory and returns a16n models.

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import {
  AgentCustomization,
  CustomizationType,
  DiscoveryResult,
  Warning,
  createId,
} from '@a16n/models';

async function discover(root: string): Promise<DiscoveryResult> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];
  
  // Find your tool's config files
  const configFiles = await glob('**/.myagent-config.yaml', {
    cwd: root,
    ignore: ['node_modules/**'],
  });
  
  for (const file of configFiles) {
    try {
      const fullPath = path.join(root, file);
      const content = await fs.readFile(fullPath, 'utf-8');
      const parsed = parseYourFormat(content);
      
      // Convert to a16n model
      const item: AgentCustomization = {
        id: createId(CustomizationType.GlobalPrompt, file),
        type: CustomizationType.GlobalPrompt,
        sourcePath: file,
        content: parsed.prompt,
        metadata: {
          // Store any tool-specific data here
          originalFormat: parsed,
        },
      };
      
      items.push(item);
    } catch (error) {
      // Add warning but continue processing
      warnings.push({
        code: WarningCode.Skipped,
        message: `Failed to parse ${file}: ${error.message}`,
        sources: [file],
      });
    }
  }
  
  return { items, warnings };
}
```

### Discovery Best Practices

1. **Handle all file locations**: Check for config in multiple possible locations
2. **Support legacy formats**: If your tool has changed formats, support both
3. **Graceful degradation**: Parse what you can, warn about what you can't
4. **Preserve metadata**: Store tool-specific info in `metadata` for round-trip fidelity

## Implementing Emission

Emission takes a16n models and writes them in your tool's format.

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  AgentCustomization,
  CustomizationType,
  EmitResult,
  Warning,
  WarningCode,
  WrittenFile,
  isGlobalPrompt,
} from '@a16n/models';

async function emit(
  models: AgentCustomization[],
  root: string
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];
  
  // Separate models by type
  const globalPrompts = models.filter(isGlobalPrompt);
  const others = models.filter(m => !isGlobalPrompt(m));
  
  // Mark unsupported types
  for (const item of others) {
    if (!this.supports.includes(item.type)) {
      unsupported.push(item);
      warnings.push({
        code: WarningCode.Skipped,
        message: `${item.type} not supported by myagent plugin`,
        sources: [item.sourcePath],
      });
    }
  }
  
  // Write global prompts
  if (globalPrompts.length > 0) {
    // Your tool might need merging or separate files
    const outputPath = path.join(root, '.myagent-config.yaml');
    const content = formatForYourTool(globalPrompts);
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);
    
    written.push({
      path: outputPath,
      type: CustomizationType.GlobalPrompt,
      itemCount: globalPrompts.length,
    });
    
    // Warn if merging multiple sources
    if (globalPrompts.length > 1) {
      warnings.push({
        code: WarningCode.Merged,
        message: `Merged ${globalPrompts.length} items into ${outputPath}`,
        sources: globalPrompts.map(gp => gp.sourcePath),
      });
    }
  }
  
  return { written, warnings, unsupported };
}
```

### Emission Best Practices

1. **Report everything**: Use warnings to document every non-trivial decision
2. **Handle merging explicitly**: When multiple models become one file, warn
3. **Be idempotent**: Running emit twice should produce the same result
4. **Preserve existing files**: Consider backing up or warning before overwriting

## Customization Types

a16n defines four customization types. Support as many as your tool allows:

### GlobalPrompt
Always-applied prompts that set baseline behavior.

```typescript
interface GlobalPrompt extends AgentCustomization {
  type: CustomizationType.GlobalPrompt;
  // content: The prompt text
}
```

**Cursor equivalent**: `.mdc` files with `alwaysApply: true`
**Claude equivalent**: `CLAUDE.md` files

### AgentSkill
Context-triggered prompts activated by description matching.

```typescript
interface AgentSkill extends AgentCustomization {
  type: CustomizationType.AgentSkill;
  description: string;  // What activates this skill
}
```

**Cursor equivalent**: `.mdc` files with `description` but no `globs`
**Claude equivalent**: Skills in `/mnt/skills/`

### FileRule
Prompts triggered when working with specific file types.

```typescript
interface FileRule extends AgentCustomization {
  type: CustomizationType.FileRule;
  globs: string[];  // File patterns that trigger this
}
```

**Cursor equivalent**: `.mdc` files with `globs` array
**Claude equivalent**: Tool hooks on read/write for file types

### AgentIgnore
Patterns for files the agent should ignore.

```typescript
interface AgentIgnore extends AgentCustomization {
  type: CustomizationType.AgentIgnore;
  patterns: string[];  // Gitignore-style patterns
}
```

**Cursor equivalent**: `.cursorignore`
**Claude equivalent**: None (emit as unsupported)

## Warning System

Use warnings to communicate issues without failing:

```typescript
import { WarningCode, Warning } from '@a16n/models';

// When merging multiple sources into one output
const merged: Warning = {
  code: WarningCode.Merged,
  message: 'Combined 3 rules into single config file',
  sources: ['rule1.md', 'rule2.md', 'rule3.md'],
};

// When approximating a feature that doesn't translate perfectly
const approximated: Warning = {
  code: WarningCode.Approximated,
  message: 'File globs converted to keyword matching (may be less precise)',
  sources: ['component-rules.mdc'],
};

// When skipping something unsupported
const skipped: Warning = {
  code: WarningCode.Skipped,
  message: 'AgentIgnore not supported by myagent',
  sources: ['.cursorignore'],
};

// When overwriting an existing file
const overwritten: Warning = {
  code: WarningCode.Overwritten,
  message: 'Replaced existing .myagent-config.yaml',
  sources: ['.myagent-config.yaml'],
};
```

## Testing Your Plugin

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import plugin from './index';

describe('myagent plugin', () => {
  describe('discover', () => {
    it('finds config files', async () => {
      const result = await plugin.discover('./test/fixtures/basic');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('global-prompt');
    });
    
    it('handles missing config gracefully', async () => {
      const result = await plugin.discover('./test/fixtures/empty');
      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
  
  describe('emit', () => {
    it('writes config file', async () => {
      const models = [
        {
          id: 'test',
          type: 'global-prompt',
          sourcePath: 'test.md',
          content: 'Be helpful',
          metadata: {},
        },
      ];
      
      const result = await plugin.emit(models, './test/output');
      expect(result.written).toHaveLength(1);
    });
    
    it('warns on merge', async () => {
      const models = [
        { /* model 1 */ },
        { /* model 2 */ },
      ];
      
      const result = await plugin.emit(models, './test/output');
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'merged' })
      );
    });
  });
});
```

### Integration Tests

Create fixture directories with known inputs and expected outputs:

```
test/
├── fixtures/
│   ├── basic/
│   │   ├── .myagent-config.yaml
│   │   └── expected-discovery.json
│   ├── multiple/
│   │   ├── configs/
│   │   │   ├── a.yaml
│   │   │   └── b.yaml
│   │   └── expected-discovery.json
│   └── round-trip/
│       ├── input/
│       └── expected-output/
```

## Publishing Your Plugin

### Package Naming

Use one of these naming conventions for auto-discovery:
- `@a16n/plugin-<name>` (if publishing to @a16n org)
- `a16n-plugin-<name>` (community plugins)

### package.json

```json
{
  "name": "a16n-plugin-myagent",
  "version": "1.0.0",
  "description": "a16n plugin for My Agent IDE",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "keywords": [
    "a16n",
    "a16n-plugin",
    "ai-coding",
    "myagent"
  ],
  "peerDependencies": {
    "@a16n/models": "^0.1.0"
  },
  "devDependencies": {
    "@a16n/models": "^0.1.0",
    "typescript": "^5.0.0"
  }
}
```

### Documentation

Include in your README:
- Which customization types are supported
- Any limitations or approximations
- Example usage with a16n CLI
- Your tool's config file format reference

## Example: Complete Plugin

Here's a complete minimal plugin:

```typescript
// src/index.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import type {
  A16nPlugin,
  AgentCustomization,
  CustomizationType,
  DiscoveryResult,
  EmitResult,
  Warning,
  WarningCode,
} from '@a16n/models';
import { createId, isGlobalPrompt } from '@a16n/models';

const myAgentPlugin: A16nPlugin = {
  id: 'myagent',
  name: 'My Agent IDE',
  supports: [CustomizationType.GlobalPrompt],

  async discover(root: string): Promise<DiscoveryResult> {
    const items: AgentCustomization[] = [];
    const warnings: Warning[] = [];

    // Look for .myagent file
    const configPath = path.join(root, '.myagent');
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      items.push({
        id: createId(CustomizationType.GlobalPrompt, '.myagent'),
        type: CustomizationType.GlobalPrompt,
        sourcePath: '.myagent',
        content,
        metadata: {},
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Failed to read .myagent: ${(error as Error).message}`,
          sources: ['.myagent'],
        });
      }
    }

    return { items, warnings };
  },

  async emit(models: AgentCustomization[], root: string): Promise<EmitResult> {
    const written: WrittenFile[] = [];
    const warnings: Warning[] = [];
    const unsupported: AgentCustomization[] = [];

    const globalPrompts = models.filter(isGlobalPrompt);
    const others = models.filter(m => !isGlobalPrompt(m));

    // Skip unsupported types
    unsupported.push(...others);
    for (const item of others) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `${item.type} not supported`,
        sources: [item.sourcePath],
      });
    }

    // Write global prompts
    if (globalPrompts.length > 0) {
      const content = globalPrompts
        .map(gp => `# From: ${gp.sourcePath}\n\n${gp.content}`)
        .join('\n\n---\n\n');

      const outputPath = path.join(root, '.myagent');
      await fs.writeFile(outputPath, content);

      written.push({
        path: outputPath,
        type: CustomizationType.GlobalPrompt,
        itemCount: globalPrompts.length,
      });

      if (globalPrompts.length > 1) {
        warnings.push({
          code: WarningCode.Merged,
          message: `Merged ${globalPrompts.length} items into .myagent`,
          sources: globalPrompts.map(gp => gp.sourcePath),
        });
      }
    }

    return { written, warnings, unsupported };
  },
};

export default myAgentPlugin;
```

## Getting Help

- **Issues**: File bugs and feature requests on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Examples**: See `@a16n/plugin-cursor` and `@a16n/plugin-claude` for reference implementations
