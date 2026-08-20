# Function: toWorkspace()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / toWorkspace

# Function: toWorkspace()

> **toWorkspace**(`rootOrWorkspace`, `id?`): [`Workspace`](../interfaces/Workspace.md)

Defined in: [workspace.ts:173](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/workspace.ts#L173)

Convert a string root path or Workspace instance to a Workspace.
If given a string, wraps it in a LocalWorkspace with the given id.
If given a Workspace, returns it unchanged.

## Parameters

### rootOrWorkspace

`string` \| [`Workspace`](../interfaces/Workspace.md)

A string root path or Workspace instance

### id?

`string` = `'default'`

Workspace id to use when wrapping a string (default: 'default')

## Returns

[`Workspace`](../interfaces/Workspace.md)

A Workspace instance
