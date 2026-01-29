# Interface: A16nPlugin

Defined in: plugin.ts:58

The plugin interface that all a16n plugins must implement.
Plugins bridge between a16n's internal model and a specific tool's format.

## Properties

### id

> **id**: `string`

Defined in: plugin.ts:60

Unique identifier, e.g., 'cursor', 'claude', 'codex'

***

### name

> **name**: `string`

Defined in: plugin.ts:62

Human-readable name

***

### supports

> **supports**: [`CustomizationType`](../enumerations/CustomizationType.md)[]

Defined in: plugin.ts:64

Which customization types this plugin supports

## Methods

### discover()

> **discover**(`root`): `Promise`\<[`DiscoveryResult`](DiscoveryResult.md)\>

Defined in: plugin.ts:71

Discover all agent customizations in a directory tree.

#### Parameters

##### root

`string`

The root directory to search

#### Returns

`Promise`\<[`DiscoveryResult`](DiscoveryResult.md)\>

All customizations found and any warnings

***

### emit()

> **emit**(`models`, `root`, `options?`): `Promise`\<[`EmitResult`](EmitResult.md)\>

Defined in: plugin.ts:80

Emit customization models to disk in this plugin's format.

#### Parameters

##### models

[`AgentCustomization`](AgentCustomization.md)[]

The customizations to emit

##### root

`string`

The root directory to write to

##### options?

[`EmitOptions`](EmitOptions.md)

Optional emit options (e.g., dryRun)

#### Returns

`Promise`\<[`EmitResult`](EmitResult.md)\>

Info about what was written (or would be written) and any issues
