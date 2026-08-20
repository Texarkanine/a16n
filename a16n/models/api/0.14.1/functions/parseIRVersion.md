# Function: parseIRVersion()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / parseIRVersion

# Function: parseIRVersion()

> **parseIRVersion**(`version`): [`ParsedIRVersion`](../interfaces/ParsedIRVersion.md) \| `null`

Defined in: [version.ts:47](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/version.ts#L47)

Parse an IR version string into its components.

## Parameters

### version

`string`

The version string to parse (e.g., 'v1beta1')

## Returns

[`ParsedIRVersion`](../interfaces/ParsedIRVersion.md) \| `null`

Parsed version components or null if invalid

## Example

```ts
parseIRVersion('v1beta1') // { major: 1, stability: 'beta', revision: 1 }
parseIRVersion('v2alpha3') // { major: 2, stability: 'alpha', revision: 3 }
parseIRVersion('v11') // { major: 1, stability: '', revision: 1 }
parseIRVersion('v1') // null (missing trailing revision number)
```
