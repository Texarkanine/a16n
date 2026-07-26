# Interface: DiscoverAndRegisterResult

> [**@a16njs/engine**](../)

[**@a16njs/engine**](../)

***

[@a16njs/engine](../) / DiscoverAndRegisterResult

# Interface: DiscoverAndRegisterResult

Defined in: [index.ts:90](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/engine/src/index.ts#L90)

Result of discovering and registering plugins.

## Properties

### registered

> **registered**: `string`[]

Defined in: [index.ts:92](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/engine/src/index.ts#L92)

Plugin IDs that were successfully registered

***

### skipped

> **skipped**: `string`[]

Defined in: [index.ts:94](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/engine/src/index.ts#L94)

Plugin IDs that were skipped (already registered)

***

### errors

> **errors**: `object`[]

Defined in: [index.ts:96](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/engine/src/index.ts#L96)

Errors encountered during discovery

#### packageName

> **packageName**: `string`

#### error

> **error**: `string`
