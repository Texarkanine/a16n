# Function: getUniqueFilename()

> **getUniqueFilename**(`baseName`, `usedNames`, `extension`): `string`

Defined in: helpers.ts:53

Get a unique filename by appending a counter if the name already exists.

## Parameters

### baseName

`string`

The base name to start with

### usedNames

`Set`\<`string`\>

Set of already used names (will be mutated to add the result)

### extension

`string` = `''`

Optional extension to append (e.g., '.txt')

## Returns

`string`

A unique name not in usedNames
