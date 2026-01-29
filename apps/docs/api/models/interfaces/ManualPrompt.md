# Interface: ManualPrompt

Defined in: types.ts:79

A manually-invoked prompt (slash command or skill with disable-model-invocation).
Examples: Cursor commands in .cursor/commands/, skills with disable-model-invocation: true

These prompts are only activated when explicitly invoked by the user.

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

### promptName

> **promptName**: `string`

Defined in: types.ts:82

Prompt name for invocation (e.g., "review" for /review)

***

### sourcePath

> **sourcePath**: `string`

Defined in: types.ts:28

Original file path where this was discovered

#### Inherited from

[`AgentCustomization`](AgentCustomization.md).[`sourcePath`](AgentCustomization.md#sourcepath)

***

### type

> **type**: [`ManualPrompt`](../enumerations/CustomizationType.md#manualprompt)

Defined in: types.ts:80

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)
