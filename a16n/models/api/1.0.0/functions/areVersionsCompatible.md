# Function: areVersionsCompatible()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / areVersionsCompatible

# Function: areVersionsCompatible()

> **areVersionsCompatible**(`readerVersion`, `fileVersion`): `boolean`

Defined in: [version.ts:80](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/version.ts#L80)

Check if two IR versions are compatible.

Compatibility rules (forward compatibility guarantee):
1. Major versions must match
2. Stability must match (alpha != beta != stable)
3. Reader revision >= file revision (newer reader can read older files)

## Parameters

### readerVersion

`string`

The version of the reader (current a16n version)

### fileVersion

`string`

The version found in the IR file

## Returns

`boolean`

true if compatible, false otherwise

## Example

```ts
areVersionsCompatible('v1beta2', 'v1beta1') // true (reader newer)
areVersionsCompatible('v1beta1', 'v1beta2') // false (file too new)
areVersionsCompatible('v2beta1', 'v1beta1') // false (major mismatch)
areVersionsCompatible('v1stable1', 'v1beta1') // false (stability mismatch)
```
