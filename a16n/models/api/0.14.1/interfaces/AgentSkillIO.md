# Interface: AgentSkillIO

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / AgentSkillIO

# Interface: AgentSkillIO

Defined in: [types.ts:92](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L92)

Full AgentSkills.io standard skill.
Supports multiple resource files in the skill directory.

NOTE: Hooks are NOT part of AgentSkills.io and are not supported.
Skills with hooks should be skipped during discovery with a warning.

Use this type for skills that include:
- Resource files (checklists, configs, scripts)
- Multiple files in a skill directory

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

> **type**: [`AgentSkillIO`](../enumerations/CustomizationType.md#agentskillio)

Defined in: [types.ts:93](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L93)

The type of customization

#### Overrides

[`AgentCustomization`](AgentCustomization.md).[`type`](AgentCustomization.md#type)

***

### name

> **name**: `string`

Defined in: [types.ts:96](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L96)

Skill name (from frontmatter or directory name)

***

### description

> **description**: `string`

Defined in: [types.ts:99](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L99)

Description for activation matching (required)

***

### resources?

> `optional` **resources?**: `string`[]

Defined in: [types.ts:102](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L102)

Optional: Resource file paths relative to skill directory

***

### disableModelInvocation?

> `optional` **disableModelInvocation?**: `boolean`

Defined in: [types.ts:105](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L105)

Optional: If true, only invoked via /name

***

### files

> **files**: `Record`\<`string`, `string`\>

Defined in: [types.ts:111](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/types.ts#L111)

Map of additional files in the skill directory.
Key: relative path, Value: file content
