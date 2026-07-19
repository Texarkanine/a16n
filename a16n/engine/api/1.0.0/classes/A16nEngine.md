# Class: A16nEngine

> [**@a16njs/engine**](../)

[**@a16njs/engine**](../)

***

[@a16njs/engine](../) / A16nEngine

# Class: A16nEngine

Defined in: [index.ts:103](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L103)

The a16n conversion engine.
Orchestrates plugins to discover and emit agent customizations.

## Constructors

### Constructor

> **new A16nEngine**(`plugins?`): `A16nEngine`

Defined in: [index.ts:111](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L111)

Create a new engine with the given plugins.

#### Parameters

##### plugins?

`A16nPlugin`[] = `[]`

Plugins to register (registered as 'bundled')

#### Returns

`A16nEngine`

## Methods

### registerPlugin()

> **registerPlugin**(`plugin`, `source?`): `void`

Defined in: [index.ts:123](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L123)

Register a plugin with the engine.

#### Parameters

##### plugin

`A16nPlugin`

The plugin to register

##### source?

`"bundled"` \| `"installed"`

Whether the plugin is bundled or installed

#### Returns

`void`

***

### discoverAndRegisterPlugins()

> **discoverAndRegisterPlugins**(`options?`): `Promise`\<[`DiscoverAndRegisterResult`](../interfaces/DiscoverAndRegisterResult.md)\>

Defined in: [index.ts:132](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L132)

Discover and register installed plugins from node_modules.

#### Parameters

##### options?

`PluginDiscoveryOptions`

Plugin discovery options

#### Returns

`Promise`\<[`DiscoverAndRegisterResult`](../interfaces/DiscoverAndRegisterResult.md)\>

Result with registered, skipped, and error info

***

### listPlugins()

> **listPlugins**(): [`PluginInfo`](../interfaces/PluginInfo.md)[]

Defined in: [index.ts:155](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L155)

List all registered plugins.

#### Returns

[`PluginInfo`](../interfaces/PluginInfo.md)[]

Array of plugin info

***

### getPlugin()

> **getPlugin**(`id`): `A16nPlugin` \| `undefined`

Defined in: [index.ts:169](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L169)

Get a plugin by its ID.

#### Parameters

##### id

`string`

The plugin ID

#### Returns

`A16nPlugin` \| `undefined`

The plugin or undefined if not found

***

### discover()

> **discover**(`pluginId`, `rootOrWorkspace`): `Promise`\<`DiscoveryResult`\>

Defined in: [index.ts:179](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L179)

Discover customizations using a specific plugin.

#### Parameters

##### pluginId

`string`

The plugin to use for discovery

##### rootOrWorkspace

`string` \| `Workspace`

The project root path or Workspace to scan

#### Returns

`Promise`\<`DiscoveryResult`\>

Discovery result with items and warnings

***

### convert()

> **convert**(`options`): `Promise`\<[`ConversionResult`](../interfaces/ConversionResult.md)\>

Defined in: [index.ts:195](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L195)

Convert customizations from one format to another.

#### Parameters

##### options

[`ConversionOptions`](../interfaces/ConversionOptions.md)

Conversion options

#### Returns

`Promise`\<[`ConversionResult`](../interfaces/ConversionResult.md)\>

Conversion result with discovered items, written files, and warnings
