# Interface: Workspace

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / Workspace

# Interface: Workspace

Defined in: [workspace.ts:39](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L39)

Abstraction over file operations, enabling local filesystem,
read-only (dry-run), and in-memory (testing) workspaces.

All paths passed to workspace methods are relative to the workspace root.
Implementations must handle path resolution internally.

## Example

```typescript
// Local filesystem workspace
const ws = new LocalWorkspace('source', '/project');
const content = await ws.read('.cursor/rules/my-rule.mdc');

// In-memory workspace for testing
const mem = new MemoryWorkspace('test');
await mem.write('file.md', '# Hello');
const exists = await mem.exists('file.md'); // true

// Read-only wrapper for dry-run
const readOnly = new ReadOnlyWorkspace(ws);
await readOnly.write('file.md', 'content'); // throws!
```

## Properties

### id

> `readonly` **id**: `string`

Defined in: [workspace.ts:41](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L41)

Unique identifier for this workspace

***

### root

> `readonly` **root**: `string`

Defined in: [workspace.ts:44](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L44)

The root path of the workspace (for path resolution and display)

## Methods

### resolve()

> **resolve**(`relativePath`): `string`

Defined in: [workspace.ts:51](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L51)

Resolve a relative path within this workspace to an absolute path.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`string`

Absolute path

***

### exists()

> **exists**(`relativePath`): `Promise`\<`boolean`\>

Defined in: [workspace.ts:58](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L58)

Check if a path exists in this workspace.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<`boolean`\>

true if the path exists

***

### read()

> **read**(`relativePath`): `Promise`\<`string`\>

Defined in: [workspace.ts:66](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L66)

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

***

### write()

> **write**(`relativePath`, `content`): `Promise`\<`void`\>

Defined in: [workspace.ts:75](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L75)

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

***

### readdir()

> **readdir**(`relativePath`): `Promise`\<[`WorkspaceEntry`](WorkspaceEntry.md)[]\>

Defined in: [workspace.ts:83](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L83)

List entries in a directory.

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<[`WorkspaceEntry`](WorkspaceEntry.md)[]\>

Array of directory entries

#### Throws

If the directory does not exist

***

### mkdir()

> **mkdir**(`relativePath`): `Promise`\<`void`\>

Defined in: [workspace.ts:89](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/workspace.ts#L89)

Create a directory (and any missing parents).

#### Parameters

##### relativePath

`string`

Path relative to workspace root

#### Returns

`Promise`\<`void`\>
