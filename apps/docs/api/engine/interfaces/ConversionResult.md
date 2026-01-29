# Interface: ConversionResult

Defined in: index.ts:37

Result of a conversion operation.

## Properties

### deletedSources?

> `optional` **deletedSources**: `string`[]

Defined in: index.ts:49

Source files that were deleted (if --delete-source was used)

***

### discovered

> **discovered**: `AgentCustomization`[]

Defined in: index.ts:39

Items discovered from source

***

### gitIgnoreChanges?

> `optional` **gitIgnoreChanges**: [`GitIgnoreResult`](GitIgnoreResult.md)[]

Defined in: index.ts:47

Git-ignore changes made (if --gitignore-output-with was used)

***

### unsupported

> **unsupported**: `AgentCustomization`[]

Defined in: index.ts:45

Items that couldn't be represented by target

***

### warnings

> **warnings**: `Warning`[]

Defined in: index.ts:43

Warnings from discovery and emission

***

### written

> **written**: `WrittenFile`[]

Defined in: index.ts:41

Files written to target
