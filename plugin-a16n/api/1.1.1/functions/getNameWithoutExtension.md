# Function: getNameWithoutExtension()

> [**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / getNameWithoutExtension



> **getNameWithoutExtension**(`filename`): `string`

Defined in: [utils.ts:55](https://github.com/Texarkanine/a16n/blob/5715060b7361c854f95e5cc86c181602e116ca99/packages/plugin-a16n/src/utils.ts#L55)

Get filename without extension.
Uses path.parse().name to properly handle dotfiles (e.g., ".env" -> ".env").

## Parameters

### filename

`string`

Filename with extension

## Returns

`string`

Filename without extension
