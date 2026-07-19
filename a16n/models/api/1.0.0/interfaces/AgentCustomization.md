# Interface: AgentCustomization

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / AgentCustomization

# Interface: AgentCustomization

Defined in: [types.ts:29](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L29)

Base interface for all agent customization items.
Every customization discovered or emitted extends this interface.

BREAKING CHANGES (Phase 9):
- `version` is now required (was not present)
- `sourcePath` is now optional (was required)
- `relativeDir` added as optional field for directory structure preservation

## Extended by

- [`GlobalPrompt`](GlobalPrompt.md)
- [`SimpleAgentSkill`](SimpleAgentSkill.md)
- [`AgentSkillIO`](AgentSkillIO.md)
- [`FileRule`](FileRule.md)
- [`AgentIgnore`](AgentIgnore.md)
- [`ManualPrompt`](ManualPrompt.md)

## Properties

### id

> **id**: `string`

Defined in: [types.ts:31](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L31)

Unique identifier for this item

***

### type

> **type**: [`CustomizationType`](../enumerations/CustomizationType.md)

Defined in: [types.ts:33](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L33)

The type of customization

***

### version

> **version**: `string`

Defined in: [types.ts:35](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L35)

IR version (required, e.g., 'v1beta1')

***

### sourcePath?

> `optional` **sourcePath?**: `string`

Defined in: [types.ts:37](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L37)

Original file path where this was discovered (optional, omitted in IR format)

***

### relativeDir?

> `optional` **relativeDir?**: `string`

Defined in: [types.ts:39](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L39)

Relative directory path for preserving directory structure (optional)

***

### content

> **content**: `string`

Defined in: [types.ts:41](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L41)

The actual prompt/rule content

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:43](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L43)

Tool-specific extras that don't fit the standard model (transient, not serialized in IR)
