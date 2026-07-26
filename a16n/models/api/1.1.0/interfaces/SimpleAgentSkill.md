# Interface: SimpleAgentSkill

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / SimpleAgentSkill

# Interface: SimpleAgentSkill

Defined in: [types.ts:104](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L104)

A simple skill that is activated by description matching.
Examples: Cursor rules with description but no globs, simple SKILL.md files

For full AgentSkills.io standard skills with resources and files,
use AgentSkillIO instead.

## Extends

- [`AgentCustomization`](AgentCustomization.md).[`AgentSkillSpecFields`](AgentSkillSpecFields.md)

## Properties

### id

> **id**: `string`

Defined in: [types.ts:31](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L31)

Unique identifier for this item

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`id`](AgentCustomization.md#id)

***

### version

> **version**: `string`

Defined in: [types.ts:35](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L35)

IR version (required, e.g., 'v1beta1')

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`version`](AgentCustomization.md#version)

***

### sourcePath?

> `optional` **sourcePath?**: `string`

Defined in: [types.ts:37](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L37)

Original file path where this was discovered (optional, omitted in IR format)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`sourcePath`](AgentCustomization.md#sourcepath)

***

### relativeDir?

> `optional` **relativeDir?**: `string`

Defined in: [types.ts:39](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L39)

Relative directory path for preserving directory structure (optional)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`relativeDir`](AgentCustomization.md#relativedir)

***

### content

> **content**: `string`

Defined in: [types.ts:41](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L41)

The actual prompt/rule content

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`content`](AgentCustomization.md#content)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:48](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L48)

Tool-specific extras that don't fit the standard model (transient, not serialized in IR).

This is **not** the AgentSkills.io `metadata` frontmatter field — that one is
author-authored and must persist. See [AgentSkillSpecFields.specMetadata](AgentSkillSpecFields.md#specmetadata).

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`metadata`](AgentCustomization.md#metadata)

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

***

### type

> **type**: [`SimpleAgentSkill`](../enumerations/CustomizationType.md#simpleagentskill)

Defined in: [types.ts:105](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L105)

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)

***

### name

> **name**: `string`

Defined in: [types.ts:107](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L107)

Invocation name — the directory name (or rule filename) used for slash-command invocation (e.g., "banana" for /banana). Required for skills to invoke properly.

***

### description

> **description**: `string`

Defined in: [types.ts:109](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/types.ts#L109)

What triggers this skill
