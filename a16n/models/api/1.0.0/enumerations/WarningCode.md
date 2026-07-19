# Enumeration: WarningCode

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / WarningCode

# Enumeration: WarningCode

Defined in: [warnings.ts:4](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L4)

Warning codes indicating the type of issue encountered.

## Enumeration Members

### Merged

> **Merged**: `"merged"`

Defined in: [warnings.ts:6](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L6)

Multiple items were collapsed into one file

***

### Approximated

> **Approximated**: `"approximated"`

Defined in: [warnings.ts:8](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L8)

Feature was translated imperfectly

***

### Skipped

> **Skipped**: `"skipped"`

Defined in: [warnings.ts:10](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L10)

Feature was not supported and omitted

***

### Overwritten

> **Overwritten**: `"overwritten"`

Defined in: [warnings.ts:12](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L12)

Existing file was replaced

***

### FileRenamed

> **FileRenamed**: `"file-renamed"`

Defined in: [warnings.ts:14](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L14)

File was renamed to avoid collision

***

### BoundaryCrossing

> **BoundaryCrossing**: `"boundary-crossing"`

Defined in: [warnings.ts:16](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L16)

Git-ignored source with tracked output (or vice versa)

***

### GitStatusConflict

> **GitStatusConflict**: `"git-status-conflict"`

Defined in: [warnings.ts:18](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L18)

Sources have conflicting git status (some ignored, some tracked)

***

### VersionMismatch

> **VersionMismatch**: `"version-mismatch"`

Defined in: [warnings.ts:20](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L20)

IR file version is incompatible with current reader version

***

### OrphanPathRef

> **OrphanPathRef**: `"orphan-path-ref"`

Defined in: [warnings.ts:22](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L22)

A path reference in content points to a source-format file not in the conversion set

***

### OperationFailed

> **OperationFailed**: `"operation-failed"`

Defined in: [warnings.ts:24](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/warnings.ts#L24)

A post-conversion operation (e.g. gitignore cleanup) failed
