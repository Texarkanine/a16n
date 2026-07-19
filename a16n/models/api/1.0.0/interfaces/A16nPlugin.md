# Interface: A16nPlugin

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / A16nPlugin

# Interface: A16nPlugin

Defined in: [plugin.ts:84](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L84)

The plugin interface that all a16n plugins must implement.
Plugins bridge between a16n's internal model and a specific tool's format.

## Properties

### id

> **id**: `string`

Defined in: [plugin.ts:86](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L86)

Unique identifier, e.g., 'cursor', 'claude', 'codex'

***

### name

> **name**: `string`

Defined in: [plugin.ts:88](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L88)

Human-readable name

***

### supports

> **supports**: [`CustomizationType`](../enumerations/CustomizationType.md)[]

Defined in: [plugin.ts:90](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L90)

Which customization types this plugin supports

***

### pathPatterns?

> `optional` **pathPatterns?**: [`PluginPathPatterns`](PluginPathPatterns.md)

Defined in: [plugin.ts:92](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L92)

Path patterns for this plugin's file format (used by transformations)

## Methods

### discover()

> **discover**(`rootOrWorkspace`): `Promise`\<[`DiscoveryResult`](DiscoveryResult.md)\>

Defined in: [plugin.ts:99](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L99)

Discover all agent customizations in a directory tree.

#### Parameters

##### rootOrWorkspace

`string` \| [`Workspace`](Workspace.md)

The root directory path or Workspace to search

#### Returns

`Promise`\<[`DiscoveryResult`](DiscoveryResult.md)\>

All customizations found and any warnings

***

### emit()

> **emit**(`models`, `rootOrWorkspace`, `options?`): `Promise`\<[`EmitResult`](EmitResult.md)\>

Defined in: [plugin.ts:108](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/plugin.ts#L108)

Emit customization models to disk in this plugin's format.

#### Parameters

##### models

[`AgentCustomization`](AgentCustomization.md)[]

The customizations to emit

##### rootOrWorkspace

`string` \| [`Workspace`](Workspace.md)

The root directory path or Workspace to write to

##### options?

[`EmitOptions`](EmitOptions.md)

Optional emit options (e.g., dryRun)

#### Returns

`Promise`\<[`EmitResult`](EmitResult.md)\>

Info about what was written (or would be written) and any issues
