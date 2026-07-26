# Function: writeAgentSkillIO()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / writeAgentSkillIO

# Function: writeAgentSkillIO()

> **writeAgentSkillIO**(`outputDir`, `frontmatter`, `content`, `files`): `Promise`\<`string`[]\>

Defined in: [agentskills-io.ts:292](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L292)

Write an AgentSkillIO to disk in verbatim AgentSkills.io format.

This writes the VERBATIM AgentSkills.io format:
- SKILL.md with name, description, resources, disable-model-invocation,
  license, compatibility, metadata, allowed-tools
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
