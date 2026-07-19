# Function: getUniqueFilename()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / getUniqueFilename

# Function: getUniqueFilename()

> **getUniqueFilename**(`baseName`, `usedNames`, `extension?`): `string`

Defined in: [helpers.ts:113](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/helpers.ts#L113)

Get a unique filename by appending a counter if the name already exists.

## Parameters

### baseName

`string`

The base name to start with

### usedNames

`Set`\<`string`\>

Set of already used names (will be mutated to add the result)

### extension?

`string` = `''`

Optional extension to append (e.g., '.txt')

## Returns

`string`

A unique name not in usedNames
