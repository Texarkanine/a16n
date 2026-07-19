# Interface: FileRule

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / FileRule

# Interface: FileRule

Defined in: [types.ts:118](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L118)

A rule that is triggered by file patterns.
Examples: Cursor rules with globs

## Extends

- [`AgentCustomization`](AgentCustomization.md)

## Properties

### id

> **id**: `string`

Defined in: [types.ts:31](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L31)

Unique identifier for this item

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`id`](AgentCustomization.md#id)

***

### version

> **version**: `string`

Defined in: [types.ts:35](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L35)

IR version (required, e.g., 'v1beta1')

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`version`](AgentCustomization.md#version)

***

### sourcePath?

> `optional` **sourcePath?**: `string`

Defined in: [types.ts:37](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L37)

Original file path where this was discovered (optional, omitted in IR format)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`sourcePath`](AgentCustomization.md#sourcepath)

***

### relativeDir?

> `optional` **relativeDir?**: `string`

Defined in: [types.ts:39](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L39)

Relative directory path for preserving directory structure (optional)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`relativeDir`](AgentCustomization.md#relativedir)

***

### content

> **content**: `string`

Defined in: [types.ts:41](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L41)

The actual prompt/rule content

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`content`](AgentCustomization.md#content)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:43](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L43)

Tool-specific extras that don't fit the standard model (transient, not serialized in IR)

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`metadata`](AgentCustomization.md#metadata)

***

### type

> **type**: [`FileRule`](../enumerations/CustomizationType.md#filerule)

Defined in: [types.ts:119](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L119)

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)

***

### globs

> **globs**: `string`[]

Defined in: [types.ts:121](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L121)

File patterns that trigger this rule
