# Interface: FileRule

Defined in: types.ts:57

A rule that is triggered by file patterns.
Examples: Cursor rules with globs

## Extends

- [`AgentCustomization`](AgentCustomization.md)

## Properties

### content

> **content**: `string`

Defined in: types.ts:30

The actual prompt/rule content

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`content`](AgentCustomization.md#content)

***

### globs

> **globs**: `string`[]

Defined in: types.ts:60

File patterns that trigger this rule

***

### id

> **id**: `string`

Defined in: types.ts:24

Unique identifier for this item

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`id`](AgentCustomization.md#id)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: types.ts:32

Tool-specific extras that don't fit the standard model

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`metadata`](AgentCustomization.md#metadata)

***

### sourcePath

> **sourcePath**: `string`

Defined in: types.ts:28

Original file path where this was discovered

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`sourcePath`](AgentCustomization.md#sourcepath)

***

### type

> **type**: [`FileRule`](../enumerations/CustomizationType.md#filerule)

Defined in: types.ts:58

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)
