# Project Brief

## User Story

As a developer converting agent skills with `a16n`, I want a skill's authored `description` to survive when the skill is classified as `ManualPrompt` (e.g. via `disable-model-invocation: true`), so that round-trips do not silently replace real prose with synthesized boilerplate.

## Use-Case(s)

### Use-Case 1

A Claude skill has `disable-model-invocation: true` and a real `description:`. Discovery classifies it as `ManualPrompt`. After convert through `.a16n/` and back (or to Cursor and back to Claude), that description is intact.

### Use-Case 2

A `ManualPrompt` with an authored description is emitted to a target that cannot carry a description (e.g. Cursor commands). The conversion warns naming the loss instead of silently substituting `"Invoke with /<promptName>"`.

### Use-Case 3

A Cursor-origin command (`ManualPrompt` with no description) still emits a valid skill when the target requires `description`, using the existing synthesize-when-absent behavior.

## Requirements

1. Preserve authored `description` on `ManualPrompt` when present (through discovery, IR, and emit).
2. Synthesize `"Invoke with /<promptName>"` only when no authored description is available and the target requires one.
3. When converting to a target that cannot carry the authored description, emit a warning naming the loss rather than substituting boilerplate silently.
4. Prefer option 1 from [#147](https://github.com/Texarkanine/a16n/issues/147): optional `description` on `ManualPrompt`. Re-evaluate at plan/build time whether `disable-model-invocation` special-casing is justified by harness adoption; do not pursue option 2 (invocation mode as a skill property) in this task unless research overturns the issue's lean.

## Constraints

1. `disable-model-invocation` is out of the AgentSkills.io spec; classifying those skills as `ManualPrompt` remains correct — do not reclassify them as model-invocable skills (that would widen the application surface).
2. TDD throughout; laziest solution that works.
3. Do not silently drop fidelity; warnings must name the loss.

## Acceptance Criteria

1. A Claude skill with `disable-model-invocation: true` and a real `description:` round-trips through `.a16n/` and back with that description intact.
2. Conversion to a target that cannot carry it produces a warning naming the loss, rather than substituting boilerplate silently.
