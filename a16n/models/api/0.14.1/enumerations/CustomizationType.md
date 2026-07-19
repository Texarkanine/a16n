# Enumeration: CustomizationType

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / CustomizationType

# Enumeration: CustomizationType

Defined in: [types.ts:5](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L5)

The taxonomy of agent customization types.
Each type represents a different way agents can be customized.

## Enumeration Members

### GlobalPrompt

> **GlobalPrompt**: `"global-prompt"`

Defined in: [types.ts:7](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L7)

Always-applied prompts (CLAUDE.md, alwaysApply rules)

***

### SimpleAgentSkill

> **SimpleAgentSkill**: `"simple-agent-skill"`

Defined in: [types.ts:9](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L9)

Simple skill triggered by description matching (no resources or extra files)

***

### AgentSkillIO

> **AgentSkillIO**: `"agent-skill-io"`

Defined in: [types.ts:11](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L11)

Full AgentSkills.io standard skill with resources and multiple files (NO hooks)

***

### FileRule

> **FileRule**: `"file-rule"`

Defined in: [types.ts:13](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L13)

Triggered by file glob patterns

***

### AgentIgnore

> **AgentIgnore**: `"agent-ignore"`

Defined in: [types.ts:15](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L15)

Files/patterns to exclude from agent context

***

### ManualPrompt

> **ManualPrompt**: `"manual-prompt"`

Defined in: [types.ts:17](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L17)

Explicitly invoked prompts (slash commands, skills with disable-model-invocation)
