# Project Brief

## User Story

As a developer converting Cursor skills with `a16n`, I want a bare skill that uses Cursor's `paths:` scoping to become a FileRule on those globs, so the converted artifact keeps the same file scope instead of applying everywhere — and only refuse when that translation is impossible.

## Use-Case(s)

### Use-Case 1

A bare Cursor `.cursor/skills/*/SKILL.md` declares `paths:` (and has no ride-along files). `cursor → claude` emits a Claude rule with matching `paths:` frontmatter (FileRule), not an unscoped skill.

### Use-Case 2

A Cursor skill with `paths:` and resource files (`AgentSkillIO`), or with `disable-model-invocation`, cannot become a FileRule without losing semantics — conversion refuses that item (`Skipped`).

### Use-Case 3

A Cursor skill without `paths:` continues to convert as today (including AgentSkills.io spec fields handled by #143).

## Requirements

1. Detect Cursor skill frontmatter that includes `paths:`.
2. Classify bare skills with non-empty `paths:` as FileRule (globs = paths).
3. Refuse `AgentSkillIO`/`ManualPrompt` + `paths:` so scope is never widened by silent drop.
4. Leave skills without `paths:` unaffected.

## Constraints

1. Operator rework: a bare Cursor skill with `paths:` is the same scoping contract as a globbed FileRule — classify as FileRule (preserve scope). Do **not** refuse that case.
2. Refuse only when FileRule translation is impossible: ride-along resources (`AgentSkillIO`) or `disable-model-invocation` (slash-only). Dropping `paths:` must never silently widen scope.
3. TDD throughout; prefer existing FileRule emit over new IR fields.
4. Follow-on from [#143](https://github.com/Texarkanine/a16n/issues/143) / [#148](https://github.com/Texarkanine/a16n/issues/148); do not reopen Category B spec-field work.

## Acceptance Criteria

1. A bare Cursor skill with `paths:` discovers as a FileRule whose globs match those paths and converts without widening scope.
2. `AgentSkillIO` / ManualPrompt skills with `paths:` are refused (`Skipped`) with a clear message — not emitted as unscoped skills.
3. Skills without `paths:` still convert successfully under existing coverage.
4. Full test suite green for affected packages / workspace as project norms require.

## Rework

Operator clarified after initial refuse-all implementation: Cursor's migrator not knowing skill `paths:` is irrelevant; a16n should translate SimpleAgentSkill+`paths:` → FileRule.
