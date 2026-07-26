# Function: getNameWithoutExtension()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / getNameWithoutExtension

# Function: getNameWithoutExtension()

> **getNameWithoutExtension**(`filename`): `string`

Defined in: [utils.ts:55](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/plugin-a16n/src/utils.ts#L55)

Get filename without extension.
Uses path.parse().name to properly handle dotfiles (e.g., ".env" -> ".env").

## Parameters

### filename

`string`

Filename with extension

## Returns

`string`

Filename without extension
