# Interface: ConversionOptions

> [**@a16njs/engine**](../)

[**@a16njs/engine**](../)

***

[@a16njs/engine](../) / ConversionOptions

# Interface: ConversionOptions

Defined in: [index.ts:23](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L23)

Options for a conversion operation.

## Properties

### source

> **source**: `string`

Defined in: [index.ts:25](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L25)

Source plugin ID

***

### target

> **target**: `string`

Defined in: [index.ts:27](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L27)

Target plugin ID

***

### root

> **root**: `string`

Defined in: [index.ts:29](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L29)

Project root directory

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [index.ts:31](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L31)

If true, only discover without writing

***

### sourceRoot?

> `optional` **sourceRoot?**: `string`

Defined in: [index.ts:33](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L33)

Override root for discovery (source plugin)

***

### targetRoot?

> `optional` **targetRoot?**: `string`

Defined in: [index.ts:35](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L35)

Override root for emission (target plugin)

***

### sourceWorkspace?

> `optional` **sourceWorkspace?**: `Workspace`

Defined in: [index.ts:37](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L37)

Workspace for source discovery (takes precedence over sourceRoot/root)

***

### targetWorkspace?

> `optional` **targetWorkspace?**: `Workspace`

Defined in: [index.ts:39](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L39)

Workspace for target emission (takes precedence over targetRoot/root)

***

### ~~rewritePathRefs?~~

> `optional` **rewritePathRefs?**: `boolean`

Defined in: [index.ts:44](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L44)

If true, rewrite path references in content during conversion.

#### Deprecated

Use `transformations: [new PathRewritingTransformation()]` instead.

***

### transformations?

> `optional` **transformations?**: `ContentTransformation`[]

Defined in: [index.ts:46](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/engine/src/index.ts#L46)

Content transformations to apply between discovery and emission
