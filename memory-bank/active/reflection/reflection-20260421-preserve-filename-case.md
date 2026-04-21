---
task_id: 20260421-preserve-filename-case
date: 2026-04-21
complexity_level: 2
---

# Reflection: Preserve filename case in rule emit (Cursor + Claude)

## Summary

PR #84 rework: rule filenames under `.cursor/rules/**` and `.claude/rules/**` were being lowercased on emit (e.g. `activeContext.mdc` → `activecontext.md`), even though the AgentSkills.io spec only mandates lowercase for skill **directory** names. Split `sanitizeFilename`/`sanitizeName` in plugin-claude into three intent-named helpers (`sanitizeRuleFilename`, `sanitizeRuleStem`, `sanitizeSkillDirName`); widened the regex + dropped `.toLowerCase()` in plugin-cursor's `sanitizeFilename`. Added case-insensitive collision detection plugin-locally in both plugins without touching the public `@a16njs/models::getUniqueFilename`. QA PASS with no rework.

## Requirements vs Outcome

Delivered every behavior in the plan (B1–B11). Nothing dropped, nothing silently reinterpreted. Two deltas worth noting, both benign:

- **B3/B4/B5/B11 passed even before the fix.** The pre-fix code already happened to produce the spec-correct skill-dir lowercasing (B3–B5) and leading-dot behavior (B11). Tests still added — they pin the intent-split so a future "simplification" that merges the three sanitizer functions back into one trips multiple guards.
- **Cursor sanitizer stayed minimal.** Plan allowed either a parallel rename triad or an in-place regex widening. Chose the minimal path for plugin-cursor because all its `sanitizeFilename` call sites are rule-filename sanitization already; the rename gives no disambiguation there. Disclosed as a deviation in `activeContext.md`.

Two pre-existing plugin-cursor tests (`test/emit.test.ts:137`, `:216`) that asserted the old lowercasing were updated to assert the corrected case-preserving behavior. This is B10 in reverse and was expected.

## Plan Accuracy

The plan held up cleanly once the two post-preflight corrections landed. Build hit zero surprises, QA found zero substantive issues, zero fixes. The plan's design-decision table (`sanitizeSkillDirName` / `sanitizeRuleFilename` / `sanitizeRuleStem` split; plugin-local collision detection instead of touching `@a16njs/models`) pre-chose the right shape.

The **valuable plan correction** happened mid-cycle between preflight and build, driven by operator review:

1. **Semver bug caught** — initial plan proposed changing `@a16njs/models::getUniqueFilename` semantics; that's a public helper at `0.12.0`, and "strictly safer behavior" is still an observable change. Amended to plugin-local helpers only. Public surface byte-identical.
2. **B8 recharacterized** — initial plan treated Cursor skill-dir lowercasing as "a16n convention, defer follow-up." Actually, Cursor implements the AgentSkills.io spec per [cursor.com/docs/skills](https://cursor.com/docs/skills); the `name` + parent-directory rule binds Cursor skill dirs identically to Claude's. Lowercasing is spec-mandated; "follow-up" framing was wrong. No code change, but the operating principle tightened: *preserve case by default across the whole system; the only exceptions are target-spec-mandated.*

Both corrections came from the operator reading the plan carefully and pushing back, not from build-time surprise. Pre-build is the cheap place to catch these.

## Build & QA Observations

Build: clean. 6 plan steps, committed as a single implementation commit (`2e7ac42a`). Engine, CLI, and plugin-a16n untouched. 19 new tests added across the two plugin test files; all green on first run. Full validation: 15/15 turbo tasks pass on Node 22.

QA: semantic review only. All seven rubric dimensions came back `severity: none, action: none`. The review noted two things worth re-reading later:

- Plugin-cursor has one inline regex (`emit.ts:484`) that duplicates the body of `sanitizeFilename` — deliberate, because feeding a pre-derived stem through `sanitizeFilename` would double-strip basename/extension. Worth a comment (already present).
- `sanitizeRuleStem`'s empty-input fallback is `'global-prompt'` rather than the plan's `'rule'`. This is a semantic improvement (the helper is only used for `GlobalPrompt.name`) and is only reachable on all-non-alphanumeric inputs.

QA also surfaced the now-familiar **cursor-server Node-shadowing** — the agent's `PATH` puts `/home/mobaxterm/.cursor-server/bin/<hash>/node` (v20) ahead of nvm's v22 inside the Cursor agent shell. Fixed locally for the QA run by prepending the nvm path. Same class of symptom as the prior task's Node 20→22 narrative-pollution issue, but caught earlier and without contaminating memory-bank files.

## Insights

### Technical

- **Naming-driven intent encoding works.** `sanitizeRuleFilename` / `sanitizeRuleStem` / `sanitizeSkillDirName` make it physically awkward to apply the wrong normalization at a new call site — the author has to name their intent before picking a helper. This is a cheap win for a tiny, cross-cutting concern (filename normalization) that previously lived in one over-generalized function.
- **Case policy is per-plugin business, not a shared-models concern.** Pushing case-insensitive collision detection into `@a16njs/models::getUniqueFilename` would have been whitebox coupling — it presumes every future plugin wants the same case-insensitive policy. Plugin-local collision helpers preserve the semver contract of the published shared helper and let a future plugin (e.g. for a harness with different filesystem assumptions) pick its own stance. Small point, but it's a useful pattern when an "improvement" to a shared helper is really a policy choice.
- **Tests that pass against unfixed code still earn their keep.** B3–B5 and B11 passed before and after. They exist now as regression guards for the intent-split, not as evidence that the fix worked. Good tests document what must remain true; they don't have to be green-then-red-then-green to do that.

### Process

- **Operator plan-review between preflight and build is high-leverage.** The two plan corrections (semver bug + B8 recharacterization) would have been expensive to catch in build and nearly impossible to catch in QA (QA reviews the build output against the plan, not the plan against first principles). Both got caught because the operator re-read the plan critically after preflight PASS'd. "Preflight PASS" is not "plan frozen."
- **The operating principle was the load-bearing artifact.** "*Preserve case by default. The only exception is where the target's spec genuinely requires otherwise.*" — one sentence, written into `activeContext.md` after the B8 recharacterization. That sentence made subsequent design decisions (don't touch Cursor skill dirs, don't touch the public helper, split by intent) mechanical. Level 2 tasks usually don't need stated principles, but this one threaded through three plugins, a public package boundary, and spec compliance — worth the extra sentence.
- **The Cursor-agent Node-shadowing is a recurring pattern.** Second task in a row where `cursor-server/bin/<hash>/node` (v20) shadowed nvm's v22 inside the Cursor agent shell specifically. Users' normal terminals don't see this. Worth a one-liner in `techContext.md` or an environment-check in CI, if it costs us again.

### Million-Dollar Question

If "preserve source filename case by default, except where the target spec requires otherwise" had been a foundational assumption at plugin-design time, the emit layer wouldn't have a general-purpose `sanitizeFilename` function at all. Instead there would be two narrowly-scoped helpers from the start — `sanitizeRuleFilename(sourcePath)` (case-preserving, widened regex) and `sanitizeSkillDirName(name)` (spec-compliant lowercase) — living in `@a16njs/models` (or a shared `packages/sanitize`) with one set of tests, called identically from every plugin. Case-insensitive collision detection would be a property of the filesystem-writing boundary (probably a flag on the `Workspace` or `WrittenFile`-writer layer), not duplicated inside each plugin. The widening regex `[^A-Za-z0-9]+` would be the only regex in the system.

That design is effectively what this fix converges toward. The refactor-delta from where we are now to the "most elegant" version is: (a) promote the two plugin-claude helpers to `@a16njs/models`, (b) rename plugin-cursor's `sanitizeFilename` to match, (c) move collision detection into a shared write-time helper. All three are small, mechanical, and safe to batch into a later cleanup pass. Similar to the prior task's answer — we did the right shape of fix; the more elegant version is a consolidation task away, not a different architecture.
