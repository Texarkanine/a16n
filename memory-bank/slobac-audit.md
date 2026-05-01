# SLOBAC audit report

- **Scope invoked:** all
- **Target suite root:** `packages/**/test` (8 packages: cli, docs, engine, glob-hook, models, plugin-a16n, plugin-claude, plugin-cursor)
- **Audit date:** 2026-05-01

## Summary

20 findings across 35 test files (915 tests, 640K chars). Breakdown by smell: 10 `deliverable-fossils`, 3 `naming-lies`, 1 `shared-state`, 6 `monolithic-test-file`. No findings for scope `semantic-redundancy`. No findings for scope `wrong-level`.

Orchestration: 3 batch assessors ran in parallel (cli+docs+glob-hook, engine+models+plugin-a16n, plugin-claude+plugin-cursor). Cross-suite analysis ran for `semantic-redundancy`, `wrong-level`, and `deliverable-fossils` Phase B — all candidates were rejected after targeted source reads. Summary richness level: `standard`.

## Findings

### 1. `cli/test/cli.test.ts` lines 713–825, tests `C1:`–`C8:` — deliverable-fossils

- **Location:** `cli/test/cli.test.ts` → `C1:` through `C8:` within `describe('--from-dir and --to-dir flags')`
- **Smell:** `deliverable-fossils`
- **Rationale:** Eight test titles carry numbered checklist-item prefixes (`C1:` through `C8:`), e.g. `C1: --from-dir flag is parsed and reads from specified source`. The `C` prefix is work vocabulary — a numbered acceptance-criteria marker from the implementation task. Each body verifies specific `--from-dir` / `--to-dir` CLI behavior; the suffix already describes the behavior. Signal: test titles containing AC identifiers ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A — rename per behavior. Strip `C1:`–`C8:` prefixes. Each test already has a descriptive suffix that serves as the behavioral name. E.g. `C1: --from-dir flag is parsed and reads from specified source` → `--from-dir reads from specified source directory`. No body changes needed; rename-only preserves the call graph.
- **Why this isn't a false positive:** `C1`–`C8` do not appear in the SUT, the CLI's help output, or any product-facing API. They are work vocabulary (checklist item markers) that only exist in the test names.

### 2. `cli/test/integration/integration.test.ts` line 261, `should convert Cursor FileRule to Claude hooks` — naming-lies

- **Location:** `cli/test/integration/integration.test.ts` → `should convert Cursor FileRule to Claude hooks`
- **Smell:** `naming-lies`
- **Rationale:** Title says "Claude hooks" but the body verifies that a `.claude/rules/react.md` file was created (native rule, not hooks), explicitly asserts `settings.local.json` should NOT exist (the old hooks mechanism), and asserts NO approximation warning was emitted (confirming native support). The body tests the exact opposite of what "hooks" implies. Signal: title noun "hooks" has zero surface in the assertion set ([naming-lies](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Body is correct, title lies. Rename to match the body: `should convert Cursor FileRule to Claude native rule file`.
- **Why this isn't a false positive:** This is not domain synonymy — "hooks" is a distinct, named mechanism (settings.local.json-based) that the test explicitly verifies is NOT used. The body contradicts the title, not merely under-specifies it.

### 3. `cli/test/cli.test.ts` line 956, `should delete multiple sources that merge into single output` — naming-lies

- **Location:** `cli/test/cli.test.ts` → `should delete multiple sources that merge into single output`
- **Smell:** `naming-lies`
- **Rationale:** Title claims "merge into single output" but the body asserts `expect(files.length).toBe(2)` with an inline comment "Two separate output files should exist (no longer merged)". The body explicitly verifies that 2 separate files are created, contradicting the "merge into single output" claim. Signal: title nouns "merge" and "single output" have zero surface in the assertion set ([naming-lies](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Body is correct, title lies. Rename: `should delete all sources when each produces a separate output file`.
- **Why this isn't a false positive:** The inline comment ("no longer merged") explicitly acknowledges the title is stale. The title claims X (merging into one), the body verifies not-X (two separate files).

### 4. `cli/test/integration/integration.test.ts` line 26, module-level engine — shared-state

- **Location:** `cli/test/integration/integration.test.ts` → `const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin])`
- **Smell:** `shared-state`
- **Rationale:** A module-level `A16nEngine` instance is constructed once and shared across all ~35 tests without a `beforeEach` factory. Signal: "File-level `const` bound to a mutable object (`new Engine()`) used by many tests without a `beforeEach` factory" ([shared-state](https://texarkanine.github.io/slobac/taxonomy/shared-state/)).
- **Prescribed remediation:** Move engine construction into a `beforeEach` factory or a per-describe helper so each test group gets a fresh instance. The constructor is lightweight (receives pre-imported plugin objects, no I/O), so per-test construction cost is negligible.
- **Why this isn't a false positive:** The `A16nEngine` constructor is cheap (receives pre-imported plugins, no I/O). The `wrong-level` defense (integration tests legitimately sharing expensive resources) does not apply since the shared object is trivial to reconstruct.

### 5. `cli/test/cli.test.ts` — monolithic-test-file

- **Location:** `cli/test/cli.test.ts` (entire file)
- **Smell:** `monolithic-test-file`
- **Rationale:** 1107 lines, ~55 tests across 12+ distinct behavior domains: `--help`, `plugins command`, `discover command`, `convert command`, `--gitignore-output-with`, `sourceItems conflict detection`, `match mode validation`, `--if-gitignore-conflict`, `--from-dir / --to-dir`, `--rewrite-path-refs`, `dry-run output wording`, `--delete-source`. Signal: >50 `it` blocks, >1000 lines, multiple top-level `describe` blocks naming clearly different subjects ([monolithic-test-file](https://texarkanine.github.io/slobac/taxonomy/monolithic-test-file/)).
- **Prescribed remediation:** Split along behavior domain: `cli-help.test.ts`, `cli-convert.test.ts`, `cli-discover.test.ts`, `cli-plugins.test.ts`, `cli-gitignore.test.ts`, `cli-delete-source.test.ts`, `cli-from-to-dir.test.ts`. Extract the shared `runCli()` helper into `test-support/cli-runner.ts`.
- **Why this isn't a false positive:** The file's 12 describe blocks name distinct CLI features (convert, discover, plugins, gitignore, delete-source, etc.), each with its own setup patterns. This is a monolithic accumulation, not a single-subject file testing many edge cases.

### 6. `cli/test/integration/integration.test.ts` — monolithic-test-file

- **Location:** `cli/test/integration/integration.test.ts` (entire file)
- **Smell:** `monolithic-test-file`
- **Rationale:** 1507 lines, ~35 tests across 7 top-level describe blocks: `Fixture Based`, `FileRule and SimpleAgentSkill`, `AgentIgnore`, `ManualPrompt (Commands)`, `Split Directories`, `Path Reference Rewriting`, `a16n IR Plugin`. Each top-level describe names a clearly different subject domain. Imports span 6 modules. Signal: >1000 lines, multiple top-level `describe` blocks naming clearly different subjects ([monolithic-test-file](https://texarkanine.github.io/slobac/taxonomy/monolithic-test-file/)).
- **Prescribed remediation:** Split along top-level describe groups: `integration-basic-conversion.test.ts`, `integration-filerule-skill.test.ts`, `integration-agentignore.test.ts`, `integration-commands.test.ts`, `integration-split-dirs.test.ts`, `integration-path-rewrite.test.ts`, `integration-a16n-plugin.test.ts`. Extract `copyDir`, `readDirFiles`, `compareOutputs` helpers into shared `test-support/`.
- **Why this isn't a false positive:** The 7 top-level describe blocks name distinct product capabilities (AgentIgnore, ManualPrompt, Path Rewriting, a16n IR). The file mixes 7 independent feature domains, not one subject with many edge cases.

### 7. `engine/test/engine.test.ts` line 79, `should return the plugin via getPlugin after source tracking refactor` — deliverable-fossils

- **Location:** `engine/test/engine.test.ts` → `should return the plugin via getPlugin after source tracking refactor`
- **Smell:** `deliverable-fossils`
- **Rationale:** The test title contains "after source tracking refactor" — fossil vocabulary referencing a past development event. The body simply calls `engine.getPlugin('cursor')` and asserts `id` and `name` match. The behavior under test is the plugin lookup contract, not anything about a refactor. Signal: test title containing `refactor` / `after X` ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A rename. Propose: `returns a plugin matching the registered id and name` (or merge with the identical test at line 26 — same body, same assertions — which would also resolve an in-file semantic redundancy).
- **Why this isn't a false positive:** The body does not test a refactor property (e.g., migration safety, rename invariance). "Refactor" here is the test's reason-for-existence, not the behavior under test.

### 8. `engine/test/engine.test.ts` — 13 tests with AC-ID suffixes (E1–E4, EP1–EP4, WS1–WS5) — deliverable-fossils

- **Location:** `engine/test/engine.test.ts` → lines 315, 341, 368, 396, 443, 474, 496, 524, 560, 571, 595, 627, 651
- **Smell:** `deliverable-fossils`
- **Rationale:** Each test name ends with a parenthesized identifier (E1–E4, EP1–EP4, WS1–WS5) that reads as an acceptance-criteria or spec-checklist item ID. These labels carry no product meaning — they are development-artifact labels from a feature breakdown. Signal: test titles containing AC identifiers ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A rename. Strip the parenthesized ID suffixes from each test name. The remaining text already describes the behavior (e.g., `should use sourceRoot for discover when provided`). If traceability to a spec is needed, add a code comment.
- **Why this isn't a false positive:** The identifiers (E1, EP1, WS1, etc.) do not appear in the SUT — they are not domain vocabulary. They only appear in test names, confirming they are work vocabulary.

### 9. `engine/test/path-rewriter.test.ts` — all 28 tests with P-number prefixes — deliverable-fossils

- **Location:** `engine/test/path-rewriter.test.ts` → all 28 tests (`P1:` through `P28:`)
- **Smell:** `deliverable-fossils`
- **Rationale:** Every test name is prefixed with a sequential identifier (`P1:` through `P28:`) that reads as a numbered checklist or requirements-specification label. The identifiers carry no product meaning and organize the file by delivery order, not by behavior domain. Signal: test titles containing AC identifiers ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A rename. Strip the `P<N>: ` prefix from each test name. The text after the prefix already describes the behavior. If ordering is desired, rely on describe-block grouping.
- **Why this isn't a false positive:** The `P<N>` identifiers do not appear in the SUT or in domain vocabulary — they exist only in test names as work-artifact labels.

### 10. `models/test/types.test.ts` line 17, `should have SimpleAgentSkill type (renamed from AgentSkill)` — deliverable-fossils

- **Location:** `models/test/types.test.ts` → `should have SimpleAgentSkill type (renamed from AgentSkill)`
- **Smell:** `deliverable-fossils`
- **Rationale:** The test title includes "(renamed from AgentSkill)" — a historical note about a past type rename that is not part of the product behavior being verified. The body asserts `CustomizationType.SimpleAgentSkill === 'simple-agent-skill'`. Signal: test title referencing a past refactor/rename ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A rename. Propose: `should have SimpleAgentSkill type with value 'simple-agent-skill'`. If the rename history is important for context, add a code comment.
- **Why this isn't a false positive:** "Renamed from AgentSkill" is work vocabulary — it describes when/why the test was written, not a product guarantee. The SUT has no concept of "AgentSkill" (the old name).

### 11. `models/test/types.test.ts` line 87, `should have promptName field (not commandName)` — deliverable-fossils

- **Location:** `models/test/types.test.ts` → `should have promptName field (not commandName)`
- **Smell:** `deliverable-fossils`
- **Rationale:** The test title includes "(not commandName)" — a historical note about a past field rename. The body asserts `manualPrompt.promptName === 'deploy'`. "commandName" does not appear anywhere in the SUT; it is a ghost of a previous API shape. Signal: test title referencing a past refactor ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Phase A rename. Propose: `should expose promptName on ManualPrompt`. If the rename history matters, add a code comment.
- **Why this isn't a false positive:** "commandName" is not domain vocabulary — it does not appear in the SUT or any current type definition.

### 12. `plugin-claude/test/discover.test.ts` line 527, `should skip hidden directories like .git` — naming-lies

- **Location:** `plugin-claude/test/discover.test.ts` → `should skip hidden directories like .git`
- **Smell:** `naming-lies`
- **Rationale:** Title claims the test verifies that hidden directories like `.git` are skipped during rule discovery. The body discovers from the `claude-rules-basic` fixture — which contains no hidden directories — and asserts only `expect(result.warnings).toHaveLength(0)`. No `.git` directory is present in the fixture, no assertion checks that hidden-directory contents are excluded. Signal: title noun `hidden directories` / `.git` has zero surface in the assertion set ([naming-lies](https://texarkanine.github.io/slobac/taxonomy/naming-lies/)).
- **Prescribed remediation:** Option A (rename to match body): `should discover rules without warnings from basic fixture`. Option B (strengthen body): create a fixture with a `.git/` directory containing `.md` files, discover, and assert those files are absent from results. Option B is preferred since the hidden-directory-skipping behavior is worth verifying.
- **Why this isn't a false positive:** This is not under-specification — the title makes a specific claim about `.git` that the body does not test at all. The fixture has no hidden directories, so the assertion is orthogonal to the title's claim.

### 13. `plugin-claude/test/emit.test.ts` line 1783, body comment citing task ID — deliverable-fossils

- **Location:** `plugin-claude/test/emit.test.ts` → `should populate sourcePaths on resource WrittenFiles (not on SKILL.md)`, body comment
- **Smell:** `deliverable-fossils`
- **Rationale:** The body comment reads `// Behavior 4 (Level 2 task 20260420-skills-docs-and-rewrite-resources): Symmetric to cursor Behavior 3.` — citing a specific behavior number and task ID from the development workflow. Signal: "Docstrings or comments citing design-doc section numbers or AC identifiers" ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Strip the task ID and behavior number from the comment. Keep the explanatory text about what `sourcePaths` enables (path-rewriter mapping). The comment should describe the *contract*, not which task introduced it.
- **Why this isn't a false positive:** "Behavior 4," "Level 2 task 20260420-skills-docs-and-rewrite-resources," and "cursor Behavior 3" are work vocabulary from the project's memory bank system. They do not appear in the SUT.

### 14. `plugin-claude/test/emit.test.ts` — monolithic-test-file

- **Location:** `plugin-claude/test/emit.test.ts` (entire file)
- **Smell:** `monolithic-test-file`
- **Rationale:** 2473 lines, ~86 tests, 10 top-level `describe` blocks covering distinct behavior domains: GlobalPrompt emission, FileRule emission, SimpleAgentSkill emission, empty-globs validation, mixed-model emission, AgentIgnore emission, ManualPrompt emission, sourceItems tracking, AgentSkillIO emission, and filename case preservation. Signals: >1000 lines, >50 tests, multiple top-level describes naming clearly different subjects ([monolithic-test-file](https://texarkanine.github.io/slobac/taxonomy/monolithic-test-file/)).
- **Prescribed remediation:** Split by behavior domain: `emit-global-prompt.test.ts`, `emit-file-rule.test.ts`, `emit-simple-agent-skill.test.ts`, `emit-agent-ignore.test.ts`, `emit-manual-prompt.test.ts`, `emit-agent-skill-io.test.ts`, `emit-source-items.test.ts`, `emit-filename-case.test.ts`. Extract shared setup into `test-support/emit-helpers.ts`.
- **Why this isn't a false positive:** Each model type (GlobalPrompt, FileRule, AgentSkillIO, etc.) has distinct emission logic, output formats, and edge cases — genuinely different behavior domains sharing a single entry point.

### 15. `plugin-claude/test/discover.test.ts` — monolithic-test-file

- **Location:** `plugin-claude/test/discover.test.ts` (entire file)
- **Smell:** `monolithic-test-file`
- **Rationale:** 812 lines, ~58 tests, 7 top-level `describe` blocks covering distinct customization-type discovery domains: GlobalPrompt (CLAUDE.md), SimpleAgentSkill, AgentIgnore, ManualPrompt, "never discovers ManualPrompt" contract, AgentSkillIO, and Rules. Signal: >50 tests, multiple top-level describes naming clearly different subjects ([monolithic-test-file](https://texarkanine.github.io/slobac/taxonomy/monolithic-test-file/)).
- **Prescribed remediation:** Split by customization type: `discover-global-prompt.test.ts`, `discover-skills.test.ts`, `discover-agent-ignore.test.ts`, `discover-manual-prompt.test.ts`, `discover-agent-skill-io.test.ts`, `discover-rules.test.ts`.
- **Why this isn't a false positive:** Each customization type has distinct file-discovery patterns, frontmatter parsing, and classification logic.

### 16. `plugin-cursor/test/emit.test.ts` line 1658, `(symmetric to Claude B1)` — deliverable-fossils

- **Location:** `plugin-cursor/test/emit.test.ts` → `should preserve CamelCase stem when emitting FileRule (symmetric to Claude B1)`
- **Smell:** `deliverable-fossils`
- **Rationale:** Test name contains `(symmetric to Claude B1)` — a cross-reference to a behavior ID from the sibling plugin's task breakdown. "B1" is a behavior identifier from a development plan, not a product term. Signal: test titles containing milestone markers / task-derived identifiers ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Rename to `should preserve CamelCase stem when emitting FileRule`. If symmetry documentation is needed, add a code comment referencing the corresponding claude test by its behavior-based name.
- **Why this isn't a false positive:** "Claude B1" is work vocabulary — "B1" is a behavior number from task planning that does not appear in the SUT.

### 17. `plugin-cursor/test/emit.test.ts` line 1696, `(symmetric to Claude B2)` — deliverable-fossils

- **Location:** `plugin-cursor/test/emit.test.ts` → `should preserve CamelCase name when emitting GlobalPrompt (symmetric to Claude B2)`
- **Smell:** `deliverable-fossils`
- **Rationale:** Same pattern as Finding 16. Test name contains `(symmetric to Claude B2)` — a behavior ID from the sibling plugin's task plan. Signal: task-derived identifiers ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Rename to `should preserve CamelCase name when emitting GlobalPrompt`.
- **Why this isn't a false positive:** "Claude B2" is work vocabulary, not product vocabulary.

### 18. `plugin-cursor/test/emit.test.ts` line 1443, body comment citing `Behavior 3` — deliverable-fossils

- **Location:** `plugin-cursor/test/emit.test.ts` → `should set sourcePaths on each emitted resource WrittenFile (not on SKILL.md itself)`, body comment
- **Smell:** `deliverable-fossils`
- **Rationale:** Body comment reads `// Behavior 3: resource WrittenFiles must populate 'sourcePaths' so that...` — citing a behavior number from the development task. Signal: "Docstrings or comments citing design-doc section numbers or AC identifiers" ([deliverable-fossils](https://texarkanine.github.io/slobac/taxonomy/deliverable-fossils/)).
- **Prescribed remediation:** Strip `Behavior 3:` prefix from the comment. The remaining text explaining why `sourcePaths` is needed for `buildMapping` and `--rewrite-path-refs` is valuable domain documentation.
- **Why this isn't a false positive:** "Behavior 3" is work vocabulary from the task planning system, not a product term.

### 19. `plugin-cursor/test/emit.test.ts` — monolithic-test-file

- **Location:** `plugin-cursor/test/emit.test.ts` (entire file)
- **Smell:** `monolithic-test-file`
- **Rationale:** 1775 lines, ~62 tests, 10 top-level `describe` blocks: Cursor Plugin Emission, FileRule Emission, SimpleAgentSkill Emission, Mixed Emission, AgentIgnore Emission, ManualPrompt Emission, Skills Emission, sourceItems tracking, AgentSkillIO Emission, filename case preservation. Signals: >1000 lines, >50 tests, multiple top-level describes naming clearly different subjects ([monolithic-test-file](https://texarkanine.github.io/slobac/taxonomy/monolithic-test-file/)).
- **Prescribed remediation:** Split by behavior domain, mirroring the proposed claude emit split: `emit-global-prompt.test.ts`, `emit-file-rule.test.ts`, `emit-agent-skill.test.ts`, `emit-agent-ignore.test.ts`, `emit-manual-prompt.test.ts`, `emit-agent-skill-io.test.ts`, `emit-source-items.test.ts`, `emit-filename-case.test.ts`.
- **Why this isn't a false positive:** Each model type has distinct emission logic and output format — genuinely different behavior domains.

### 20. `plugin-cursor/test/discover.test.ts` — monolithic-test-file

- **Location:** `plugin-cursor/test/discover.test.ts` (entire file)
- **Smell:** `monolithic-test-file`
- **Rationale:** 831 lines, ~66 tests, 9 top-level `describe` blocks: Cursor Plugin Discovery, MDC Parsing, FileRule Discovery, SimpleAgentSkill Discovery, Classification Priority, AgentIgnore Discovery, Cursor Skills Discovery, ManualPrompt Discovery, AgentSkillIO Discovery. Signals: >50 tests, multiple top-level describes naming clearly different subjects ([monolithic-test-file](https://texarkanine.github.io/slobac/taxonomy/monolithic-test-file/)).
- **Prescribed remediation:** Split by customization type: `discover-global-prompt.test.ts`, `discover-mdc-parsing.test.ts`, `discover-file-rule.test.ts`, `discover-agent-skill.test.ts`, `discover-classification.test.ts`, `discover-agent-ignore.test.ts`, `discover-skills.test.ts`, `discover-commands.test.ts`, `discover-agent-skill-io.test.ts`.
- **Why this isn't a false positive:** Each top-level describe tests a distinct customization type with different file patterns, frontmatter, and classification logic.

## Tests considered but not flagged

- `plugin-claude/test/discover.test.ts` and `plugin-cursor/test/discover.test.ts` — extensive `semantic-redundancy?` tags were applied by batch assessors due to parallel test structure across the two plugin suites. Cross-suite assessor confirmed these are intentionally mirrored: different SUTs (`claudePlugin` vs `cursorPlugin`), different file formats (`.claude/rules/*.md` with YAML `paths:` vs `.cursor/rules/*.mdc` with `globs:` comma-separated), different fixtures, and different parsing logic. The parallel structure reflects the shared plugin interface, not duplicated knowledge.
- `plugin-claude/test/emit.test.ts` and `plugin-cursor/test/emit.test.ts` — same rationale as discover: different output formats (`.md` with YAML frontmatter vs `.mdc`; `disable-model-invocation` skills vs `.cursor/commands/*.md`), different emit codepaths.
- `engine/test/engine.test.ts` line 26 (`should get plugin by id`) vs line 79 (`should return the plugin via getPlugin after source tracking refactor`) — behavior summaries are identical (both call `getPlugin('cursor')`, assert id and name). Flagged as `deliverable-fossils` (Finding 7) for the fossil name. The in-file semantic redundancy is a per-file concern noted in the finding's remediation (suggests merging the two), not a cross-suite finding.
- `cli/test/integration/integration.test.ts` — all 35 integration-tier tests were evaluated for `wrong-level`. All correctly exercise the full multi-component pipeline (engine + plugins + file I/O). None are pure-function tests that belong in unit tier.

## Out-of-scope requests

None.
