# Enumeration: CustomizationType

Defined in: types.ts:5

The taxonomy of agent customization types.
Each type represents a different way agents can be customized.

## Enumeration Members

### AgentIgnore

> **AgentIgnore**: `"agent-ignore"`

Defined in: types.ts:13

Files/patterns to exclude from agent context

***

### AgentSkill

> **AgentSkill**: `"agent-skill"`

Defined in: types.ts:9

Context-triggered by description matching

***

### FileRule

> **FileRule**: `"file-rule"`

Defined in: types.ts:11

Triggered by file glob patterns

***

### GlobalPrompt

> **GlobalPrompt**: `"global-prompt"`

Defined in: types.ts:7

Always-applied prompts (CLAUDE.md, alwaysApply rules)

***

### ManualPrompt

> **ManualPrompt**: `"manual-prompt"`

Defined in: types.ts:15

Explicitly invoked prompts (slash commands, skills with disable-model-invocation)
