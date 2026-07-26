# Task: Refuse conversion of Cursor skills with `paths:`

* Task ID: issue-148-cursor-skill-paths-refuse
* Complexity: Level 2
* Type: simple enhancement (conversion fidelity / fail-closed guard)

Cursor `.cursor/skills/*/SKILL.md` may declare harness-specific `paths:` scoping. a16n does not model that field, so discovery currently ignores it and conversion silently produces an always-applicable skill — widening scope. Per [#148](https://github.com/Texarkanine/a16n/issues/148) and operator decision: **refuse** (do not convert the item), never WARN-and-emit.

**Refuse = Claude `hooks:` pattern:** on discover, if the `paths` key is present in skill frontmatter → emit `WarningCode.Skipped`, push no IR item, continue. Do not model `paths` on the IR in this task.

## Test Plan (TDD)

### Behaviors to Verify

- [B1 refuse SimpleAgentSkill]: Cursor skill with `description` + `paths:` → no IR item from that skill; exactly one `Skipped` warning naming `paths` / scope
- [B2 refuse before other routes]: same `paths:` key on skills that would otherwise become `AgentSkillIO` (extra files) or `ManualPrompt` (`disable-model-invocation: true`) → still refused (check runs before classification)
- [B3 key presence]: `paths` key present with empty array (or otherwise empty) → still refused (mirror Claude `'hooks' in data`)
- [B4 unaffected]: skill with `description` and no `paths` key → still discovers as today
- [B5 message]: warning message makes clear conversion was refused because Cursor `paths:` scoping is not portable / would widen scope
- [Edge non-array]: `paths: "src/**"` (string) → refused (key present), not parsed into IR
- [Edge regression]: existing discover-skills / spec-field cases without `paths` still pass
- [B6 integration]: `cursor → claude` on a fixture skill with `paths:` → skill absent from `discovered` / not written under `.claude/skills/`; conversion warnings include the refuse `Skipped` for that source

### Test Infrastructure

- Framework: Vitest
- Test location: `packages/plugin-cursor/test/` (unit) and `packages/cli/test/integration/` (engine convert)
- Conventions: flat `discover-<domain>.test.ts`; probe helper `discoverProbeSkill()` already in `discover-skills.test.ts` for ephemeral frontmatter cases; CLI fixtures under `packages/cli/test/integration/fixtures/<name>/{from-cursor,...}`
- New test files: extend `packages/plugin-cursor/test/discover-skills.test.ts`; add one CLI integration describe (new fixture dir e.g. `cursor-skill-paths-refuse-to-claude`, or temp-written frontmatter inside an existing integration pattern) in `packages/cli/test/integration/integration-filerule-skill.test.ts` (or sibling skill integration file)
- Docs/memory: update assertions are manual / review — `systemPatterns.md`, `plugin-cursor` README (and Claude README only if it claims Cursor skill `paths:` converts)

## Implementation Plan

1. **Failing discover tests for `paths:` refuse**
   - Files: `packages/plugin-cursor/test/discover-skills.test.ts`
   - Changes: add describe covering B1–B5 and edges via `discoverProbeSkill` (and one AgentSkillIO-style probe with an extra file under the temp skill dir). Run; confirm red.

2. **Failing CLI integration for refuse end-to-end**
   - Files: `packages/cli/test/integration/integration-filerule-skill.test.ts` (or adjacent skill integration file); new fixture under `packages/cli/test/integration/fixtures/cursor-skill-paths-refuse-to-claude/`
   - Changes: assert B6 — `engine.convert({ source: 'cursor', target: 'claude', ... })` does not emit the skill; warning is `Skipped` and names `paths`. Run; confirm red (still no production change).

3. **Detect `paths` and skip before classification**
   - Files: `packages/plugin-cursor/src/discover.ts` (`parseSkillFrontmatter` and/or `discoverSkills`)
   - Changes: after successful YAML parse, if `'paths' in data` (raw gray-matter data), push `WarningCode.Skipped` with a clear message and `continue` — same control-flow position as Claude's `hasHooks` check in `packages/plugin-claude/src/discover.ts`. Do not add `paths` to `SkillFrontmatter` / IR types. Re-run steps 1–2 tests to green.

4. **Document the fail-closed case**
   - Files: `memory-bank/systemPatterns.md` (add Cursor skill `paths:` alongside `hooks:` / `allowed-tools` fail-closed cases; document Cursor `.cursor/skills` classification skip if missing); `packages/plugin-cursor/README.md` (skills discovery: `paths:` → skipped/refused); skim `packages/plugin-claude/README.md` / docs site only if they currently imply Cursor skill `paths:` survives or converts
   - Changes: state refusal semantics and that this is Category A (harness extension), not AgentSkills.io

5. **Verify package suite**
   - Files: n/a (commands)
   - Changes: run `packages/plugin-cursor` + affected CLI integration tests, then full workspace suite before calling build done; fix any fixture that unintentionally includes skill `paths:`

## Technology Validation

No new technology - validation not required

## Dependencies

- Existing Claude `hooks:` discover-skip pattern (`packages/plugin-claude/src/discover.ts`)
- Existing `WarningCode.Skipped` + warn-and-continue CLI reporting
- Operator decision: REFUSE, not WARN-and-emit; do not widen scope
- Out of scope: modeling `paths` on IR for cursor→cursor survival; changing whole-conversion exit codes beyond item-level skip

## Challenges & Mitigations

- **Refuse vs Skipped-with-emit confusion** (`allowed-tools` writes bytes + Skipped): Mitigation — never create an IR item when `paths` is present; tests assert `items` lack the skill and no emit path is exercised.
- **Target-aware emit refuse would violate discover rules**: Mitigation — refuse at discover (target-agnostic), accepting that cursor→cursor also refuses until a future task models `paths`. Matches projectbrief constraint (refusal, not survival).
- **False positive on Claude rule `paths:`**: Mitigation — change only Cursor skill frontmatter parsing in `plugin-cursor` discover; Claude FileRule `paths:` untouched.
- **Empty / malformed `paths` values**: Mitigation — key-presence check (`'paths' in data`), not value shape.

## Pre-Mortem

- **Plan treated “refuse” as non-zero process exit and bloated CLI/engine**: Keep item-level discover skip (hooks precedent); do not redesign convert exit policy in this task.
- **Plan modeled `paths` on IR “just in case” and turned into L3 Category A fidelity work**: Already cut — acceptance is refuse-only; survival is a later design if wanted.
- **Warning wording named AgentSkills.io for a non-spec Cursor key (wrong advisory axis)**: Message must name Cursor / non-portable scoping / widened scope, not “not in the spec” alone.

## Preflight Amendments

- Added B6 and ordered it as implementation step 2 (failing tests) before production step 3, so TDD encoding stays explicit per unit.
- CLI/engine integration fixture proves refuse is visible on `cursor → claude`, not only at unit discover (preflight radical-innovation, in-scope).

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [x] QA
