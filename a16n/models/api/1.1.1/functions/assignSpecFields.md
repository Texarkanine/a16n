# Function: assignSpecFields()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / assignSpecFields

# Function: assignSpecFields()

> **assignSpecFields**(`target`, `fields`): `void`

Defined in: [agentskills-io.ts:130](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L130)

Copy an item's AgentSkills.io spec fields into a frontmatter object under
their *spec* key names (`allowed-tools`, `metadata`, …).

The object-form counterpart of [formatSpecFieldsYaml](formatSpecFieldsYaml.md): use this when the
caller builds a data object for `gray-matter` / `yaml.stringify`, and the
string form when it hand-builds YAML lines. Both spell the same four keys.

Empty `specMetadata` is omitted rather than written as `{}`.

## Parameters

### target

`Record`\<`string`, `unknown`\>

Frontmatter object being built, mutated in place

### fields

[`AgentSkillSpecFields`](../interfaces/AgentSkillSpecFields.md)

The item whose spec fields should be copied

## Returns

`void`
