# Interface: Warning

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / Warning

# Interface: Warning

Defined in: [warnings.ts:31](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L31)

A warning about something that happened during conversion.
Warnings don't stop the conversion but should be surfaced to users.

## Properties

### code

> **code**: [`WarningCode`](../enumerations/WarningCode.md)

Defined in: [warnings.ts:33](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L33)

The type of warning

***

### message

> **message**: `string`

Defined in: [warnings.ts:35](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L35)

Human-readable description of the issue

***

### sources?

> `optional` **sources?**: `string`[]

Defined in: [warnings.ts:37](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L37)

Source files that were affected (optional)

***

### details?

> `optional` **details?**: `Record`\<`string`, `unknown`\>

Defined in: [warnings.ts:39](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L39)

Additional details about the warning (optional)
