# Class: LocalWorkspace

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / LocalWorkspace

# Class: LocalWorkspace

Defined in: [workspace.ts:115](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L115)

Workspace backed by the local filesystem.

All operations delegate to Node.js fs/promises.

## Example

```typescript
const ws = new LocalWorkspace('source', '/project');
const content = await ws.read('.cursor/rules/my-rule.mdc');
await ws.write('.claude/rules/my-rule.md', content);
```

## Implements

- [`Workspace`](../interfaces/Workspace.md)

## Constructors

### Constructor

> **new LocalWorkspace**(`id`, `root`): `LocalWorkspace`

Defined in: [workspace.ts:121](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L121)

Create a new LocalWorkspace.

#### Parameters

##### id

`string`

Unique identifier for this workspace

##### root

`string`

Absolute path to the workspace root directory

#### Returns

`LocalWorkspace`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [workspace.ts:122](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L122)

Unique identifier for this workspace

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`id`](../interfaces/Workspace.md#id)

***

### root

> `readonly` **root**: `string`

Defined in: [workspace.ts:123](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L123)

Absolute path to the workspace root directory

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`root`](../interfaces/Workspace.md#root)

## Methods

### resolve()

> **resolve**(`relativePath`): `string`

Defined in: [workspace.ts:126](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L126)

Resolve a relative path within this workspace to an absolute path.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`string`

Absolute path

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`resolve`](../interfaces/Workspace.md#resolve)

***

### exists()

> **exists**(`relativePath`): `Promise`\<`boolean`\>

Defined in: [workspace.ts:131](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L131)

Check if a path exists in this workspace.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<`boolean`\>

true if the path exists

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`exists`](../interfaces/Workspace.md#exists)

***

### read()

> **read**(`relativePath`): `Promise`\<`string`\>

Defined in: [workspace.ts:140](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L140)

Read a file from this workspace.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<`string`\>

File content as UTF-8 string

#### Throws

If the file does not exist

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`read`](../interfaces/Workspace.md#read)

***

### write()

> **write**(`relativePath`, `content`): `Promise`\<`void`\>

Defined in: [workspace.ts:144](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L144)

Write a file to this workspace.
Creates parent directories as needed.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

##### content

`string`

File content as UTF-8 string

#### Returns

`Promise`\<`void`\>

#### Throws

If the workspace is read-only

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`write`](../interfaces/Workspace.md#write)

***

### readdir()

> **readdir**(`relativePath`): `Promise`\<[`WorkspaceEntry`](../interfaces/WorkspaceEntry.md)[]\>

Defined in: [workspace.ts:150](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L150)

List entries in a directory.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<[`WorkspaceEntry`](../interfaces/WorkspaceEntry.md)[]\>

Array of directory entries

#### Throws

If the directory does not exist

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`readdir`](../interfaces/Workspace.md#readdir)

***

### mkdir()

> **mkdir**(`relativePath`): `Promise`\<`void`\>

Defined in: [workspace.ts:159](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L159)

Create a directory (and any missing parents).

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Workspace`](../interfaces/Workspace.md).[`mkdir`](../interfaces/Workspace.md#mkdir)
