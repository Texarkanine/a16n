# Interface: ConversionResult

> [**@a16njs/engine**](../)

[**@a16njs/engine**](../)

***

[@a16njs/engine](../) / ConversionResult

# Interface: ConversionResult

Defined in: [index.ts:62](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L62)

Result of a conversion operation.

## Properties

### discovered

> **discovered**: `AgentCustomization`[]

Defined in: [index.ts:64](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L64)

Items discovered from source

***

### written

> **written**: `WrittenFile`[]

Defined in: [index.ts:66](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L66)

Files written to target

***

### warnings

> **warnings**: `Warning`[]

Defined in: [index.ts:68](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L68)

Warnings from discovery and emission

***

### unsupported

> **unsupported**: `AgentCustomization`[]

Defined in: [index.ts:70](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L70)

Items that couldn't be represented by target

***

### gitIgnoreChanges?

> `optional` **gitIgnoreChanges?**: [`GitIgnoreResult`](GitIgnoreResult.md)[]

Defined in: [index.ts:72](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L72)

Git-ignore changes made (if --gitignore-output-with was used)

***

### deletedSources?

> `optional` **deletedSources?**: `string`[]

Defined in: [index.ts:74](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L74)

Source files that were deleted (if --delete-source was used)
