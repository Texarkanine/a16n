# Function: resolveRoot()

> [**@a16njs/models**](../)

***

[@a16njs/models](../) / resolveRoot



> **resolveRoot**(`rootOrWorkspace`): `string`

Defined in: [workspace.ts:99](https://github.com/Texarkanine/a16n/blob/5715060b7361c854f95e5cc86c181602e116ca99/packages/models/src/workspace.ts#L99)

Helper to extract the root path from a string or Workspace argument.
Useful for plugins migrating to Workspace support.

## Parameters

### rootOrWorkspace

`string` \| [`Workspace`](../interfaces/Workspace.md)

A string root path or Workspace instance

## Returns

`string`

The root path string
