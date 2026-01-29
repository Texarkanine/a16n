# Interface: EmitResult

Defined in: plugin.ts:37

Result of emitting customizations to a project.

## Properties

### unsupported

> **unsupported**: [`AgentCustomization`](AgentCustomization.md)[]

Defined in: plugin.ts:43

Items that could not be represented by this plugin

***

### warnings

> **warnings**: [`Warning`](Warning.md)[]

Defined in: plugin.ts:41

Any warnings encountered during emission

***

### written

> **written**: [`WrittenFile`](WrittenFile.md)[]

Defined in: plugin.ts:39

Files that were written (or would be written in dry-run)
