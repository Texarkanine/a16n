# Function: discover()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / discover

# Function: discover()

> **discover**(`rootOrWorkspace`): `Promise`\<`DiscoveryResult`\>

Defined in: [discover.ts:56](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/plugin-a16n/src/discover.ts#L56)

Discover IR items from .a16n/ directory structure.

Scans the .a16n/ directory in the given root, parsing each type subdirectory
and returning all discovered IR items with any warnings.

## Parameters

### rootOrWorkspace

`string` \| `Workspace`

Project root directory or Workspace containing .a16n/

## Returns

`Promise`\<`DiscoveryResult`\>

DiscoveryResult with parsed IR items and warnings

## Example

```ts
const result = await discover('/path/to/project');
// result.items: AgentCustomization[]
// result.warnings: Warning[]
```
