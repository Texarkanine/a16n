# Interface: WrittenFile

Defined in: plugin.ts:17

Information about a file that was written.

## Properties

### isNewFile

> **isNewFile**: `boolean`

Defined in: plugin.ts:25

True if this file was created fresh; false if merged/edited existing

***

### itemCount

> **itemCount**: `number`

Defined in: plugin.ts:23

How many models went into this file (1 for 1:1, more if merged)

***

### path

> **path**: `string`

Defined in: plugin.ts:19

Path to the written file

***

### sourceItems?

> `optional` **sourceItems**: [`AgentCustomization`](AgentCustomization.md)[]

Defined in: plugin.ts:31

Which source AgentCustomizations contributed to this output file.
Optional for backwards compatibility.
Enables accurate git-ignore conflict detection in match mode.

***

### type

> **type**: [`CustomizationType`](../enumerations/CustomizationType.md)

Defined in: plugin.ts:21

Type of customization written
