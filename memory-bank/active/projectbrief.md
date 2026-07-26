# Project Brief

## User Story

As a developer converting Cursor skills with `a16n`, I want a skill that uses Cursor's harness-specific `paths:` scoping to refuse conversion rather than convert silently, so that the converted artifact never applies more broadly than the author intended.

## Use-Case(s)

### Use-Case 1

A Cursor `.cursor/skills/*/SKILL.md` declares `paths:` (scoping the skill to matching files). The user runs `cursor → claude` (or any non-Cursor target that cannot express that scoping). Conversion must refuse that skill — not emit an always-applicable skill.

### Use-Case 2

A Cursor skill without `paths:` continues to convert as today (including AgentSkills.io spec fields handled by #143).

## Requirements

1. Detect Cursor skill frontmatter that includes `paths:`.
2. Refuse conversion of that skill so scope is never widened by silent drop.
3. Surface the refusal clearly to the user (no silent success path for that item).
4. Leave skills without `paths:` unaffected.

## Constraints

1. Decision settled by operator: **REFUSE**, not WARN / Approximated / Skipped-with-emit. Dropping `paths:` widens scope; that must not happen.
2. Do **not** map skill `paths:` to FileRule: a globbed rule is always in scope on match; skill `paths:` only surfaces the description. That is a different activation contract (also a widening).
3. `paths:` is Category A (harness extension outside AgentSkills.io). Acceptance is refusal, not fidelity-preserving emit.
4. TDD throughout; prefer the existing unsupported / skip / warning machinery over new frameworks.
5. Follow-on from [#143](https://github.com/Texarkanine/a16n/issues/143) / [#148](https://github.com/Texarkanine/a16n/issues/148); do not reopen Category B spec-field work.

## Rework

Briefly tried FileRule translation; reverted. Refuse-all remains correct. Integration coverage needs only the **negative** refuse case (a positive FileRule conversion test is not applicable).

## Acceptance Criteria

1. A Cursor skill carrying `paths:` does not convert into a skill that applies everywhere.
2. Conversion of that skill is refused (hard fail for the item / conversion path as designed), with a clear message naming `paths:`.
3. Skills without `paths:` still convert successfully under existing coverage.
4. Full test suite green with cache disabled for affected packages / workspace as project norms require.
