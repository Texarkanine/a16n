# Function: formatSpecFieldsYaml()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / formatSpecFieldsYaml

# Function: formatSpecFieldsYaml()

> **formatSpecFieldsYaml**(`fields`): `string`

Defined in: [agentskills-io.ts:98](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L98)

Render the optional AgentSkills.io spec fields as YAML frontmatter lines.

The inverse of [extractSpecFields](extractSpecFields.md), and shared for the same reason: the
four spec key names are spelled once, so a reader and a writer can never
disagree about what a field is called on disk.

Returns lines ready to append inside an existing frontmatter block (each
prefixed with a newline), or `''` when the item carries none of the fields.
Values are JSON-quoted because JSON string syntax is a subset of YAML's
double-quoted scalar style — safe for colons, punctuation, and embedded
quotes alike, and already how the plugins quote `name` and `description`.

## Parameters

### fields

[`AgentSkillSpecFields`](../interfaces/AgentSkillSpecFields.md)

The spec fields carried by the item being emitted

## Returns

`string`

YAML lines to append, or `''` if there is nothing to write

## Example

```ts
formatSpecFieldsYaml({ license: 'MIT' })
// '\nlicense: "MIT"'
```
