# Function: normalizeReservedRuleStem()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / normalizeReservedRuleStem

# Function: normalizeReservedRuleStem()

> **normalizeReservedRuleStem**(`stem`): `string`

Defined in: [helpers.ts:54](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/helpers.ts#L54)

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
