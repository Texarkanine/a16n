# @a16n/models

Type definitions and plugin interface for a16n.

## Installation

```bash
npm install @a16n/models
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
} from '@a16n/models';
```

## Exports

### Types

- `CustomizationType` - Enum of customization types (GlobalPrompt, AgentSkill, FileRule, AgentIgnore)
- `AgentCustomization` - Base interface for all customizations
- `GlobalPrompt` - Always-applied prompts
- `AgentSkill` - Context-triggered by description (Phase 2)
- `FileRule` - Triggered by file patterns (Phase 2)
- `AgentIgnore` - Ignore patterns (Phase 3)

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
- `isAgentSkill(item)` - Type guard for AgentSkill
- `isFileRule(item)` - Type guard for FileRule
- `isAgentIgnore(item)` - Type guard for AgentIgnore
- `createId(type, sourcePath)` - Create unique ID

## License

MIT
