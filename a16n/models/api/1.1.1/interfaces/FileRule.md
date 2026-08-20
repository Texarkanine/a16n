# Interface: FileRule

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / FileRule

# Interface: FileRule

Defined in: [types.ts:155](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L155)

A rule that is triggered by file patterns.
Examples: Cursor rules with globs

## Extends

- [`AgentCustomization`](AgentCustomization.md)

## Properties

### id

> **id**: `string`

Defined in: [types.ts:31](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L31)

Unique identifier for this item

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`id`](AgentCustomization.md#id)

***

### version

> **version**: `string`

Defined in: [types.ts:35](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L35)

IR version (required, e.g., 'v1beta1')

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`version`](AgentCustomization.md#version)

***

### sourcePath?

> `optional` **sourcePath?**: `string`

Defined in: [types.ts:37](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L37)

Original file path where this was discovered (optional, omitted in IR format)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`sourcePath`](AgentCustomization.md#sourcepath)

***

### relativeDir?

> `optional` **relativeDir?**: `string`

Defined in: [types.ts:39](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L39)

Relative directory path for preserving directory structure (optional)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`relativeDir`](AgentCustomization.md#relativedir)

***

### content

> **content**: `string`

Defined in: [types.ts:41](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L41)

The actual prompt/rule content

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`content`](AgentCustomization.md#content)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:48](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L48)

Tool-specific extras that don't fit the standard model (transient, not serialized in IR).

This is **not** the AgentSkills.io `metadata` frontmatter field — that one is
author-authored and must persist. See [AgentSkillSpecFields.specMetadata](AgentSkillSpecFields.md#specmetadata).

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`metadata`](AgentCustomization.md#metadata)

***

### type

> **type**: [`FileRule`](../enumerations/CustomizationType.md#filerule)

Defined in: [types.ts:156](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L156)

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)

***

### globs

> **globs**: `string`[]

Defined in: [types.ts:158](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/types.ts#L158)

File patterns that trigger this rule
