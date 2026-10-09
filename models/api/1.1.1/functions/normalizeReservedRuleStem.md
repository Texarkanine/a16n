# Function: normalizeReservedRuleStem()

> [**@a16njs/models**](../)

***

[@a16njs/models](../) / normalizeReservedRuleStem



> **normalizeReservedRuleStem**(`stem`): `string`

Defined in: [helpers.ts:54](https://github.com/Texarkanine/a16n/blob/5715060b7361c854f95e5cc86c181602e116ca99/packages/models/src/helpers.ts#L54)

Rewrite stems that would collide with harness-level magic filenames when
emitted as rule files.

`AGENTS.md` is interpreted by AGENTS engines as an instruction file, not as
a generic rule artifact. Emitting rule content under that basename is unsafe
in rules directories. We canonicalize that stem to `AGENTSMD`.

## Parameters

### stem

`string`

## Returns

`string`
