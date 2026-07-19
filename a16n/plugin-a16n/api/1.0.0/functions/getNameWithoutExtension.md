# Function: getNameWithoutExtension()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / getNameWithoutExtension

# Function: getNameWithoutExtension()

> **getNameWithoutExtension**(`filename`): `string`

Defined in: [utils.ts:55](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/plugin-a16n/src/utils.ts#L55)

Get filename without extension.
Uses path.parse().name to properly handle dotfiles (e.g., ".env" -> ".env").

## Parameters

### filename

`string`

Filename with extension

## Returns

`string`

Filename without extension
