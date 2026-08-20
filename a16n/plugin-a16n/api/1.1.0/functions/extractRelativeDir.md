# Function: extractRelativeDir()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / extractRelativeDir

# Function: extractRelativeDir()

> **extractRelativeDir**(`fullPath`, `baseDir`): `string` \| `undefined`

Defined in: [utils.ts:14](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/plugin-a16n/src/utils.ts#L14)

Extract relative directory from a full path relative to base directory.

Example:
- extractRelativeDir('.a16n/global-prompt/coding-standards.md', '.a16n') -> undefined
- extractRelativeDir('.a16n/global-prompt/shared/company/standards.md', '.a16n/global-prompt') -> 'shared/company'

## Parameters

### fullPath

`string`

Full path to the file

### baseDir

`string`

Base directory to extract relative path from

## Returns

`string` \| `undefined`

Relative directory or undefined if file is directly in baseDir
