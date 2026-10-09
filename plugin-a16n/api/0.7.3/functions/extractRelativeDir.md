# Function: extractRelativeDir()

> [**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / extractRelativeDir



> **extractRelativeDir**(`fullPath`, `baseDir`): `string` \| `undefined`

Defined in: [utils.ts:14](https://github.com/Texarkanine/a16n/blob/5715060b7361c854f95e5cc86c181602e116ca99/packages/plugin-a16n/src/utils.ts#L14)

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
