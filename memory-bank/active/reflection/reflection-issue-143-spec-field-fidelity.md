---
task_id: issue-143-spec-field-fidelity
date: 2026-07-26
complexity_level: 3
---

# Reflection: Model current AgentSkills.io spec fields in the skill IR

## Summary

Extended the skill IR so `license`, `compatibility`, `metadata`, and `allowed-tools` survive conversion end to end, with behavior-keyed Cursor warnings and a fail-closed `--delete-source` guard for unenforceable `allowed-tools`. The work succeeded against the brief; follow-ups for `ManualPrompt` description loss and Cursor `paths:` were filed rather than absorbed.

## Requirements vs Outcome

All seven brief requirements shipped: IR fields via `AgentSkillSpecFields`, `specMetadata` vs transient `metadata`, discover/emit on claude and cursor, disposition-aware warnings, `plugin-a16n` round-trip, and docs/`systemPatterns.md` updates. One planned addition from preflight (16-combination fidelity property test) was adopted and proved load-bearing. Nothing required was dropped; the two deferred items (#147, #148) were scoped out with reasons during creative.

## Plan Accuracy

The models → claude → cursor → a16n → CLI → docs sequence held. The highest-risk step (cursor parser swap) produced zero characterization diffs. Surprises were operational rather than design: stale `dist` made integration tests look like missing features twice during build and once during QA. The one intentional plan deviation — hoisting `formatSpecFieldsYaml` into models — was correct; QA only had to finish the job by sharing the object-form mapper too (`assignSpecFields`).

## Creative Phase Review

- **OQ1 (`specMetadata`):** Held. Zero blast radius, paired doc comments, on-disk key stays `metadata`. No friction in build.
- **OQ2 (shared interface on three types):** Held, and the ManualPrompt case was correctly treated as the highest-stakes discover test. The deferred `description` loss is still the taxonomy smell that may make this fix look partial later — filed as #147.
- **OQ3 (behavior-keyed disposition):** Held. Encoding the table in one module paid off immediately (five emit sites, one helper). The "write + Skipped" reading of fail-closed depended on verifying `Skipped` semantics once; that verification was the load-bearing creative fact.

## Build & QA Observations

Build was mostly green once `dist` was rebuilt; the property test's mutation check was the best verification move of the phase. QA found no substantive gaps — only the leftover object-form key-mapping duplication that the string-form hoist had not covered. That is a good failure mode: the design intent was already right, the consolidation incomplete.

## Cross-Phase Analysis

Preflight's Finding A (TDD steps not encoded as a/b/c/d) was real process debt, but remediating in-phase did not prevent the step-7 TDD skip that build later recorded. Encoding the cycle in the plan is necessary and not sufficient — the red still has to be assertion-level. Preflight Finding B (property test) directly prevented a class of silent-loss regressions the example-based plan would have missed. Creative's measurement habit (count rename sites, count version literals) kept OQ1 and the version bump cheap.

## Insights

### Technical
- Stale built plugin output is the dominant false-red for this monorepo: CLI and cross-package imports resolve `@a16njs/*/dist`, so source-green packages can still fail integration until `pnpm --filter <pkg> build`. Treat "rebuild models/plugins" as the first hypothesis when a new export or emit path appears missing.
- "Bytes preserved" and "behavior preserved" are independent axes; only `allowed-tools`→Cursor disagrees on them, which is why a disposition table beats a uniform emit rule.

### Process
- A thorough Test Plan section that is not mirrored inside numbered steps creates a false sense of TDD coverage — preflight caught the encoding gap, but build still slipped once. Prefer steps that cannot be executed without a red assertion run.
- Mutation-checking a silence-detector (stub the emitter, confirm the property test fails for the right combinations) is cheap and should be the default for any test whose purpose is catching absence of warnings.
