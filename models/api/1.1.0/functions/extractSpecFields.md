# Function: extractSpecFields()

> [**@a16njs/models**](../)

***

[@a16njs/models](../) / extractSpecFields



> **extractSpecFields**(`data`): [`AgentSkillSpecFields`](../interfaces/AgentSkillSpecFields.md)

Defined in: [agentskills-io.ts:65](https://github.com/Texarkanine/a16n/blob/5715060b7361c854f95e5cc86c181602e116ca99/packages/models/src/agentskills-io.ts#L65)

Extract the optional AgentSkills.io spec fields from parsed YAML frontmatter.

Shared by every plugin that reads a `SKILL.md`, so the spec key names and the
`metadata` coercion rule are defined exactly once.

## Parameters

### data

`Record`\<`string`, `unknown`\>

Frontmatter key-values as produced by gray-matter

## Returns

[`AgentSkillSpecFields`](../interfaces/AgentSkillSpecFields.md)

Only the spec fields that were present and well-formed

## Example

```ts
extractSpecFields({ license: 'MIT', 'allowed-tools': 'Read' })
// { license: 'MIT', allowedTools: 'Read' }
```
