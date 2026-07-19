# Function: emit()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / emit

# Function: emit()

> **emit**(`models`, `rootOrWorkspace`, `options?`): `Promise`\<`EmitResult`\>

Defined in: [emit.ts:56](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/plugin-a16n/src/emit.ts#L56)

Emit IR items to .a16n/ directory structure.

## Parameters

### models

`AgentCustomization`[]

IR items to emit

### rootOrWorkspace

`string` \| `Workspace`

Project root directory path or Workspace instance

### options?

`EmitOptions`

Emission options (dryRun, etc.)

## Returns

`Promise`\<`EmitResult`\>

EmitResult with written files and warnings
