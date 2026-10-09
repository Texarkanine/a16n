# Function: inferGlobalPromptName()

> [**@a16njs/models**](../)

***

[@a16njs/models](../) / inferGlobalPromptName



> **inferGlobalPromptName**(`sourcePath`): `string`

Defined in: [helpers.ts:26](https://github.com/Texarkanine/a16n/blob/5715060b7361c854f95e5cc86c181602e116ca99/packages/models/src/helpers.ts#L26)

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
