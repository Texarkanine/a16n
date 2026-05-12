# Task: SLOBAC Rework — Cursor Plugin Test Quality

* Task ID: slobac-rework-cursor-tests
* Complexity: Level 3
* Type: refactor (test quality)

Rework the plugin-cursor test suite to address all 10 findings from the SLOBAC audit. The audit identified 3× conditional-logic, 3× vacuous-assertion, and 4× semantic-redundancy smells. Several were introduced by the Commands→Skills migration on this branch; others predate it but affect the same test domain.

## Pinned Info

### Finding → File Mapping

Consolidated view of which files each finding affects and how findings overlap:

| Finding | Smell | File | Line | Action |
|---------|-------|------|------|--------|
| 1 | conditional-logic | discover-classification-priority.test.ts | L18 | DELETE (subsumed by finding 7) |
| 2 | conditional-logic | discover-classification-priority.test.ts | L27 | DELETE (subsumed by finding 8) |
| 3 | conditional-logic | discover-classification-priority.test.ts | L47 | REWORK fixture + add length assertion (finding 7b) |
| 4 | vacuous-assertion | discover-cursor-plugin.test.ts | L119 | Strengthen: toBeDefined() → toBe(exact) |
| 5 | vacuous-assertion | emit-global-prompt.test.ts | L151 | Strengthen: regex → toBe('My-Rules-v2.mdc') |
| 6 | vacuous-assertion | emit-skills.test.ts | L71 | Strengthen: regex → toBe('my-skill-v2') |
| 7 | semantic-redundancy | discover-classification-priority.test.ts L18,L47 ↔ discover-file-rule.test.ts L10 | — | DELETE L18; REWORK L47 (see finding 3) |
| 8 | semantic-redundancy | discover-classification-priority.test.ts L27 ↔ discover-simple-agent-skill-rules.test.ts L10 | — | DELETE L27 |
| 9 | semantic-redundancy | emit-skills.test.ts L96 ↔ emit-manual-prompt.test.ts L39 | — | DELETE L96 |
| 10 | semantic-redundancy | emit-skills.test.ts L119 ↔ emit-manual-prompt.test.ts L82 | — | DELETE L119 |

**Net effect:** 4 tests deleted (2 classification + 2 redundant ManualPrompt in emit-skills), 1 test reworked (new fixture), 3 assertions strengthened. Observed full-suite count: 133 (down from 137).

## Component Analysis

### Affected Components
- **discover-classification-priority.test.ts**: Delete 2 redundant tests (L18, L27), rework 1 test (L47) with a proper fixture that has both `globs` and `description` frontmatter to actually test precedence.
- **discover-cursor-plugin.test.ts**: Strengthen relativeDir assertions at L135-137 from `toBeDefined()` to exact string values.
- **emit-global-prompt.test.ts**: Strengthen special-characters sanitization assertion from regex to exact expected value.
- **emit-skills.test.ts**: Strengthen sanitization assertion (L91), delete ManualPrompt `describe` block (L95-138) containing 2 redundant tests. The remaining `collision handling` describe block stays.
- **New fixture**: `cursor-globs-and-description/from-cursor/.cursor/rules/both-fields.mdc` — a rule with both `globs` and `description` to test classification precedence.

### Cross-Module Dependencies
- No production code changes. All changes are test-only.
- The new fixture must be a valid `.mdc` file discoverable by `cursorPlugin.discover()`.
- `discover-file-rule.test.ts` and `discover-simple-agent-skill-rules.test.ts` are the canonical tests that absorb the deleted redundant tests — they already have the stronger oracles.

### Boundary Changes
- None. No public interfaces, APIs, or schemas change. Only test assertions and test file contents change.

## Open Questions

None — implementation approach is clear. The audit prescribes specific remediations for each finding. The only design choice (finding 7: delete vs rework L47) is resolved: option (b) — rework with a proper fixture — because it adds real coverage for a product capability (globs-takes-precedence) not currently tested anywhere.

## Test Plan (TDD)

Since this task is itself a test-quality refactor, TDD applies in a meta sense: we modify tests first (strengthening/deleting), then verify the suite still passes. No production code changes means no new failing-test phase — the strengthened assertions must pass against current production code.

### Behaviors to Verify

1. **Precedence test (reworked L47):** A rule with both `globs: **/*.ts` and `description: "some desc"` is classified as `FileRule` (not `SimpleAgentSkill`). This is the classification priority order from `systemPatterns.md`.
2. **relativeDir exact values (strengthened L119):** The three rule types in the deep-nested fixture have exact relativeDir values `'shared/niko'`, `'shared/niko/Core'`, `'shared/niko/Level1'`.
3. **Filename sanitization (strengthened L151):** `'My Rules (v2).md'` sanitizes to `'My-Rules-v2.mdc'` (per `sanitizeFilename` logic: basename → strip ext → replace non-alphanum runs → trim hyphens → append `.mdc`).
4. **Skill name sanitization (strengthened L71):** `'My Skill (v2)'` sanitizes to `'my-skill-v2'` (per `sanitizePromptName`: lowercase → replace non-alphanum → trim).
5. **No regressions:** Full suite passes with reduced test count (~132).

### Test Infrastructure

- Framework: Vitest
- Test location: `packages/plugin-cursor/test/`
- Conventions: One file per domain × direction (discover/emit). Flat layout. Shared helpers in `test/test-support/`.
- New test files: None
- New fixture: `test/fixtures/cursor-globs-and-description/from-cursor/.cursor/rules/both-fields.mdc`

### Integration Tests

No new integration tests. Existing discover integration tests are being corrected, not expanded (except the precedence test which gets a proper fixture).

## Implementation Plan

### Phase 1: Create precedence fixture

1. **Create fixture directory and file**
   - Files: `packages/plugin-cursor/test/fixtures/cursor-globs-and-description/from-cursor/.cursor/rules/both-fields.mdc`
   - Changes: New `.mdc` file with both `globs:` and `description:` frontmatter fields plus body content.

### Phase 2: Modify tests (TDD — assertions change before any code, but no code changes needed here)

2. **Rework discover-classification-priority.test.ts**
   - Files: `packages/plugin-cursor/test/discover-classification-priority.test.ts`
   - Changes:
     - DELETE test `'should classify rules with globs as FileRule'` (L18-25) — findings 1, 7.
     - DELETE test `'should classify rules with description (no globs) as SimpleAgentSkill'` (L27-34) — findings 2, 8.
     - REWORK test `'should classify rules with valid globs over description (globs takes precedence)'` (L47-56):
       - Point at new `cursor-globs-and-description` fixture.
       - Assert `result.items.toHaveLength(1)`.
       - Assert `result.items[0].type === FileRule`.
       - Optionally assert description is NOT used for classification (the item's type is FileRule, not SimpleAgentSkill).

3. **Strengthen discover-cursor-plugin.test.ts**
   - Files: `packages/plugin-cursor/test/discover-cursor-plugin.test.ts`
   - Changes: Replace three `toBeDefined()` assertions (L135-137) with exact value assertions:
     - `expect(mainRule?.relativeDir).toBe('shared/niko')`
     - `expect(coreRule?.relativeDir).toBe('shared/niko/Core')`
     - `expect(level1Rule?.relativeDir).toBe('shared/niko/Level1')`

4. **Strengthen emit-global-prompt.test.ts**
   - Files: `packages/plugin-cursor/test/emit-global-prompt.test.ts`
   - Changes: Replace `expect(filename).toMatch(/^[\w-]+\.mdc$/)` (L168) with `expect(filename).toBe('My-Rules-v2.mdc')`.

5. **Rework emit-skills.test.ts**
   - Files: `packages/plugin-cursor/test/emit-skills.test.ts`
   - Changes:
     - Replace `expect(entries[0]).toMatch(/^[\w-]+$/)` (L91) with `expect(entries[0]).toBe('my-skill-v2')` — finding 6.
     - DELETE entire `describe('ManualPrompt emission to .cursor/skills/ (as disable Skill)')` block (L95-138) containing 2 tests — findings 9, 10.
     - The `describe('collision handling')` block (L141-179) remains; it's the only ManualPrompt test in this file and is not redundant.

### Phase 3: Verify

6. **Run targeted test files**
   - Run each modified test file individually to verify changes are correct.

7. **Run full suite**
   - `pnpm test` in `packages/plugin-cursor` to verify 0 regressions and confirm reduced test count (133).

8. **Lint and build**
   - `pnpm build` in `packages/plugin-cursor` (package has no `lint` script; use repo root `pnpm lint` with turbo if needed).

## Technology Validation

No new technology — validation not required.

## Challenges & Mitigations

- **Precedence fixture correctness:** The new fixture must produce exactly 1 item classified as FileRule. Mitigation: verify by running the reworked test in isolation first.
- **Test count accuracy:** Deleting 4 tests from 137 yields 133. Mitigation: verified in full suite output.
- **Exact sanitization values:** The expected sanitized values (`'My-Rules-v2.mdc'`, `'my-skill-v2'`) are derived from reading the sanitizer source. Mitigation: confirmed by tracing `sanitizeFilename` and `sanitizePromptName` logic in `emit.ts`.

## Status

- [x] Component analysis complete
- [x] Open questions resolved (none identified)
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [ ] QA
