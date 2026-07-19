# Function: inferGlobalPromptName()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / inferGlobalPromptName

# Function: inferGlobalPromptName()

> **inferGlobalPromptName**(`sourcePath`): `string`

Defined in: [helpers.ts:26](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/helpers.ts#L26)

Derives a canonical emission name from a source file path.

Handles edge cases:
- Leading-dot filenames:   `.cursorrules`    → `cursorrules`
- Double extensions:       `.cursorrules.md` → `cursorrules`
- Standard files:          `CLAUDE.md`       → `CLAUDE`
- Dot-less basenames:      `AGENTS.md`       → `AGENTS`
- Rule files:              `my-rule.mdc`     → `my-rule`

## Parameters

### sourcePath

`string`

The source file path; only the basename is used.

## Returns

`string`

The name to use for emission filenames (non-empty string).
