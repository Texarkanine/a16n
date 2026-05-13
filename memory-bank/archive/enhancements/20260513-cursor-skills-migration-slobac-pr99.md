---
task_id: cursor-skills-migration-slobac-pr99
complexity_level: 3
date: 2026-05-13
status: completed
---

# TASK ARCHIVE: Cursor ManualPrompt → Skills migration, SLOBAC test rework, and PR #99 follow-up

## SUMMARY

This archive captures a single Level 3 arc on the `no-cursor-commands` workstream: (1) migrating the Cursor plugin so `ManualPrompt` items emit to `.cursor/skills/<name>/SKILL.md` with `disable-model-invocation: true` instead of legacy `.cursor/commands/`, while preserving discover-side support for legacy commands and documenting non-roundtrip behavior; (2) a SLOBAC-driven test-suite rework in `packages/plugin-cursor` addressing ten audit findings (conditional logic, vacuous assertions, semantic redundancy), including a new fixture that proves globs-over-description classification precedence; (3) post-reflect fixes from PR #99 review—collision keys for `usedSkillNames` keyed by normalized `relativeDir` for `ManualPrompt`, a regression test, a strengthened CLI integration test that no longer reads input paths back as a false positive, and tighter path assertions in `emit-manual-prompt.test.ts`. Final verification noted **134** tests in `plugin-cursor` and **175** in `cli`, with clean build and lints on touched packages.

## REQUIREMENTS

**Migration phase (cursor-commands deprecation)**

- Emit `ManualPrompt` only as Agent Skills under `.cursor/skills/`, with correct YAML frontmatter (including `disable-model-invocation: true`), aligned with Claude plugin and Cursor guidance.
- Remove emission to `.cursor/commands/` for `ManualPrompt`.
- Retain discovery of legacy Command files where applicable; document discover/emit asymmetry and non-roundtrip behavior in code, tests, CHANGELOG, and docs.
- Follow strict TDD per workspace rules.

**SLOBAC rework phase (`slobac-rework-cursor-tests`)**

- Resolve all ten findings in `slobac-audit.md`: three conditional-logic, three vacuous-assertion, four semantic-redundancy items across `packages/plugin-cursor/test/`.
- Remove semantically redundant tests where canonical coverage exists in dedicated files.
- Replace weak oracles (`toBeDefined()`, loose regex) with exact structural expectations where values are derivable from implementation.
- Rework the “globs takes precedence” case with a fixture that has **both** `globs` and `description` so the test proves precedence, not a single signal.
- Maintain zero regressions; full package suite must pass with expected net reduction in test count after deletions.

**Post-reflect PR #99**

- Fix collision handling so the same `promptName` under different `relativeDir` values does not spuriously rename; preserve unified collision behavior with `SimpleAgentSkill` (flat layout).
- Replace vacuous CLI integration coverage that could pass under a no-op emitter with assertions on emitted `.cursor/skills/.../SKILL.md` and absence of regenerated legacy command paths where appropriate.
- Align nitpick assertions with actual `WrittenFile` shapes (`path`, not a non-existent `sourcePath`).

## IMPLEMENTATION

### Migration (emit / discover / docs)

- **`packages/plugin-cursor/src/emit.ts`**: Skill emission for `ManualPrompt`, directory layout under `.cursor/skills/`, sanitization and collision tracking (`usedSkillNames`), later refined so `ManualPrompt` collision keys incorporate normalized `relativeDir` when present, falling back to bare name when empty (keeps `SimpleAgentSkill` behavior flat at `.cursor/skills/<name>/`).
- **`packages/plugin-cursor/src/discover.ts`**: Comments documenting legacy Command discovery and asymmetry with emit.
- **Tests and fixtures** under `packages/plugin-cursor/test/`: emit and discover suites updated for skills layout, non-roundtrip documentation in tests, CHANGELOG and package docs updated per plan.

### SLOBAC rework (tests + fixture)

**Finding → file mapping (condensed from plan in `tasks.md`):**

| Finding | Smell | File | Action |
|--------|-------|------|--------|
| 1–3 | conditional / redundancy | `discover-classification-priority.test.ts` | Delete two redundant tests subsumed elsewhere; rework precedence test with new fixture |
| 4 | vacuous | `discover-cursor-plugin.test.ts` | Exact `relativeDir` strings for deep-nested rules |
| 5 | vacuous | `emit-global-prompt.test.ts` | Exact sanitized filename `My-Rules-v2.mdc` |
| 6 | vacuous | `emit-skills.test.ts` | Exact skill dir `my-skill-v2` |
| 7–8 | redundancy | classification tests vs `discover-file-rule` / `discover-simple-agent-skill-rules` | Delete overlapping cases |
| 9–10 | redundancy | `emit-skills.test.ts` vs `emit-manual-prompt.test.ts` | Remove duplicate ManualPrompt describe block from `emit-skills` |

- **New fixture:** `packages/plugin-cursor/test/fixtures/cursor-globs-and-description/from-cursor/.cursor/rules/both-fields.mdc` — rule with both `globs` and `description` to assert `FileRule` and `toHaveLength(1)`.

### PR #99 follow-up

- **`emit-manual-prompt.test.ts`**: Regression test for same `promptName` across different `relativeDir`; explicit positive/negative checks on `result.written[*].path`.
- **`packages/cli/test/integration/integration-commands.test.ts`**: Renamed/reworked test `cursor-to-cursor-command-migrates-to-skill` to assert real emitted skill output and no fresh `.cursor/commands/review.md`.

**Creative phase:** No `memory-bank/active/creative/` documents were produced for either sub-effort; design choices (e.g., rework vs delete for precedence test) were resolved in planning without a separate creative phase.

## TESTING

- **Migration + initial SLOBAC build:** Full `packages/plugin-cursor` Vitest runs and `pnpm build`; TDD loop with failing-then-passing suites as documented in progress.
- **SLOBAC QA:** `.qa-validation-status` = `PASS`; `pnpm test && pnpm build` in `packages/plugin-cursor` with **133** tests after SLOBAC-only changes (Node engine warning noted: package prefers Node ≥22; environment had 20.18.2).
- **Post-reflect:** `plugin-cursor` full suite **134/134**; `packages/cli` **175/175**; builds and ReadLints clean on touched files.

**Preflight status (inlined):**

```
PASS
date: 2026-05-12
task: slobac-rework-cursor-tests
notes: Clean pass. Test-only refactor with no production code changes. All 10 SLOBAC findings mapped to concrete actions. Convention compliance verified (fixture naming, test layout). No conflicts or duplication-in-waiting.
```

**QA validation status (inlined):**

```
PASS
QA completed for SLOBAC rework. All 10 audit findings are resolved per plan; no semantic QA fixes were needed. ReadLints clean. `pnpm test && pnpm build` in `packages/plugin-cursor` passed with 133 tests (Node engine warning only: package wants >=22, shell has 20.18.2).
```

## LESSONS LEARNED

### From migration reflection (`cursor-commands-deprecation-migration`)

- `usedSkillNames` and `AgentSkillIO` patterns extended cleanly across former Commands vs Skills namespaces; unified collision handling became the norm.
- Intentional discover/emit asymmetry for legacy Commands is a supported, documented non-roundtrip scenario.

### From SLOBAC reflection (`slobac-rework-cursor-tests`)

- Collapsing overlapping audit findings into file-level actions before editing avoids double-fixing and clarifies coverage-preserving deletions.
- Classification priority tests need **competing** signals in fixtures; a single-signal fixture cannot prove precedence even if the test name claims it.
- Record planned vs observed test-count deltas explicitly; mismatches are a sanity check and should map to actual deleted test bodies.

### From post-reflect PR #99 (progress)

- Collision regressions can slip through if no fixture covers “same `promptName`, different `relativeDir`”; one axis-specific case was enough to catch the bug.
- Round-trip style tests that only read back an input path are dangerously vacuous—they look like coverage but prove nothing about emit behavior.
- Verify reviewer suggestions against real types before applying verbatim (e.g., `sourcePath` vs `path` on `WrittenFile`).

## PROCESS IMPROVEMENTS

- When a Level 3 task completes but the memory bank immediately picks up a related L3 follow-on (here: SLOBAC rework) without an intermediate archive, consider either archiving at each reflect boundary or explicitly treating the backlog as a **new** task ID in `tasks.md`/`projectbrief` to reduce multi-reflection accumulation in one `progress.md`.
- For PR feedback that lands after reflect, either append a short formal “post-reflect” subsection (as done in progress) or spawn a tiny L1 ticket so archive boundaries stay crisp.

## TECHNICAL IMPROVEMENTS

- Optional follow-up: extract shared `formatManualPromptAsSkill` (or equivalent) across plugins if duplication remains—explicitly deferred at preflight as cross-plugin refactor.
- SLOBAC-style sweep of other integration tests for “read back input path” vacuity patterns.

## NEXT STEPS

- None required for this workstream closure. Optional: broader integration-test audit per SLOBAC discipline.

---

## APPENDIX A — Reflection: `cursor-commands-deprecation-migration` (verbatim)

```markdown
---
task_id: cursor-commands-deprecation-migration
date: 2026-05-10
complexity_level: 3
---

# Reflection: Cursor Commands Deprecation Migration

## Summary

Successfully migrated the Cursor plugin's emit logic so that `ManualPrompt` items now produce `.cursor/skills/<name>/SKILL.md` files with `disable-model-invocation: true` (matching Claude Code and Cursor's new recommendation). Legacy Command discovery is preserved with explicit non-roundtrip documentation. All plan requirements delivered; 137/137 tests pass; build/lint clean.

## Requirements vs Outcome

All requirements from projectbrief.md were met without gaps or additions:
- Emission to `.cursor/commands/` fully removed for ManualPrompt.
- Correct Skill format with YAML frontmatter including disable flag.
- Discover of legacy Commands retained.
- Non-roundtrip behavior documented in emit.ts, discover.ts, tests, CHANGELOG, and docs.
- TDD followed; fixtures/tests updated in place.

No descoping or reinterpretation occurred.

## Plan Accuracy

The ordered TDD plan in tasks.md was executed exactly as sequenced:
- Test stubbing/updates first, failing run confirmation, then implementation.
- No steps needed reordering or splitting.
- Identified challenges (test breakage, collision handling) did not materialize as risks due to existing reusable logic.
- Open questions (description text, doc locations) resolved correctly upfront.

Surprises: None; the Claude reference implementation translated cleanly.

## Creative Phase Review

Creative phase was skipped per plan (high confidence from Claude plugin reference and existing patterns). No friction points encountered; the design decision held up perfectly during implementation.

## Build & QA Observations

Build went smoothly:
- TDD caught the need to update additional test files (emit-filename-case, emit-source-items) early via full suite run.
- Collision/sanitize/relativeDir logic reused without modification.
- Minor iteration only on adapting relativeDir for the new skills/<category>/<name>/SKILL.md structure.

QA was clean: only two trivial fixes (removal of dead `getUniqueCommandFilename` helper as YAGNI, cleanup of outdated TDD stub comment). No substantive issues or architectural gaps found. Preflight's advisory on future shared formatter was noted but correctly deferred.

## Cross-Phase Analysis

- Planning correctly identified the Claude reference and TDD mandate, which directly enabled zero-defect build.
- Preflight's non-blocking advisory surfaced a potential future reuse opportunity without delaying progress.
- Absence of creative phase was appropriate; no unknowns materialized.
- The workflow structure (Plan → Preflight → Build → QA → Reflect) provided excellent guardrails with minimal overhead for this scoped change.

No causal gaps between phases.

## Insights

### Technical
- Existing `usedSkillNames` collision tracking and `AgentSkillIO` patterns extended cleanly to cover former Commands namespace — unified handling across emit paths is now the norm.
- The intentional discover/emit asymmetry for Commands is now explicitly documented as a supported, non-roundtrip use case.

### Process
- Nothing notable beyond the value of strict TDD (caught test expectations early) and Niko L3 phase discipline (ensured documentation and non-regression checks).
```

---

## APPENDIX B — Reflection: `slobac-rework-cursor-tests` (verbatim)

```markdown
---
task_id: slobac-rework-cursor-tests
date: 2026-05-12
complexity_level: 3
---

# Reflection: SLOBAC Rework — Cursor Plugin Test Quality

## Summary

Successfully reworked the Cursor plugin test suite to resolve all 10 SLOBAC findings: redundant tests were removed, weak assertions were strengthened, and the globs-over-description precedence test now uses a fixture that actually witnesses the precedence behavior. QA passed with no semantic fixes required; `packages/plugin-cursor` has 133 passing tests and a clean build.

## Requirements vs Outcome

All requirements from `projectbrief.md` were met:
- All 10 SLOBAC findings were addressed according to the prescribed remediations.
- Redundant classification and ManualPrompt emission tests were removed where canonical coverage already existed.
- Vacuous assertions were replaced with exact expected values.
- Conditional-logic smells were resolved by deleting redundant loop tests or replacing the precedence case with a direct length/type oracle.
- The precedence fixture now contains both `globs` and `description`, so the test title and body align.
- No production code changed, and the full package suite passes with the expected reduced test count.

No requirements were dropped. The only plan correction was numeric: the final net deletion was 4 tests, so the suite count is 133 rather than the earlier 132 estimate.

## Plan Accuracy

The plan's file list, sequencing, and scope were accurate. The affected files were exactly the planned test files plus the new fixture. No steps needed reordering, and no additional implementation work appeared during build or QA.

The main surprise was count-related rather than technical: the initial plan text briefly said 5 deletions / 132 tests, but the consolidated finding map correctly implied 4 deleted tests / 133 tests. Build corrected the task record before QA.

## Creative Phase Review

No creative phase was needed. The only design choice was whether to delete or rework the globs-over-description precedence test; the plan chose rework because the precedence behavior is real product behavior. That decision held up cleanly during build and QA.

## Build & QA Observations

Build was straightforward because the SLOBAC audit provided precise remediation targets and the plan consolidated overlapping findings before edits began. The fixture-based discover tests made the precedence correction easy to express without adding new abstractions.

QA found no substantive or trivial issues. The implementation stayed test-only, preserved existing file organization, avoided new helpers or speculative structure, and verified cleanly with ReadLints plus `pnpm test && pnpm build` in `packages/plugin-cursor`.

## Cross-Phase Analysis

The most useful planning move was consolidating overlapping SLOBAC findings into a file-level action map. That prevented double-fixing the same smell and clarified why some findings should be deleted while the precedence case should be preserved with a better fixture.

Preflight/build/QA had no conflict: the plan's exact oracles mapped directly to implementation, and QA confirmed there was no leftover scaffolding or overreach. The Level 3 workflow was somewhat heavy for a test-only refactor, but useful because the smell report had overlapping findings and required careful preservation of canonical coverage.

## Insights

### Technical
- Test-quality audits are easier to implement safely when duplicate findings are collapsed into behavior-preserving actions before editing; otherwise, one smell can be counted and fixed twice.
- For classification-priority behavior, fixtures must contain multiple competing classification signals. A fixture with only one signal cannot prove priority, even if the test title says it does.

### Process
- For test-only SLOBAC reworks, record both the planned and observed test-count deltas explicitly. Count mismatches are a useful sanity check, but they should not drive behavior without mapping back to actual deleted test bodies.
```
