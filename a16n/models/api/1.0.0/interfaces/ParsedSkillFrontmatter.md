# Interface: ParsedSkillFrontmatter

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / ParsedSkillFrontmatter

# Interface: ParsedSkillFrontmatter

Defined in: [agentskills-io.ts:14](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L14)

Parsed frontmatter from an AgentSkills.io SKILL.md file.
This is the VERBATIM AgentSkills.io format, NOT the IR format.

## Properties

### name

> **name**: `string`

Defined in: [agentskills-io.ts:16](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L16)

Skill name (required)

***

### description

> **description**: `string`

Defined in: [agentskills-io.ts:18](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L18)

Skill description for activation matching (required)

***

### resources?

> `optional` **resources?**: `string`[]

Defined in: [agentskills-io.ts:20](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L20)

Resource file paths relative to skill directory (optional)

***

### disableModelInvocation?

> `optional` **disableModelInvocation?**: `boolean`

Defined in: [agentskills-io.ts:22](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L22)

If true, only invoked via /name (optional)
