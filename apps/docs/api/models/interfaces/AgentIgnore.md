# Interface: AgentIgnore

Defined in: types.ts:67

Patterns for files the agent should ignore.
Examples: .cursorignore

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

### patterns

> **patterns**: `string`[]

Defined in: types.ts:70

Gitignore-style patterns

***

### sourcePath

> **sourcePath**: `string`

Defined in: types.ts:28

Original file path where this was discovered

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`sourcePath`](AgentCustomization.md#sourcepath)

***

### type

> **type**: [`AgentIgnore`](../enumerations/CustomizationType.md#agentignore)

Defined in: types.ts:68

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)
