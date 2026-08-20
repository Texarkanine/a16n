# Function: discover()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / discover

# Function: discover()

> **discover**(`rootOrWorkspace`): `Promise`\<`DiscoveryResult`\>

Defined in: [discover.ts:55](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/plugin-a16n/src/discover.ts#L55)

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
