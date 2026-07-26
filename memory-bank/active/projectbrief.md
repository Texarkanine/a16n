# Project Brief

Implements [issue #143](https://github.com/Texarkanine/a16n/issues/143) — "Spec-compliant skill fields are silently dropped by the IR."

## User Story

As a developer converting agent skills with `a16n`, I want spec-compliant `SKILL.md` frontmatter to survive conversion, so that a converted skill still carries the license, environment requirements, and tool restrictions its author specified.

## Use-Case(s)

### Use-Case 1: Tool restrictions survive conversion

A Claude skill declares `allowed-tools: Bash(rm:*)`. Converting claude→cursor today emits a skill with no `allowed-tools` and no warning — the artifact is *more permissive* than the author specified. This is restriction-removing loss and must not be silent.

### Use-Case 2: Provenance and requirements survive conversion

A skill declares `license: Apache-2.0` and `compatibility: Requires Python 3.14+ and uv`. Both are dropped silently today. They should round-trip where the target can express them, and be reported where it cannot.

### Use-Case 3: The IR matches the spec it is shaped after

a16n's IR is modeled on the AgentSkills.io spec. A reader comparing `SimpleAgentSkill` / `AgentSkillIO` to the spec should not find spec fields missing from the IR without an explicit, recorded reason.

## Reference: current AgentSkills.io frontmatter

Fetched fresh from <https://agentskills.io/specification.md> on 2026-07-25.

| Field | Required | Constraints | Modeled by a16n IR today |
|---|---|---|---|
| `name` | Yes | Max 64 chars; lowercase `a-z0-9` and `-`; no leading/trailing/consecutive hyphens; must match parent dir name | Yes |
| `description` | Yes | 1–1024 chars, non-empty | Yes |
| `license` | No | License name or reference to a bundled license file | **No** |
| `compatibility` | No | 1–500 chars; environment requirements | **No** |
| `metadata` | No | Arbitrary string→string map for client-defined properties | **No** (IR's `metadata` is an unrelated, transient, never-serialized field) |
| `allowed-tools` | No | Space-separated string of pre-approved tools; **experimental**, support varies by implementation | **No** |

## Requirements

1. Extend the IR (`SimpleAgentSkill`, `AgentSkillIO` in `@a16njs/models`) to model the spec's optional frontmatter fields that are currently unmodeled.
2. Resolve the `metadata` name collision: the spec's `metadata` (persisted, author-authored) and the IR's existing `metadata` (transient, never serialized) are different concepts and cannot share a field.
3. Discover the new fields in every source plugin whose format carries them.
4. Emit the new fields in every target plugin whose format can express them.
5. Where a target cannot express a field, warn rather than drop silently — with disposition per the `systemPatterns.md` rule: restriction-removing loss fails closed (`Skipped`), visible/benign loss fails open (`Approximated`).
6. Round-trip the new fields through the `a16n` IR serialization format (`plugin-a16n`).
7. Update affected documentation (plugin READMEs, docs site, `systemPatterns.md` if invalidated).

## Constraints

1. **TDD throughout** — tests first, per workspace rule.
2. **Laziest solution that works** (ponytail): no speculative abstraction; add fields, not a field framework. Reuse existing warning machinery rather than inventing new.
3. No target-awareness in `discover()` — an established architectural invariant.
4. Warning wording references the AgentSkills.io spec, not a destination harness.
5. Do not recreate the #142 false-positive class.
6. `allowed-tools` is experimental in the spec; treat its *loss* as significant even though its *support* is not universal.
7. Do not break the existing `metadata` contract that plugins rely on to pass transient hints between discover and emit.

## Acceptance Criteria

1. The issue's reproduction case (`license: MIT` + `allowed-tools: Bash(rm:*)`, claude→cursor) either preserves both fields or raises a warning naming the loss — no silent drop.
2. Losing `allowed-tools` never passes silently.
3. Full suite green (`pnpm build`, `pnpm typecheck`, `pnpm test` with cache disabled at final verification).
4. Every new field is covered by discover tests, emit tests, and IR round-trip tests.
5. `memory-bank/` reflects any architectural facts this work invalidates.
