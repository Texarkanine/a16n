# Function: parseSkillFrontmatter()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / parseSkillFrontmatter

# Function: parseSkillFrontmatter()

> **parseSkillFrontmatter**(`fileContent`): \{ `success`: `true`; `skill`: [`ParsedSkill`](../interfaces/ParsedSkill.md); \} \| \{ `success`: `false`; `error`: `string`; \}

Defined in: [agentskills-io.ts:183](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L183)

Parse the frontmatter from an AgentSkills.io SKILL.md file.

This parses the VERBATIM AgentSkills.io format:
- name (required)
- description (required)
- resources (optional)
- disable-model-invocation (optional)
- license, compatibility, metadata, allowed-tools (optional spec fields)

The spec's `metadata` key lands on `specMetadata` to keep it distinct from the
IR's transient `metadata`.

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
