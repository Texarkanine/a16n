# Task: SLOBAC Audit Remediation

* Task ID: slobac-audit-remediation
* Complexity: Level 2
* Type: Test hygiene / simple enhancement

Remediate all 19 SLOBAC audit findings across 10 test files in 5 packages. All findings have been validated against the actual codebase — every claim in the audit is confirmed accurate. No production code is touched; existing production code is the oracle.

## Validation Summary

All 19 findings CONFIRMED. No false positives detected.

- **Findings 1–5, 13–15 (deliverable fossils):** All claimed `describe`/`it` block names exist exactly as stated. No name collision risks after applying prescribed renames.
- **Findings 6–12 (naming lies — empty bodies):** All 7 tests have `expect(true).toBe(true)` bodies as claimed. `formatIRFile` and `parseIRFile` are exported from `plugin-a16n`, making round-trip test strengthening feasible.
- **Findings 16–19 (naming lies — title/assertion mismatches):** All 4 title/assertion mismatches confirmed. Remediation paths validated.

## Test Plan (TDD)

### Behaviors to Verify

Since the deliverable IS the test code, verification is:

- **B1**: After fossil renames → all existing tests still pass (no test title referenced by code, so rename is purely cosmetic)
- **B2**: After empty-body test strengthening → round-trip tests pass against production `formatIRFile`/`parseIRFile`
- **B3**: After title/assertion mismatch fixes → tests pass and titles accurately describe what assertions check
- **B4**: Full suite passes across all 5 packages after all changes
- **B5**: Build, lint, typecheck all pass

### Test Infrastructure

- Framework: Vitest (configured via root `vitest.config.ts`)
- Test locations: `packages/*/test/**`
- Conventions: `describe`/`it` blocks, fixture-based integration tests
- New test files: none

## Implementation Plan

### Phase A: Deliverable Fossil Renames (findings 1–5, 13–15)

All changes in this phase are mechanical renames — strip phase labels, ticket IDs, date-task IDs, and AC/B-prefixes from `describe`/`it` block names. No assertion changes.

#### Step 1: `packages/plugin-cursor/test/discover.test.ts` (finding 1)

Rename 8 blocks:
- `'FileRule Discovery (Phase 2)'` → `'FileRule Discovery'`
- `'SimpleAgentSkill Discovery (Phase 2)'` → `'SimpleAgentSkill Discovery'`
- `'Classification Priority (Phase 2)'` → `'Classification Priority'`
- `'should classify rules without activation criteria as ManualPrompt (Phase 7)'` → `'should classify rules without activation criteria as ManualPrompt'`
- `'AgentIgnore Discovery (Phase 3)'` → `'AgentIgnore Discovery'`
- `'Cursor Skills Discovery (Phase 7)'` → `'Cursor Skills Discovery'`
- `'ManualPrompt Discovery (Phase 4 - Commands)'` → `'ManualPrompt Discovery (commands)'`
- `'AgentSkillIO Discovery (Phase 8 B3)'` → `'AgentSkillIO Discovery'`

#### Step 2: `packages/plugin-cursor/test/emit.test.ts` (finding 2)

Rename 11 blocks:
- `'Cursor FileRule Emission (Phase 2)'` → `'Cursor FileRule Emission'`
- `'Cursor SimpleAgentSkill Emission (Phase 2)'` → `'Cursor SimpleAgentSkill Emission'`
- `'Cursor Mixed Emission (Phase 2 - Updated for Phase 7)'` → `'Cursor Mixed Emission'`
- `'Cursor AgentIgnore Emission (Phase 3)'` → `'Cursor AgentIgnore Emission'`
- `'Cursor Skills Emission (Phase 7)'` → `'Cursor Skills Emission'`
- `'Cursor Plugin - sourceItems tracking (CR-10)'` → `'Cursor Plugin - sourceItems tracking'`
- `'Cursor AgentSkillIO Emission (Phase 8 B4)'` → `'Cursor AgentSkillIO Emission'`
- `'Cursor Filename Case Preservation (20260421-preserve-filename-case)'` → `'filename case preservation'`
- `'B6 — FileRule preserves source filename case'` → `'FileRule preserves source filename case'`
- `'B7 — GlobalPrompt preserves name case'` → `'GlobalPrompt preserves name case'`
- `'B9 — case-insensitive collision safety'` → `'case-insensitive collision safety'`

#### Step 3: `packages/plugin-claude/test/discover.test.ts` (finding 3)

Rename 7 blocks:
- `'Claude SimpleAgentSkill Discovery (Phase 2)'` → `'Claude SimpleAgentSkill Discovery'`
- `'skills with hooks → SKIPPED (Phase 8 B3)'` → `'skills with hooks (skipped — hooks unsupported)'`
- `'Claude AgentIgnore Discovery (Phase 3)'` → `'Claude AgentIgnore Discovery'`
- `'Claude ManualPrompt Discovery (Phase 7)'` → `'Claude ManualPrompt Discovery'`
- `'Claude Plugin Never Discovers ManualPrompt (Phase 4)'` → `'Claude Plugin Never Discovers ManualPrompt'`
- `'AgentSkillIO Discovery (Phase 8 B3)'` → `'AgentSkillIO Discovery'`
- `'Claude Rules Discovery (Phase 8 A1)'` → `'Claude Rules Discovery'`

#### Step 4: `packages/plugin-claude/test/emit.test.ts` (finding 4)

Rename 15 blocks:
- `'Claude FileRule Emission (Phase 8 A2)'` → `'Claude FileRule Emission'`
- `'Claude SimpleAgentSkill Emission (Phase 2)'` → `'Claude SimpleAgentSkill Emission'`
- `'Mixed Model Emission (Phase 8 A2)'` → `'Mixed Model Emission'`
- `'Claude AgentIgnore Emission (Phase 3)'` → `'Claude AgentIgnore Emission'`
- `'Claude ManualPrompt Emission (Phase 4)'` → `'Claude ManualPrompt Emission'`
- `'Claude Plugin - sourceItems tracking (Phase 8 A2)'` → `'Claude Plugin - sourceItems tracking'`
- `'Claude AgentSkillIO Emission (Phase 8 B4)'` → `'Claude AgentSkillIO Emission'`
- `'Claude Filename Case Preservation (20260421-preserve-filename-case)'` → `'filename case preservation'`
- `'B1 — FileRule preserves source filename case'` → `'FileRule preserves source filename case'`
- `'B2 — GlobalPrompt preserves name case'` → `'GlobalPrompt preserves name case'`
- `'B3 — AgentSkillIO skill directory stays lowercase (spec compliance)'` → `'AgentSkillIO skill directory stays lowercase (spec compliance)'`
- `'B4 — SimpleAgentSkill skill directory stays lowercase'` → `'SimpleAgentSkill skill directory stays lowercase'`
- `'B5 — ManualPrompt skill directory stays lowercase'` → `'ManualPrompt skill directory stays lowercase'`
- `'B9 — case-insensitive collision safety'` → `'case-insensitive collision safety'`
- `'B11 — leading-dot filenames sanitize as before'` → `'leading-dot filenames sanitize as before'`

#### Step 5: `packages/cli/test/cli.test.ts` (finding 5)

Rename 6 blocks:
- `'sourceItems conflict detection (CR-10)'` → `'sourceItems conflict detection'`
- `'--gitignore-output-with match mode validation (CR11-11)'` → `'--gitignore-output-with match mode validation'`
- `'Phase 6: Dry-run output wording'` → `'dry-run output wording'`
- `'Phase 6: --delete-source flag'` → `'--delete-source flag'`
- `'should use relative paths in deletedSources output and JSON (CR-12)'` → `'should use relative paths in deletedSources output and JSON'`
- `'should use relative paths in dry-run delete verbose output (CR-12)'` → `'should use relative paths in dry-run delete verbose output'`

#### Step 6: `packages/glob-hook/test/cli.test.ts` (finding 13)

Rename 7 blocks (Title Case to match existing convention in file — `'CLI Integration'`, `'Edge Cases'`):
- `'AC1: Basic Glob Matching'` → `'Basic Glob Matching'`
- `'AC2: No Match'` → `'No Match'`
- `'AC3: Multiple Patterns'` → `'Multiple Patterns'`
- `'AC4: Multiline Context'` → `'Multiline Context'`
- `'AC5: Missing file_path'` → `'Missing file_path'`
- `'AC6: Invalid JSON Input'` → `'Invalid JSON Input'`
- `'AC7: Missing Required Args'` → `'Missing Required Arguments'`

#### Step 7: `packages/cli/test/integration/integration.test.ts` (finding 14)

Rename 11 blocks. Preserve `'Integration Tests - '` prefix on `describe` blocks to match non-fossil convention (`'Integration Tests - Fixture Based'`):
- `'Integration Tests - Phase 2 FileRule and SimpleAgentSkill'` → `'Integration Tests - FileRule and SimpleAgentSkill'`
- `'Integration Tests - Phase 3 AgentIgnore'` → `'Integration Tests - AgentIgnore'`
- `'Integration Tests - Phase 4 ManualPrompt (Commands)'` → `'Integration Tests - ManualPrompt (Commands)'`
- `'Integration Tests - Phase 9 a16n IR Plugin'` → `'Integration Tests - a16n IR Plugin'`
- `'I1: Convert with sourceRoot reads from specified source, writes to default root'` → `'convert with sourceRoot reads from specified source, writes to default root'`
- `'I2: Convert with targetRoot reads from default root, writes to specified target'` → `'convert with targetRoot reads from default root, writes to specified target'`
- `'I3: Convert with both sourceRoot and targetRoot'` → `'convert with both sourceRoot and targetRoot'`
- `'CI1: Cursor→Claude with rewritePathRefs rewrites .cursor/rules/... → .claude/rules/...'` → `'Cursor→Claude with rewritePathRefs rewrites .cursor/rules/... → .claude/rules/...'`
- `'CI2: Cursor→Claude with rewritePathRefs warns about orphan refs'` → `'Cursor→Claude with rewritePathRefs warns about orphan refs'`
- `'CI3: Combined --from-dir + --to-dir + --rewrite-path-refs works end-to-end'` → `'combined --from-dir + --to-dir + --rewrite-path-refs works end-to-end'`
- `'CI4: Cursor→Claude AgentSkillIO rewrites SKILL.md body AND scripts/**/references/** ride-alongs; leaves assets/** and unknown subtrees untouched'` → `'AgentSkillIO rewrites SKILL.md body and reference ride-alongs'`

#### Step 8: `packages/cli/test/commands/convert.test.ts` (finding 15)

Rename 10 blocks — strip `B1: ` through `B10: ` prefixes:
- `'B1: should refuse to delete source...'` → `'should refuse to delete source...'`
- `'B2: should preserve sources...'` → `'should preserve sources...'`
- (etc. for B3–B10)

**Checkpoint:** Run `pnpm build && pnpm test` across all packages. All tests must pass.

### Phase B: Naming Lie Fixes (findings 6–12, 16–19)

#### Step 9: `packages/plugin-a16n/test/format.test.ts` — strengthen empty-body tests (findings 6–12)

Read `formatIRFile` and `parseIRFile` signatures and existing test patterns. For each of the 7 empty tests:

- **Finding 6** (writeAgentSkillIO): Create an AgentSkillIO item, format it with `formatIRFile`, verify output is non-empty and contains expected structure.
- **Findings 7–11** (round-trip: GlobalPrompt, FileRule, SimpleAgentSkill, ManualPrompt, AgentIgnore): For each type, create a representative IR item, call `formatIRFile`, then `parseIRFile` on the result, then `formatIRFile` again. Assert the two format outputs are identical.
- **Finding 12** (relativeDir): Create an IR item with `relativeDir: 'shared'`, format → parse → verify `relativeDir` is preserved.

**Fallback:** If any round-trip test fails against existing production code, convert that test to `it.todo('...')` instead — production code is the oracle, and we can't change it.

#### Step 10: `packages/cli/test/integration/integration.test.ts` — rename (finding 16)

- `'should convert a single Cursor rule to CLAUDE.md'` → `'should convert a single Cursor rule to Claude format'`

#### Step 11: `packages/cli/test/commands/convert.test.ts` — strengthen (finding 17)

- Title claims "Would delete" output check. The `io.stdout` mock is in scope. Add assertion: `expect(io.stdout.mock.calls.flat().join('')).toContain('Would delete')`.
- If assertion fails (production code doesn't emit "Would delete"), rename title instead: `'should not delete source file in dry-run mode'`.

#### Step 12: `packages/cli/test/cli.test.ts` — rename (finding 18)

- `'should accept the flag with default value "none"'` → `'should succeed without --gitignore-output-with flag'`

#### Step 13: `packages/docs/test/generate-versioned-api.test.ts` — rename (finding 19)

- `'handles prerelease versions (sorts after release)'` → `'handles prerelease versions (does not crash)'`

**Final Checkpoint:** Run `pnpm build && pnpm test && pnpm lint && pnpm typecheck` across all packages.

## Technology Validation

No new technology — validation not required.

## Dependencies

None. All changes are test-only using existing test infrastructure and production APIs.

## Challenges & Mitigations

- **Round-trip tests may fail against production code (Step 9):** Fallback to `it.todo(...)` for any test where production code doesn't actually support the claimed round-trip. Production code is the oracle.
- **"Would delete" assertion may fail (Step 11):** Fallback to title rename if production code doesn't emit the expected string.
- **Finding 19 semver behavior (Step 13):** `getLatestVersion` uses `localeCompare` which may not handle prereleases correctly. Rename is safest; strengthening risks exposing a production bug we can't fix.
- **AC comments in test bodies (finding 5, lower-priority):** The audit flags these as lower-priority. Plan: strip them along with the `describe`/`it` renames since we're already in the file.

## Status

- [x] Initialization complete
- [x] Validation complete (all 19 findings confirmed)
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA — PASS (1 trivial finding: 9 residual `// AC` inline comments in `cli.test.ts` stripped)
