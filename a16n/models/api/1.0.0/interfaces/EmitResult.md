# Interface: EmitResult

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / EmitResult

# Interface: EmitResult

Defined in: [plugin.ts:52](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L52)

Result of emitting customizations to a project.

## Properties

### written

> **written**: [`WrittenFile`](WrittenFile.md)[]

Defined in: [plugin.ts:54](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L54)

Files that were written (or would be written in dry-run)

***

### warnings

> **warnings**: [`Warning`](Warning.md)[]

Defined in: [plugin.ts:56](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L56)

Any warnings encountered during emission

***

### unsupported

> **unsupported**: [`AgentCustomization`](AgentCustomization.md)[]

Defined in: [plugin.ts:58](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L58)

Items that could not be represented by this plugin
