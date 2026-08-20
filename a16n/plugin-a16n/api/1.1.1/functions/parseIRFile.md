# Function: parseIRFile()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / parseIRFile

# Function: parseIRFile()

> **parseIRFile**(`rootOrWorkspace`, `filePath`, `filename`, `sourcePath`): `Promise`\<[`ParseIRFileResult`](../interfaces/ParseIRFileResult.md)\>

Defined in: [parse.ts:52](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/plugin-a16n/src/parse.ts#L52)

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
