# Function: writeAgentSkillIO()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / writeAgentSkillIO

# Function: writeAgentSkillIO()

> **writeAgentSkillIO**(`outputDir`, `frontmatter`, `content`, `files`): `Promise`\<`string`[]\>

Defined in: [agentskills-io.ts:168](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/agentskills-io.ts#L168)

Write an AgentSkillIO to disk in verbatim AgentSkills.io format.

This writes the VERBATIM AgentSkills.io format:
- SKILL.md with name, description, resources, disable-model-invocation
- Resource files in the skill directory

It does NOT write IR-specific fields (version, type, relativeDir).

## Parameters

### outputDir

`string`

Directory to write the skill (e.g., .a16n/agent-skill-io/NAME)

### frontmatter

[`ParsedSkillFrontmatter`](../interfaces/ParsedSkillFrontmatter.md)

Skill frontmatter (AgentSkills.io format)

### content

`string`

Skill content

### files

`Record`\<`string`, `string`\>

Resource files to write (key: relative path, value: content)

## Returns

`Promise`\<`string`[]\>

Array of written file paths

## Example

```ts
await writeAgentSkillIO(
  '.a16n/agent-skill-io/deploy',
  { name: 'deploy', description: 'Deploy app', resources: ['checklist.md'] },
  'Deploy instructions...',
  { 'checklist.md': 'Checklist content...' }
)
```
