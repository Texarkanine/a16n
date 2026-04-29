# SLOBAC audit report

- **Scope invoked:** `deliverable-fossils`, `naming-lies` (all Phase-1 smells)
- **Target suite root:** `packages/*/test/**`
- **Audit date:** 2026-04-29

## Summary

19 findings across 10 files. **Deliverable fossils:** 8 findings spanning 8 files, covering 60+ fossil-named `describe` blocks and test identifiers that reference project phases (`Phase 2`–`Phase 9`), ticket IDs (`CR-10`, `CR-12`, `CR11-11`), date-prefixed task IDs (`20260421-preserve-filename-case`), and acceptance-criteria/behavior checklist labels (`AC1`–`AC7`, `B1`–`B11`, `I1`–`I3`, `CI1`–`CI4`). These span `plugin-cursor`, `plugin-claude`, `cli`, and `glob-hook`. **Naming lies:** 11 findings spanning 5 files, covering 7 empty-body tests in `plugin-a16n/test/format.test.ts` whose titles claim round-trip or integration verification but whose bodies are `expect(true).toBe(true)`, plus 4 tests across `cli` and `docs` whose titles claim specific behavior that the assertion set does not verify (writing to `CLAUDE.md`, showing "Would delete", verifying a default flag value, and sorting prereleases after releases). No findings for either smell in `packages/models` or `packages/engine`.

## Findings

### 1. `packages/plugin-cursor/test/discover.test.ts` — deliverable-fossils

- **Location:** packages/plugin-cursor/test/discover.test.ts → `describe('FileRule Discovery (Phase 2)')`, `describe('SimpleAgentSkill Discovery (Phase 2)')`, `describe('Classification Priority (Phase 2)')`, `it('should classify rules without activation criteria as ManualPrompt (Phase 7)')`, `describe('AgentIgnore Discovery (Phase 3)')`, `describe('Cursor Skills Discovery (Phase 7)')`, `describe('ManualPrompt Discovery (Phase 4 - Commands)')`, `describe('AgentSkillIO Discovery (Phase 8 B3)')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Eight `describe` blocks and one `it` block use phase labels (`Phase 2`, `Phase 3`, `Phase 4`, `Phase 7`, `Phase 8 B3`) as their primary grouping vocabulary. These labels describe *when* each capability was built, not *what* the product guarantees. A new reader meets an archaeology of implementation phases rather than a specification of discovery behavior. Signal: "`describe` / `context` groupings keyed to work phases rather than product behaviors" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Replace phase labels with product-capability groupings: `FileRule Discovery (Phase 2)` → `FileRule Discovery`, `ManualPrompt Discovery (Phase 4 - Commands)` → `ManualPrompt Discovery (commands)`, `AgentSkillIO Discovery (Phase 8 B3)` → `AgentSkillIO Discovery`. The `it` block referencing `(Phase 7)` should drop the parenthetical. Rename-only; no assertion changes required.
- **Why this isn't a false positive:** "Phase 2", "Phase 3", etc. are not product vocabulary — they do not appear in the SUT's public interface, types, or domain model. They are project-scheduling labels that only appear in test names.

### 2. `packages/plugin-cursor/test/emit.test.ts` — deliverable-fossils

- **Location:** packages/plugin-cursor/test/emit.test.ts → `describe('Cursor FileRule Emission (Phase 2)')`, `describe('Cursor SimpleAgentSkill Emission (Phase 2)')`, `describe('Cursor Mixed Emission (Phase 2 - Updated for Phase 7)')`, `describe('Cursor AgentIgnore Emission (Phase 3)')`, `describe('Cursor Skills Emission (Phase 7)')`, `describe('Cursor Plugin - sourceItems tracking (CR-10)')`, `describe('Cursor AgentSkillIO Emission (Phase 8 B4)')`, `describe('Cursor Filename Case Preservation (20260421-preserve-filename-case)')`, `describe('B6 — FileRule preserves source filename case')`, `describe('B7 — GlobalPrompt preserves name case')`, `describe('B9 — case-insensitive collision safety')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Eleven `describe` blocks carry three distinct fossil vocabulary patterns: (1) phase labels (`Phase 2`, `Phase 3`, `Phase 7`, `Phase 8 B4`), (2) a ticket ID (`CR-10`), (3) a date-prefixed task ID (`20260421-preserve-filename-case`), and (4) acceptance-criteria checklist labels (`B6`, `B7`, `B9`). Each names when or under what work item the capability was built, not what behavior the emission contract guarantees. Signal: "Test titles containing ticket IDs, sprint/release labels" and "`describe` / `context` groupings keyed to work phases" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Strip phase/ticket/task labels: `Cursor FileRule Emission (Phase 2)` → `Cursor FileRule Emission`, `Cursor Plugin - sourceItems tracking (CR-10)` → `sourceItems tracking`, `Cursor Filename Case Preservation (20260421-preserve-filename-case)` → `filename case preservation`, `B6 — FileRule preserves source filename case` → `FileRule preserves source filename case`. Phase B (regroup) could fold the `B6`/`B7`/`B9` sub-describes under `filename case preservation` as a single capability group.
- **Why this isn't a false positive:** `CR-10` is a ticket ID that only appears in test names, not in the SUT's domain. `B6`/`B7`/`B9` are checklist item identifiers from a design document — they do not appear in the product code. `20260421-` is a date-prefix naming convention for tasks; the product has no entity named this way.

### 3. `packages/plugin-claude/test/discover.test.ts` — deliverable-fossils

- **Location:** packages/plugin-claude/test/discover.test.ts → `describe('Claude SimpleAgentSkill Discovery (Phase 2)')`, `describe('skills with hooks → SKIPPED (Phase 8 B3)')`, `describe('Claude AgentIgnore Discovery (Phase 3)')`, `describe('Claude ManualPrompt Discovery (Phase 7)')`, `describe('Claude Plugin Never Discovers ManualPrompt (Phase 4)')`, `describe('AgentSkillIO Discovery (Phase 8 B3)')`, `describe('Claude Rules Discovery (Phase 8 A1)')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Seven `describe` blocks use phase labels (`Phase 2`, `Phase 3`, `Phase 4`, `Phase 7`, `Phase 8 A1`, `Phase 8 B3`) as grouping vocabulary. This mirrors the identical pattern in the cursor discover tests. Signal: "`describe` / `context` groupings keyed to work phases rather than product behaviors" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Strip phase parentheticals: `Claude SimpleAgentSkill Discovery (Phase 2)` → `Claude SimpleAgentSkill Discovery`, `skills with hooks → SKIPPED (Phase 8 B3)` → `skills with hooks (skipped — hooks unsupported)`, etc. Rename-only.
- **Why this isn't a false positive:** Same reasoning as finding 1 — phase labels are project-scheduling vocabulary absent from the product's domain model.

### 4. `packages/plugin-claude/test/emit.test.ts` — deliverable-fossils

- **Location:** packages/plugin-claude/test/emit.test.ts → `describe('Claude FileRule Emission (Phase 8 A2)')`, `describe('Claude SimpleAgentSkill Emission (Phase 2)')`, `describe('Mixed Model Emission (Phase 8 A2)')`, `describe('Claude AgentIgnore Emission (Phase 3)')`, `describe('Claude ManualPrompt Emission (Phase 4)')`, `describe('Claude Plugin - sourceItems tracking (Phase 8 A2)')`, `describe('Claude AgentSkillIO Emission (Phase 8 B4)')`, `describe('Claude Filename Case Preservation (20260421-preserve-filename-case)')`, `describe('B1 — FileRule preserves source filename case')`, `describe('B2 — GlobalPrompt preserves name case')`, `describe('B3 — AgentSkillIO skill directory stays lowercase (spec compliance)')`, `describe('B4 — SimpleAgentSkill skill directory stays lowercase')`, `describe('B5 — ManualPrompt skill directory stays lowercase')`, `describe('B9 — case-insensitive collision safety')`, `describe('B11 — leading-dot filenames sanitize as before')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Fifteen `describe` blocks carry phase labels, a date-task ID, and acceptance-criteria labels (`B1`–`B11`). This is the densest fossil concentration in the suite: every major capability group is tagged with implementation-history vocabulary. Signal: "Test titles containing ticket IDs, sprint/release labels" and "`describe` / `context` groupings keyed to work phases" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Strip all phase/B-label/task-ID prefixes. `B1 — FileRule preserves source filename case` → `FileRule preserves source filename case`, `Claude Filename Case Preservation (20260421-preserve-filename-case)` → `filename case preservation`, etc. Phase B (regroup) could consolidate `B1`–`B11` sub-describes under a single `filename case preservation` group since they all test the same capability.
- **Why this isn't a false positive:** Same reasoning as finding 2. `B1`–`B11` are acceptance-criteria IDs from a design document — they describe a checklist, not a product capability.

### 5. `packages/cli/test/cli.test.ts` — deliverable-fossils

- **Location:** packages/cli/test/cli.test.ts → `describe('sourceItems conflict detection (CR-10)')`, `describe('--gitignore-output-with match mode validation (CR11-11)')`, `describe('Phase 6: Dry-run output wording')`, `describe('Phase 6: --delete-source flag')`, `it('should use relative paths in deletedSources output and JSON (CR-12)')`, `it('should use relative paths in dry-run delete verbose output (CR-12)')`. Additionally, within the `Phase 6: --delete-source flag` describe block, individual test steps are labeled with AC-style comments (`// AC1:` through `// AC9:`).
- **Smell:** `deliverable-fossils`
- **Rationale:** Three `describe` blocks and two `it` blocks carry ticket IDs (`CR-10`, `CR11-11`, `CR-12`) or phase labels (`Phase 6`). Two more describes are phase-labeled. The `CR-12` tests also contain comments citing the ticket origin ("CodeRabbit feedback"), and the `Phase 6: --delete-source flag` block internally uses AC-numbered comments (`// AC1:` through `// AC9:`) as section markers. These describe *when* or *under which work item* capabilities were built, not *what the product guarantees*. Signal: "Test titles containing ticket IDs, sprint/release labels", "`describe` / `context` groupings keyed to work phases", and "Docstrings or comments citing design-doc section numbers or AC identifiers" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). `sourceItems conflict detection (CR-10)` → `sourceItems conflict detection`, `--gitignore-output-with match mode validation (CR11-11)` → `--gitignore-output-with match mode validation`, `Phase 6: Dry-run output wording` → `dry-run output wording`, `Phase 6: --delete-source flag` → `--delete-source flag`, `should use relative paths in deletedSources output and JSON (CR-12)` → `should use relative paths in deletedSources output and JSON`. The AC-numbered comments inside test bodies are lower-priority; they could be stripped or replaced with behavioral labels (e.g., `// AC1: Dry-run shows "Would write:" prefix` → `// dry-run prefixes output with "Would write:"`).
- **Why this isn't a false positive:** `CR-10`, `CR11-11`, and `CR-12` are ticket/issue identifiers. `Phase 6` is a project-scheduling label. Neither appears in the CLI's public interface or domain model. The comment "CodeRabbit feedback" confirms `CR-12` is a review-origin reference.

### 6. `packages/plugin-a16n/test/format.test.ts` → `it('should use writeAgentSkillIO from models (verbatim format)')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `AgentSkillIO` › `it('should use writeAgentSkillIO from models (verbatim format)')` (line 175)
- **Smell:** `naming-lies`
- **Rationale:** The title claims the test verifies that `writeAgentSkillIO` from models is used for verbatim format. The body is `expect(true).toBe(true)` — it verifies nothing. The title-noun `writeAgentSkillIO` has zero surface in the assertion set. Signal: "Tokenize the title/docstring; tokenize the assertion lines; find title-nouns with zero surface in the assertion set" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Investigate. The title captures real intent (verifying AgentSkillIO uses a specific serializer), but the body is empty. Either implement the test to verify the claim (strengthen), or delete the test if the behavior is covered elsewhere. If the test is a deliberate placeholder, rename to `it.todo('...')` or `it.skip('...')` so the test runner surfaces it as pending, not passing.
- **Why this isn't a false positive:** The body is literally `expect(true).toBe(true)`. There is no semantic match between the title-noun `writeAgentSkillIO` and the assertion set. This is not cross-language synonymy or domain synonymy — it is an empty test with a descriptive title.

### 7. `packages/plugin-a16n/test/format.test.ts` → `it('should round-trip GlobalPrompt (format -> parse -> format)')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `round-trip` › `it('should round-trip GlobalPrompt (format -> parse -> format)')` (line 331)
- **Smell:** `naming-lies`
- **Rationale:** The title claims the test verifies GlobalPrompt round-trip behavior through format → parse → format. The body is `expect(true).toBe(true)`. The comment says "Round-trip tests will be implemented after format.ts is complete" — the implementation never happened, but the test passes green, silently claiming round-trip coverage. Signal: "Tokenize the title/docstring; tokenize the assertion lines; find title-nouns with zero surface in the assertion set" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen. The title captures real intent. Implement the round-trip: `const formatted = formatIRFile(gp); const parsed = parseIRFile(...); const reformatted = formatIRFile(parsed); expect(reformatted).toBe(formatted);`. If round-trip testing is not yet feasible, convert to `it.todo(...)` so the suite does not silently pass.
- **Why this isn't a false positive:** Same as finding 6. `expect(true).toBe(true)` has zero semantic overlap with "round-trip GlobalPrompt".

### 8. `packages/plugin-a16n/test/format.test.ts` → `it('should round-trip FileRule (format -> parse -> format)')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `round-trip` › `it('should round-trip FileRule (format -> parse -> format)')` (line 337)
- **Smell:** `naming-lies`
- **Rationale:** Title claims FileRule round-trip verification. Body is `expect(true).toBe(true)`. Identical pattern to finding 7. Signal: title-nouns `round-trip`, `FileRule`, `format`, `parse` have zero surface in the assertion set ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen (same as finding 7) or convert to `it.todo(...)`.
- **Why this isn't a false positive:** Empty body; no semantic match possible.

### 9. `packages/plugin-a16n/test/format.test.ts` → `it('should round-trip SimpleAgentSkill (format -> parse -> format)')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `round-trip` › `it('should round-trip SimpleAgentSkill (format -> parse -> format)')` (line 341)
- **Smell:** `naming-lies`
- **Rationale:** Title claims SimpleAgentSkill round-trip verification. Body is `expect(true).toBe(true)`. Signal: title-nouns have zero surface in the assertion set ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen or convert to `it.todo(...)`.
- **Why this isn't a false positive:** Empty body; no semantic match possible.

### 10. `packages/plugin-a16n/test/format.test.ts` → `it('should round-trip ManualPrompt (format -> parse -> format)')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `round-trip` › `it('should round-trip ManualPrompt (format -> parse -> format)')` (line 345)
- **Smell:** `naming-lies`
- **Rationale:** Title claims ManualPrompt round-trip verification. Body is `expect(true).toBe(true)`. Signal: title-nouns have zero surface in the assertion set ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen or convert to `it.todo(...)`.
- **Why this isn't a false positive:** Empty body; no semantic match possible.

### 11. `packages/plugin-a16n/test/format.test.ts` → `it('should round-trip AgentIgnore (format -> parse -> format)')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `round-trip` › `it('should round-trip AgentIgnore (format -> parse -> format)')` (line 349)
- **Smell:** `naming-lies`
- **Rationale:** Title claims AgentIgnore round-trip verification. Body is `expect(true).toBe(true)`. Signal: title-nouns have zero surface in the assertion set ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen or convert to `it.todo(...)`.
- **Why this isn't a false positive:** Empty body; no semantic match possible.

### 12. `packages/plugin-a16n/test/format.test.ts` → `it('should preserve relativeDir through round-trip')` — naming-lies

- **Location:** packages/plugin-a16n/test/format.test.ts → `round-trip` › `it('should preserve relativeDir through round-trip')` (line 353)
- **Smell:** `naming-lies`
- **Rationale:** Title claims `relativeDir` is preserved through round-trip. Body is `expect(true).toBe(true)`. The title-noun `relativeDir` has zero surface in the assertion set. Signal: "Docstring claims a derivation rule but the assertion is `len(x) > 0`" — in this case, the assertion is even weaker than `len(x) > 0`: it asserts nothing at all ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen. Implement: create a model with `relativeDir`, format it, parse the output, verify `relativeDir` is preserved. Or convert to `it.todo(...)`.
- **Why this isn't a false positive:** Empty body; no semantic match possible.

### 13. `packages/glob-hook/test/cli.test.ts` — deliverable-fossils

- **Location:** packages/glob-hook/test/cli.test.ts → `describe('AC1: Basic Glob Matching')`, `describe('AC2: No Match')`, `describe('AC3: Multiple Patterns')`, `describe('AC4: Multiline Context')`, `describe('AC5: Missing file_path')`, `describe('AC6: Invalid JSON Input')`, `describe('AC7: Missing Required Args')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Seven `describe` blocks use acceptance-criteria IDs (`AC1`–`AC7`) as their primary naming prefix. These labels describe a delivery checklist, not product capabilities. A reader encounters a numbered acceptance-criteria list rather than a specification of glob-hook CLI behavior. Signal: "Docstrings or comments citing design-doc section numbers or AC identifiers" and "`describe` / `context` groupings keyed to work phases" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Strip AC prefixes: `AC1: Basic Glob Matching` → `basic glob matching`, `AC6: Invalid JSON Input` → `invalid JSON input`, `AC7: Missing Required Args` → `missing required arguments`. Rename-only; no assertion changes required.
- **Why this isn't a false positive:** `AC1`–`AC7` are acceptance-criteria identifiers from a specification document. They do not appear in the glob-hook's API, types, or domain model.

### 14. `packages/cli/test/integration/integration.test.ts` — deliverable-fossils

- **Location:** packages/cli/test/integration/integration.test.ts → `describe('Integration Tests - Phase 2 FileRule and SimpleAgentSkill')`, `describe('Integration Tests - Phase 3 AgentIgnore')`, `describe('Integration Tests - Phase 4 ManualPrompt (Commands)')`, `describe('Integration Tests - Phase 9 a16n IR Plugin')`, `it('I1: Convert with sourceRoot reads from specified source, writes to default root')`, `it('I2: Convert with targetRoot reads from default root, writes to specified target')`, `it('I3: Convert with both sourceRoot and targetRoot')`, `it('CI1: Cursor→Claude with rewritePathRefs rewrites .cursor/rules/... → .claude/rules/...')`, `it('CI2: Cursor→Claude with rewritePathRefs warns about orphan refs')`, `it('CI3: Combined --from-dir + --to-dir + --rewrite-path-refs works end-to-end')`, `it('CI4: Cursor→Claude AgentSkillIO rewrites SKILL.md body AND scripts/**/references/** ride-alongs; leaves assets/** and unknown subtrees untouched')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Four `describe` blocks carry phase labels (`Phase 2`, `Phase 3`, `Phase 4`, `Phase 9`) and seven `it` blocks carry alphanumeric behavior-checklist IDs (`I1`–`I3`, `CI1`–`CI4`). The phase labels organize tests by implementation timeline rather than product behavior. The `I`/`CI` prefixes are internal checklist identifiers — they are opaque to anyone without access to the original specification document. Additionally, `CI4` has an excessively long title that reads as a spec paragraph, creating high coupling between the test name and implementation details. Signal: "`describe` / `context` groupings keyed to work phases" and "Test titles containing sprint/release labels" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Strip phase prefixes from describes: `Integration Tests - Phase 2 FileRule and SimpleAgentSkill` → `FileRule and SimpleAgentSkill integration`, etc. Strip checklist IDs from its: `I1: Convert with sourceRoot reads from specified source, writes to default root` → `convert with sourceRoot reads from specified source, writes to default root`. Shorten `CI4` to a concise behavioral summary.
- **Why this isn't a false positive:** Phase labels and I/CI prefixes are project-scheduling and specification-document vocabulary. They do not appear in the engine's public API or domain model.

### 15. `packages/cli/test/commands/convert.test.ts` — deliverable-fossils

- **Location:** packages/cli/test/commands/convert.test.ts → `it('B1: should refuse to delete source that resolves outside project root')`, `it('B2: should preserve sources marked as skipped even when other sources are deleted')`, `it('B3: should handle unlink failure gracefully and continue')`, `it('B4: should route new output to .gitignore when all sources ignored via .gitignore')`, `it('B5: should route new output to .git/info/exclude when all sources ignored via exclude')`, `it('B6: should not ignore new output when all sources are tracked')`, `it('B7: should emit GitStatusConflict warning when new output has mixed-status sources')`, `it('B8: should emit GitStatusConflict warning when sources ignored by different files')`, `it('B9: should emit GitStatusConflict warning for existing tracked output with ignored sources')`, `it('B10: should emit GitStatusConflict warning for existing ignored output with tracked sources')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Ten `it` blocks carry `B1`–`B10` behavior-checklist IDs as title prefixes. These describe a numbered specification checklist, not product capabilities. A reader encounters an enumerated delivery artifact rather than a specification of conversion behavior. Signal: "Test titles containing sprint/release labels" and naming patterns aligned with design-doc section numbering ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A (rename). Strip B-prefixes: `B1: should refuse to delete source that resolves outside project root` → `should refuse to delete source that resolves outside project root`, etc. The behavioral descriptions after the colon are already good — the B-labels are purely surplus.
- **Why this isn't a false positive:** `B1`–`B10` are specification-document checklist identifiers. They are opaque to anyone without the original design doc and do not appear in the convert command's public interface.

### 16. `packages/cli/test/integration/integration.test.ts` → `it('should convert a single Cursor rule to CLAUDE.md')` — naming-lies

- **Location:** packages/cli/test/integration/integration.test.ts → `cursor-to-claude-basic` › `it('should convert a single Cursor rule to CLAUDE.md')` (line ~65)
- **Smell:** `naming-lies`
- **Rationale:** The title claims the test verifies conversion to a file named `CLAUDE.md`. The body verifies that files were created in `.claude/rules/` and that the content contains expected text — it never checks for the existence of or writes to a file named `CLAUDE.md`. The title is a fossil of the original emission target (a single `CLAUDE.md` file), which was later replaced by the `.claude/rules/` directory structure. Title-noun `CLAUDE.md` (a specific filename) has zero surface in the assertion set, which references `.claude/rules/`. Signal: "Tokenize the title/docstring; tokenize the assertion lines; find title-nouns with zero surface in the assertion set" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Rename. `should convert a single Cursor rule to CLAUDE.md` → `should convert a single Cursor rule to Claude format`. This aligns with the test's actual assertion (files in `.claude/rules/`).
- **Why this isn't a false positive:** `CLAUDE.md` is a specific filename. The test body constructs and asserts against path `.claude/rules/`, not `CLAUDE.md`. Other tests in the same file correctly use "Claude" (format name) rather than "CLAUDE.md" (filename).

### 17. `packages/cli/test/commands/convert.test.ts` → `it('should show "Would delete" in dry-run with --delete-source')` — naming-lies

- **Location:** packages/cli/test/commands/convert.test.ts → `delete source` › `it('should show "Would delete" in dry-run with --delete-source')` (line ~583)
- **Smell:** `naming-lies`
- **Rationale:** The title claims the test verifies that the output shows "Would delete" during a dry-run with `--delete-source`. The body runs `handleConvert` in dry-run mode and asserts that the source file still exists (`fs.access(sourceFile)` resolves), but it never inspects `io.stdout`, `io.stderr`, or any log output for the string "Would delete". The title-noun "Would delete" has zero surface in the assertion set. Signal: "Title claims behavior X, but the body verifies weaker behavior Y" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Either strengthen the test (add assertion: `expect(io.stdout.mock.calls.flat().join(' ')).toContain('Would delete')`) to match the title, or rename to `should not delete source file in dry-run mode` to match the actual assertion. The test currently verifies a valuable property (dry-run safety), but the title claims an output-formatting check it doesn't perform.
- **Why this isn't a false positive:** "Would delete" is a quoted literal string in the title implying an output assertion. The body performs only a file-existence check. This is not domain synonymy — it is a title/assertion mismatch.

### 18. `packages/cli/test/cli.test.ts` → `it('should accept the flag with default value "none"')` — naming-lies

- **Location:** packages/cli/test/cli.test.ts → `--gitignore-output-with flag` › `it('should accept the flag with default value "none"')` (line ~475)
- **Smell:** `naming-lies`
- **Rationale:** The title claims the test verifies that the `--gitignore-output-with` flag has a default value of `"none"`. The body creates a Cursor rule, runs `convert --from cursor --to claude` (without passing `--gitignore-output-with`), and asserts `exitCode === 0` and that stdout contains `'Discovered: 1'`. It never asserts the flag's default value, never inspects the gitignore-output-with mode, and never checks that the mode is `"none"` rather than some other mode. The title-noun "default value `none`" has zero surface in the assertion set. Signal: "Tokenize the title/docstring; tokenize the assertion lines; find title-nouns with zero surface in the assertion set" ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Strengthen. Add an assertion that the conversion behaved as if `--gitignore-output-with none` was passed (e.g., verify no `.gitignore` entries were modified, or inspect the engine options). Alternatively, rename to `should succeed without --gitignore-output-with flag` to match the actual assertion.
- **Why this isn't a false positive:** The title makes a specific claim about the flag's default value. The body cannot distinguish between `default = "none"`, `default = "auto"`, or no default at all. This is not underspecification — the title asserts a concrete property the body doesn't verify.

### 19. `packages/docs/test/generate-versioned-api.test.ts` → `it('handles prerelease versions (sorts after release)')` — naming-lies

- **Location:** packages/docs/test/generate-versioned-api.test.ts → `getLatestVersion` › `it('handles prerelease versions (sorts after release)')` (line 135)
- **Smell:** `naming-lies`
- **Rationale:** The title claims prerelease versions are sorted *after* release versions (i.e., `1.0.0` sorts after `1.0.0-beta.1`, making `1.0.0` the latest). The body calls `getLatestVersion(['1.0.0', '1.0.0-beta.1', '0.9.0'])` and asserts `expect(['1.0.0', '1.0.0-beta.1']).toContain(result)` — it accepts *either* value as a passing result. The comments inside the test explicitly acknowledge the implementation may not handle prereleases correctly: "localeCompare with numeric: true may not handle prereleases 'correctly'". The title claims a specific ordering property ("sorts after release") that the body does not verify. Signal: "Title claims behavior X, but the body verifies weaker behavior Y" — the title claims a specific sort order but the body accepts either ordering ([canonical entry](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Rename to match actual assertion: `handles prerelease versions (accepts release or prerelease as latest)` or `handles prerelease versions (does not crash)`. If the intended behavior is that `1.0.0` should sort after `1.0.0-beta.1`, strengthen the assertion to `expect(result).toBe('1.0.0')` and fix the implementation if needed.
- **Why this isn't a false positive:** The parenthetical "sorts after release" is a specific ordering claim. The body uses `toContain` on a two-element array, accepting either ordering. The internal comments confirm the ordering is not guaranteed. This is not domain synonymy — "sorts after" has an unambiguous meaning.

## Tests considered but not flagged

- `packages/plugin-cursor/test/discover.test.ts` → `it('should classify rules with valid globs over description (globs takes precedence)')` — Title claims precedence behavior, body only verifies output type is `FileRule`. Cleared: the fixture is designed to have both globs and description; the test verifies the *outcome* of the precedence rule. This is under-specified (title could be more precise about the fixture's properties), not lying. Under-specified titles are outside Phase-1 scope.

- `packages/plugin-claude/test/discover.test.ts` → `it('should skip hidden directories like .git')` — Title claims `.git` directory skipping, but the fixture has no `.git` directory and the body only checks for zero warnings. Evaluated as a naming-lie candidate. However, on reflection this was flagged as smell-adjacent but borderline: the test is documenting expected behavior for a scenario it does not exercise. This is closer to a **rotten-green** smell (test passes but doesn't exercise the claimed path) than a naming-lie per se, since the title is not *lying* about what the code *does* — it's lying about what the *test* verifies. Since rotten-green is out of Phase-1 scope, this is noted here rather than flagged. A reasonable reviewer could disagree and flag it as a naming-lie.

- `packages/cli/test/integration/integration.test.ts` line 348 — A code comment references `Phase 7: SimpleAgentSkill → .cursor/skills/`. This is a comment inside a test body, not a test name or `describe` block name. The test's actual identifier does not carry fossil vocabulary. Cleared.

- `packages/plugin-claude/test/emit.test.ts` → comments containing `// BREAKING:` — Multiple test bodies contain `// BREAKING:` comments explaining behavioral changes. These are implementation comments, not test identifiers. The describe/it names themselves are product-focused (except the Phase labels already flagged). Cleared.

- `packages/plugin-claude/test/discover.test.ts` → `describe('backward compatibility')` — This could look like a fossil grouping, but "backward compatibility" is a product property (the system promises to remain compatible), not a work-phase label. Cleared.

- `packages/cli/test/integration/integration.test.ts` → `it('should preserve content through cursor → a16n → claude round-trip')` — Title says "round-trip" but the test performs a one-way cursor → a16n → claude conversion without returning to the original format. However, the title's arrows explicitly show the one-way flow (`cursor → a16n → claude`), and the parent `describe` block is correctly labeled `cross-format: cursor → a16n → claude`. The misleading word "round-trip" in the `it` title is mitigated by the unambiguous arrows and parent context. Borderline; a reasonable reviewer could flag this. Noted rather than formally finding.

- `packages/docs/test/generate-cli-docs.test.ts` → `describe('buildCli configuration')` — Tests repo/build wiring (pnpm filter patterns, package.json dependencies). This describes the *thing being tested* (build CLI configuration), not a delivery artifact or work phase. Config-drift guards are intentional for docs pipelines. Cleared.

- `packages/cli/test/cli.test.ts` → Comments `// AC1:` through `// AC9:` inside the `Phase 6: --delete-source flag` describe block — These are AC-numbered comments inside test bodies, not test identifiers. The parent describe block (`Phase 6: --delete-source flag`) is already flagged in finding 5. The internal comments reinforce the fossil diagnosis but are lower-severity than test-name fossils since they are not visible in test runner output.

- All tests in `packages/models/test/*.test.ts` (6 files), `packages/engine/test/*.test.ts` (7 files) — Examined for both fossil vocabulary and naming lies. All test identifiers describe product behaviors without phase/ticket references, and all assertion sets match their title claims. Cleared.

- `packages/glob-hook/test/io.test.ts` and `packages/glob-hook/test/matcher.test.ts` — Clean. All test names describe product behavior; all assertions match titles. Cleared.

- `packages/docs/test/generate-cli-docs.test.ts` — Clean (aside from the `buildCli` note above). Cleared.

## Out-of-scope requests

No out-of-scope smell slugs were requested. All requested slugs (`deliverable-fossils`, `naming-lies`) are supported by Phase-1 and were audited.
