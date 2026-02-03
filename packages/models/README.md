# @a16njs/models

[![npm version](https://img.shields.io/npm/v/@a16njs/models.svg)](https://www.npmjs.com/package/@a16njs/models)
[![codecov](https://codecov.io/gh/Texarkanine/a16n/graph/badge.svg?flag=models)](https://codecov.io/gh/Texarkanine/a16n)

Type definitions and plugin interface for a16n.

## Installation

```bash
npm install @a16njs/models
```

## Usage

```typescript
import {
  CustomizationType,
  type A16nPlugin,
  type AgentCustomization,
  type GlobalPrompt,
  isGlobalPrompt,
  createId,
} from '@a16njs/models';
```

## Exports

### Types

- `CustomizationType` - Enum of customization types (GlobalPrompt, SimpleAgentSkill, AgentSkillIO, FileRule, AgentIgnore, ManualPrompt)
- `AgentCustomization` - Base interface for all customizations
- `GlobalPrompt` - Always-applied prompts
- `SimpleAgentSkill` - Context-triggered by description
- `AgentSkillIO` - Complex skills with resources/files
- `FileRule` - Triggered by file patterns
- `AgentIgnore` - Ignore patterns
- `ManualPrompt` - User-invoked prompts (e.g., `/command`), stored in `.cursor/skills/` or `.claude/skills/` with `disable-model-invocation: true`

### Plugin Interface

- `A16nPlugin` - Interface that plugins must implement
- `DiscoveryResult` - Result of discovering customizations
- `EmitResult` - Result of emitting customizations
- `WrittenFile` - Info about a written file

### Warnings

- `WarningCode` - Enum of warning codes (Merged, Approximated, Skipped, Overwritten)
- `Warning` - Warning structure

### Helpers

- `isGlobalPrompt(item)` - Type guard for GlobalPrompt
- `isSimpleAgentSkill(item)` - Type guard for SimpleAgentSkill
- `isAgentSkillIO(item)` - Type guard for AgentSkillIO
- `isFileRule(item)` - Type guard for FileRule
- `isAgentIgnore(item)` - Type guard for AgentIgnore
- `isManualPrompt(item)` - Type guard for ManualPrompt
- `createId(type, sourcePath)` - Create unique ID

## Documentation

Full documentation available at <https://texarkanine.github.io/a16n/models>.
