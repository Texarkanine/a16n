# Task: M6 — Split plugin-cursor emit.test.ts

- Task ID: slobac-audit-remediation-m6
- Complexity: Level 2
- Type: simple enhancement / test-structure remediation (monolithic-test-file Finding 19)

Split `packages/plugin-cursor/test/emit.test.ts` into domain-specific Vitest modules with shared isolated temp workspaces (mirrors `@a16njs/plugin-claude` emit split + `suiteTempDir`). No behavioral or production-source changes — structural reorganization only.

## Test Plan (TDD)

### Behaviors to Verify

Each existing `it` in `emit.test.ts` remains a passing test with unchanged assertions:

- Cursor GlobalPrompt emission (single, multiple, sanitization, empty input) → same written paths, frontmatter, warnings.
- Cursor FileRule / SimpleAgentSkill / Mixed / AgentIgnore / ManualPrompt / Skills namespace cases → unchanged filesystem layout vs baselines.
- `sourceItems` tracking on WrittenFile → unchanged for each customization type tested.
- AgentSkillIO (simple/complex/`relativeDir`/`sourcePaths`) → unchanged outputs.
- Filename case preservation for FileRule + GlobalPrompt + collision semantics → unchanged.

### Parity Gates (blocking)

- **Emit suite**: 62 total `it` across all `emit-*.test.ts` files (baseline from monolith).
- **Package** `@a16njs/plugin-cursor`: 137 tests total unchanged vs pre-split baseline (discover + mdc unchanged).

### Test Infrastructure

- Framework: Vitest (package-local `vitest.config.ts`).
- Test location: `packages/plugin-cursor/test/`.
- Conventions: `emit-*.test.ts` filenames aligned with Claude plugin split naming; helpers under `test/test-support/` only.
- New test files: ten `emit-*.test.ts` files + `emit-helpers.ts`; remove monolith `emit.test.ts`.

## Implementation Plan

1. **Helper first** — Files: `test/test-support/emit-helpers.ts`
   - Add `suiteTempDir(import.meta.url, slug)` matching Claude pattern (nested `.temp-emit/<slug>/` under `test/`).
2. **`emit-global-prompt.test.ts`** — Lines / block: `'Cursor Plugin Emission'` subtree.
   - Wire `suiteTempDir(..., 'global-prompt')`; move tests verbatim from monolith; remove from monolith.
3. **`emit-file-rule.test.ts`** — Block: `'Cursor FileRule Emission'`.
   - Slug `file-rule`.
4. **`emit-simple-agent-skill.test.ts`** — Block: `'Cursor SimpleAgentSkill Emission'` (rules-path skills).
   - Slug `simple-agent-skill`.
5. **`emit-mixed-models.test.ts`** — Block: `'Cursor Mixed Emission'`.
   - Slug `mixed-models`.
6. **`emit-agent-ignore.test.ts`** — Block: `'Cursor AgentIgnore Emission'`.
   - Slug `agent-ignore`.
7. **`emit-manual-prompt.test.ts`** — Block: `'Cursor ManualPrompt Emission (Commands)'`.
   - Slug `manual-prompt`.
8. **`emit-skills.test.ts`** — Block: `'Cursor Skills Emission'`.
   - Slug `skills`.
9. **`emit-source-items.test.ts`** — Block: `'Cursor Plugin - sourceItems tracking'`.
   - Slug `source-items`.
10. **`emit-agent-skill-io.test.ts`** — Block: `'Cursor AgentSkillIO Emission'`.
    - Slug `agent-skill-io`.
11. **`emit-filename-case.test.ts`** — Block: `'filename case preservation'`.
    - Slug `filename-case`.
12. **Delete monolith** — Remove `packages/plugin-cursor/test/emit.test.ts`.
13. **Docs check** — `packages/docs/docs/plugin-development/index.md` already recommends `emit-*.test.ts`; optional note-only if Cursor-specific tree warranted (no README contract change).

## Technology Validation

No new technology — validation not required.

## Dependencies

- Vitest concurrency assumes isolated per-file temp dirs (`suiteTempDir`).

## Challenges & Mitigations

- Parallel tmp clashes if shared `.temp-emit-test` → **Mitigation:** unique slug per suite (Claude precedent).
- Off-by-one line extraction when mechanically splitting → **Mitigation:** verify brace balance per file before running Vitest.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [ ] QA
- [ ] Reflect
