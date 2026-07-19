# Function: formatIRFile()

> [**@a16njs/plugin-a16n**](../)

[**@a16njs/plugin-a16n**](../)

***

[@a16njs/plugin-a16n](../) / formatIRFile

# Function: formatIRFile()

> **formatIRFile**(`item`): `string`

Defined in: [format.ts:29](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/plugin-a16n/src/format.ts#L29)

Format an IR item as a markdown file with YAML frontmatter.

Format: ---\n{yaml}---\n\n{content}\n

Includes: version, type, relativeDir (if present), type-specific fields
Excludes: sourcePath (omitted from IR format), metadata (not serialized)
Note: name is included for SimpleAgentSkill (required in v1beta2); for other types it remains filename-only.

## Parameters

### item

`AgentCustomization`

The IR item to format

## Returns

`string`

Formatted markdown string with YAML frontmatter
