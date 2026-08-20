# Interface: AgentSkillSpecFields

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / AgentSkillSpecFields

# Interface: AgentSkillSpecFields

Defined in: [types.ts:59](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L59)

Optional AgentSkills.io frontmatter fields shared by every skill-shaped IR type.

These are modeled purely so they survive conversion; a16n does not act on them
and does not validate the spec's length or format constraints.

## See

https://agentskills.io/specification.md

## Extended by

- [`SimpleAgentSkill`](SimpleAgentSkill.md)
- [`AgentSkillIO`](AgentSkillIO.md)
- [`ManualPrompt`](ManualPrompt.md)
- [`ParsedSkillFrontmatter`](ParsedSkillFrontmatter.md)

## Properties

### license?

> `optional` **license?**: `string`

Defined in: [types.ts:61](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L61)

License name or a reference to a bundled license file. Provenance only.

***

### compatibility?

> `optional` **compatibility?**: `string`

Defined in: [types.ts:63](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L63)

Environment requirements, e.g. `Requires Python 3.14+ and uv`. Documentation only.

***

### specMetadata?

> `optional` **specMetadata?**: `Record`\<`string`, `string`\>

Defined in: [types.ts:71](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L71)

The AgentSkills.io spec's `metadata` field: author-authored client properties,
persisted to disk under the key `metadata`.

Distinct from [AgentCustomization.metadata](AgentCustomization.md#metadata), which is transient and is
never serialized.

***

### allowedTools?

> `optional` **allowedTools?**: `string`

Defined in: [types.ts:80](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L80)

Space-separated list of pre-approved tools, preserved as the authored string
(e.g. `Bash(git:*) Bash(jq:*) Read`) rather than split, because re-joining a
parsed list invites normalization bugs.

Experimental in the spec, but the only one of these fields with enforcement
semantics: dropping it makes the emitted skill more permissive than authored.
