# Function: parseSkillFrontmatter()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / parseSkillFrontmatter

# Function: parseSkillFrontmatter()

> **parseSkillFrontmatter**(`fileContent`): \{ `success`: `true`; `skill`: [`ParsedSkill`](../interfaces/ParsedSkill.md); \} \| \{ `success`: `false`; `error`: `string`; \}

Defined in: [agentskills-io.ts:62](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L62)

Parse the frontmatter from an AgentSkills.io SKILL.md file.

This parses the VERBATIM AgentSkills.io format:
- name (required)
- description (required)
- resources (optional)
- disable-model-invocation (optional)

It does NOT parse IR-specific fields (version, type, relativeDir).

## Parameters

### fileContent

`string`

The complete SKILL.md file content

## Returns

\{ `success`: `true`; `skill`: [`ParsedSkill`](../interfaces/ParsedSkill.md); \} \| \{ `success`: `false`; `error`: `string`; \}

Parsed skill or error message

## Example

```ts
const content = `---
name: deploy
description: Deploy the application
resources:
  - checklist.md
---

Deploy instructions...`;

parseSkillFrontmatter(content)
// { frontmatter: { name: 'deploy', description: '...', resources: ['checklist.md'] }, content: 'Deploy instructions...' }
```
