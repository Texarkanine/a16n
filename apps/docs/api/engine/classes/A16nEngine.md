# Class: A16nEngine

Defined in: index.ts:66

The a16n conversion engine.
Orchestrates plugins to discover and emit agent customizations.

## Constructors

### Constructor

> **new A16nEngine**(`plugins`): `A16nEngine`

Defined in: index.ts:73

Create a new engine with the given plugins.

#### Parameters

##### plugins

`A16nPlugin`[] = `[]`

Plugins to register

#### Returns

`A16nEngine`

## Methods

### convert()

> **convert**(`options`): `Promise`\<[`ConversionResult`](../interfaces/ConversionResult.md)\>

Defined in: index.ts:128

Convert customizations from one format to another.

#### Parameters

##### options

[`ConversionOptions`](../interfaces/ConversionOptions.md)

Conversion options

#### Returns

`Promise`\<[`ConversionResult`](../interfaces/ConversionResult.md)\>

Conversion result with discovered items, written files, and warnings

***

### discover()

> **discover**(`pluginId`, `root`): `Promise`\<`DiscoveryResult`\>

Defined in: index.ts:115

Discover customizations using a specific plugin.

#### Parameters

##### pluginId

`string`

The plugin to use for discovery

##### root

`string`

The project root to scan

#### Returns

`Promise`\<`DiscoveryResult`\>

Discovery result with items and warnings

***

### getPlugin()

> **getPlugin**(`id`): `A16nPlugin` \| `undefined`

Defined in: index.ts:105

Get a plugin by its ID.

#### Parameters

##### id

`string`

The plugin ID

#### Returns

`A16nPlugin` \| `undefined`

The plugin or undefined if not found

***

### listPlugins()

> **listPlugins**(): [`PluginInfo`](../interfaces/PluginInfo.md)[]

Defined in: index.ts:91

List all registered plugins.

#### Returns

[`PluginInfo`](../interfaces/PluginInfo.md)[]

Array of plugin info

***

### registerPlugin()

> **registerPlugin**(`plugin`): `void`

Defined in: index.ts:83

Register a plugin with the engine.

#### Parameters

##### plugin

`A16nPlugin`

The plugin to register

#### Returns

`void`
