# Interface: Warning

Defined in: warnings.ts:25

A warning about something that happened during conversion.
Warnings don't stop the conversion but should be surfaced to users.

## Properties

### code

> **code**: [`WarningCode`](../enumerations/WarningCode.md)

Defined in: warnings.ts:27

The type of warning

***

### details?

> `optional` **details**: `Record`\<`string`, `unknown`\>

Defined in: warnings.ts:33

Additional details about the warning (optional)

***

### message

> **message**: `string`

Defined in: warnings.ts:29

Human-readable description of the issue

***

### sources?

> `optional` **sources**: `string`[]

Defined in: warnings.ts:31

Source files that were affected (optional)
