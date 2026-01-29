# Interface: AgentCustomization

Defined in: types.ts:22

Base interface for all agent customization items.
Every customization discovered or emitted extends this interface.

## Extended by

- [`GlobalPrompt`](GlobalPrompt.md)
- [`AgentSkill`](AgentSkill.md)
- [`FileRule`](FileRule.md)
- [`AgentIgnore`](AgentIgnore.md)
- [`ManualPrompt`](ManualPrompt.md)

## Properties

### content

> **content**: `string`

Defined in: types.ts:30

The actual prompt/rule content

***

### id

> **id**: `string`

Defined in: types.ts:24

Unique identifier for this item

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: types.ts:32

Tool-specific extras that don't fit the standard model

***

### sourcePath

> **sourcePath**: `string`

Defined in: types.ts:28

Original file path where this was discovered

***

### type

> **type**: [`CustomizationType`](../enumerations/CustomizationType.md)

Defined in: types.ts:26

The type of customization
