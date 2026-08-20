# Function: readAgentSkillIO()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / readAgentSkillIO

# Function: readAgentSkillIO()

> **readAgentSkillIO**(`skillDir`): `Promise`\<\{ `success`: `true`; `skill`: [`ParsedSkill`](../interfaces/ParsedSkill.md) & `object`; \} \| \{ `success`: `false`; `error`: `string`; \}\>

Defined in: [agentskills-io.ts:365](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L365)

Read an AgentSkillIO from disk in verbatim AgentSkills.io format.

This reads the VERBATIM AgentSkills.io format from:
- SKILL.md with name, description, resources, disable-model-invocation
- Resource files in the skill directory

It does NOT expect IR-specific fields (version, type, relativeDir).

## Parameters

### skillDir

`string`

Directory containing the skill (e.g., .a16n/agent-skill-io/NAME)

## Returns

`Promise`\<\{ `success`: `true`; `skill`: [`ParsedSkill`](../interfaces/ParsedSkill.md) & `object`; \} \| \{ `success`: `false`; `error`: `string`; \}\>

Parsed skill with frontmatter, content, and resource files

## Example

```ts
await readAgentSkillIO('.a16n/agent-skill-io/deploy')
// {
//   frontmatter: { name: 'deploy', description: '...', resources: ['checklist.md'] },
//   content: 'Deploy instructions...',
//   files: { 'checklist.md': 'Checklist content...' }
// }
```
