# Interface: ParsedSkillFrontmatter

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / ParsedSkillFrontmatter

# Interface: ParsedSkillFrontmatter

Defined in: [agentskills-io.ts:15](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L15)

Parsed frontmatter from an AgentSkills.io SKILL.md file.
This is the VERBATIM AgentSkills.io format, NOT the IR format.

## Extends

- [`AgentSkillSpecFields`](AgentSkillSpecFields.md)

## Properties

### name

> **name**: `string`

Defined in: [agentskills-io.ts:17](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L17)

Skill name (required)

***

### description

> **description**: `string`

Defined in: [agentskills-io.ts:19](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L19)

Skill description for activation matching (required)

***

### resources?

> `optional` **resources?**: `string`[]

Defined in: [agentskills-io.ts:21](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L21)

Resource file paths relative to skill directory (optional)

***

### disableModelInvocation?

> `optional` **disableModelInvocation?**: `boolean`

Defined in: [agentskills-io.ts:23](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L23)

If true, only invoked via /name (optional)

***

### license?

> `optional` **license?**: `string`

Defined in: [types.ts:61](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L61)

License name or a reference to a bundled license file. Provenance only.

#### Inherited from

[`AgentSkillSpecFields`](AgentSkillSpecFields.md).[`license`](AgentSkillSpecFields.md#license)

***

### compatibility?

> `optional` **compatibility?**: `string`

Defined in: [types.ts:63](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L63)

Environment requirements, e.g. `Requires Python 3.14+ and uv`. Documentation only.

#### Inherited from

[`AgentSkillSpecFields`](AgentSkillSpecFields.md).[`compatibility`](AgentSkillSpecFields.md#compatibility)

***

### specMetadata?

> `optional` **specMetadata?**: `Record`\<`string`, `string`\>

Defined in: [types.ts:71](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L71)

The AgentSkills.io spec's `metadata` field: author-authored client properties,
persisted to disk under the key `metadata`.

Distinct from [AgentCustomization.metadata](AgentCustomization.md#metadata), which is transient and is
never serialized.

#### Inherited from

[`AgentSkillSpecFields`](AgentSkillSpecFields.md).[`specMetadata`](AgentSkillSpecFields.md#specmetadata)

***

### allowedTools?

> `optional` **allowedTools?**: `string`

Defined in: [types.ts:80](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L80)

Space-separated list of pre-approved tools, preserved as the authored string
(e.g. `Bash(git:*) Bash(jq:*) Read`) rather than split, because re-joining a
parsed list invites normalization bugs.

Experimental in the spec, but the only one of these fields with enforcement
semantics: dropping it makes the emitted skill more permissive than authored.

#### Inherited from

[`AgentSkillSpecFields`](AgentSkillSpecFields.md).[`allowedTools`](AgentSkillSpecFields.md#allowedtools)
