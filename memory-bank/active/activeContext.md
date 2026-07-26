# Active Context

## Current Task: issue-143-spec-field-fidelity
**Phase:** BUILD - COMPLETE

## What Was Done

All 13 planned steps are implemented. Cache-disabled verification: **1147 tests** green across 9 packages; `build` and `typecheck` clean.

The four AgentSkills.io spec fields (`license`, `compatibility`, `metadata`, `allowed-tools`) now survive conversion end to end:

- **`@a16njs/models`** — `AgentSkillSpecFields` is carried by `SimpleAgentSkill`, `AgentSkillIO`, and `ManualPrompt`. `extractSpecFields()` and `formatSpecFieldsYaml()` sit together in `agentskills-io.ts` as reader and writer, so the four spec key names are spelled in exactly one file. IR is `v1beta3`.
- **`plugin-claude`** — discovers and re-emits all four verbatim, no warnings (Claude honors them).
- **`plugin-cursor`** — `src/skill-field-support.ts` holds the OQ3 disposition table; all five emit sites route through one `specFieldsFor()` helper that resolves the fields and records the warning together. `SKILL.md` carries everything; `.mdc` carries nothing; `allowed-tools` warns either way.
- **`plugin-a16n`** — spec fields round-trip through `.a16n/` under spec key names, with `specMetadata` written as `metadata:`.

## Notable Deviations from Plan

- **Hoisted the frontmatter renderer into `models`** (not planned). `plugin-cursor` needed the renderer `plugin-claude` already had, and copying it would have put the spec key names in three files. `formatSpecFieldsYaml` is now the exported inverse of `extractSpecFields`.
- **Step 7's red was an import error, not assertion failures** — the implementation was written directly after the test rather than stubbing first. Steps 9 and 10 followed the intended a/b/c/d cycle.

## Verification Worth Trusting

The step-10 property test was **mutation-verified**: stubbing the cursor renderer to return `''` fails exactly the 14 combinations that carry inert fields. It is not vacuous.

## Follow-Ups Filed

- [#147](https://github.com/Texarkanine/a16n/issues/147) — `ManualPrompt` discards the authored `description`.
- [#148](https://github.com/Texarkanine/a16n/issues/148) — Cursor skill `paths:` is unmodelled.

## Next Step

QA phase — post-implementation semantic review (required before reflect for L2+).
