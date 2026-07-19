# Interface: WrittenFile

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / WrittenFile

# Interface: WrittenFile

Defined in: [plugin.ts:18](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L18)

Information about a file that was written.

## Properties

### path

> **path**: `string`

Defined in: [plugin.ts:20](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L20)

Path to the written file

***

### type

> **type**: [`CustomizationType`](../enumerations/CustomizationType.md)

Defined in: [plugin.ts:22](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L22)

Type of customization written

***

### itemCount

> **itemCount**: `number`

Defined in: [plugin.ts:24](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L24)

How many models went into this file (1 for 1:1, more if merged)

***

### isNewFile

> **isNewFile**: `boolean`

Defined in: [plugin.ts:26](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L26)

True if this file was created fresh; false if merged/edited existing

***

### sourceItems?

> `optional` **sourceItems?**: [`AgentCustomization`](AgentCustomization.md)[]

Defined in: [plugin.ts:32](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L32)

Which source AgentCustomizations contributed to this output file.
Optional for backwards compatibility.
Enables accurate git-ignore conflict detection in match mode.

***

### sourcePaths?

> `optional` **sourcePaths?**: `string`[]

Defined in: [plugin.ts:46](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L46)

Explicit source-relative paths this output file represents, used by
path-rewriting. When set (and non-empty), takes precedence over
`sourceItems[*].sourcePath` for `buildMapping` purposes.

Use for outputs that correspond to source paths that are not first-class
`AgentCustomization`s — e.g., AgentSkillIO resource files (scripts/*,
references/*, assets/*) whose underlying `sourceItems` points at the
skill's SKILL.md.

Paths must use POSIX separators to match the normalization applied in
`buildMapping`.
