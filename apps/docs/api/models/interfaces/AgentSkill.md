# Interface: AgentSkill

Defined in: types.ts:47

A skill that is activated by description matching.
Examples: Cursor rules with description but no globs

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

### description

> **description**: `string`

Defined in: types.ts:50

What triggers this skill

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

> **type**: [`AgentSkill`](../enumerations/CustomizationType.md#agentskill)

Defined in: types.ts:48

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)
