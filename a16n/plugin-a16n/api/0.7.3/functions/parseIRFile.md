# Function: parseIRFile()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / parseIRFile

# Function: parseIRFile()

> **parseIRFile**(`rootOrWorkspace`, `filePath`, `filename`, `sourcePath`): `Promise`\<[`ParseIRFileResult`](../interfaces/ParseIRFileResult.md)\>

Defined in: [parse.ts:51](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/plugin-a16n/src/parse.ts#L51)

Parse an IR file from a workspace.

## Parameters

### rootOrWorkspace

`string` \| `Workspace`

Workspace or root path string

### filePath

`string`

Path to the file relative to workspace root

### filename

`string`

Filename (used to derive name)

### sourcePath

`string`

Path relative to .a16n/ directory (e.g., ".a16n/global-prompt/coding-standards.md")

## Returns

`Promise`\<[`ParseIRFileResult`](../interfaces/ParseIRFileResult.md)\>

ParseIRFileResult with either item or error
