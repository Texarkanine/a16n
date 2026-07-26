---
task_id: issue-142-spec-compliance-gates
date: 2026-07-25
complexity_level: 3
---

# Reflection: Realign conversion gates with the AgentSkills.io spec

## Summary

Deleted `plugin-cursor`'s obsolete four-pattern command-complexity gate (issue #142) and added AgentSkills.io spec-compliance detection to `plugin-claude` skill discovery, plus an unplanned third deliverable — a Cursor ingest advisory for command frontmatter passthrough. Succeeded: 1038 tests green on a cache-disabled run, with seven of the eight requirements delivered as written and the eighth deliberately narrowed mid-flight on operator principle.

## Requirements vs Outcome

Seven of the eight requirements were delivered as written. Requirement 2 was deliberately narrowed and is **not** met as written; one acceptance criterion is satisfied only vacuously; and three deliverables were added that no phase before preflight anticipated.

**Reinterpreted — Requirement 2 ("cover *all* non-spec Claude features").** The shipped detector covers 13 features, deliberately excluding `$1` positionals and `$name` named arguments, which *are* genuine non-spec Claude features. The operator narrowed the requirement at QA with a governing principle — *our job is not to lint people's files; it is to convert them faithfully and be honest about when we cannot* — and its operational form: **detectors that cannot fire alone get cut.** So the requirement as written was not met, and that is the correct outcome. This is documented in the module header so the next reader does not "fix" the omission.

**Reinterpreted — Acceptance Criterion 6** (`pnpm build && pnpm test && pnpm lint && pnpm typecheck`). Three of those four commands verify something. `pnpm lint` executes zero tasks in this repo — no package defines a `lint` script — so AC6 is satisfied only vacuously in its fourth term. QA flagged the same overstatement in `techContext.md` and routed it out as pre-existing. Worth stating plainly rather than recording AC6 as cleanly met: a criterion that names a no-op command gives false assurance every time it is checked.

**Added — the Cursor frontmatter advisory (OQ4).** Not in the project brief, not in the plan, not in either creative doc. It emerged from preflight Finding C: a `.cursor/commands/*.md` beginning with a `---` block was silently corrupted on `main`, gate in place, zero warnings. `hasFrontmatterBlock()` in `mdc.ts` plus a per-command `Approximated` warning. This is scope growth, and it was the right call — gate removal would have widened exposure to that path without addressing it.

**Added — a second follow-up issue.** Step 10 called for the Category-B filing ([#143](https://github.com/Texarkanine/a16n/issues/143)); preflight surfaced that `--delete-source` derives its entire safety model from `Skipped` warnings, filed as [#144](https://github.com/Texarkanine/a16n/issues/144).

**Added — a fifth docs surface.** The plan named four; `packages/docs/docs/plugin-claude/index.md` would otherwise have been the only page enumerating Claude dispositions without the new advisory.

## Plan Accuracy

The plan's **sequence** was right after one preflight-corrected swap (test inversion before gate deletion — the original order would have meant repairing a test the implementation had just broken). All 11 steps executed as written.

The plan's **file list** contained three factual errors about the codebase, all caught by preflight, none of which reached build:

- `plugin-claude` has no `discoverSkills()`. The plan and `creative-body-feature-detection.md` both directed the implementer to a function that exists in `plugin-cursor` only; Claude's skill loop is inlined in `discover()`.
- "Emit the advisory after the `hooks:` skip" was precise-sounding and wrong — three later branches also `continue` without producing an item, so a description-less skill would have collected both a `Skipped` and an `Approximated`. The correct predicate is *an item was produced*.
- Two hand-maintained docs-site pages were missing from step 9.

**The forecasting record is the interesting part, and it is poor in a specific way.** The plan carried five named Challenges and a five-item Pre-Mortem — ten predictions total. Essentially none of them materialized:

- *"Deleting the gate changes warning counts in tests that assert aggregate totals"* — never happened. Preflight's scripted blast-radius scan had already proven it could not.
- *"Turbo caching masks stale test results"* — discharged in this reflect phase by forcing an uncached run: 1038 tests, identical to the cached number.
- *"The premise is wrong — Cursor commands do expand `@path`"* — did not occur.
- *"We fix the reported bug and ship a new one in the detector"* — the closest to a hit. QA did find a detector defect (`/\$[0-9]/` matching `$0` and `$100`), but in the *pattern* half, not the false-positive half the pre-mortem armored against. The dedicated negative-case tests all passed.
- *"Scope creep into Category B"* — did not occur; step 10 discharged it as designed.
- *"`$N` gating misfires on legitimate bare `$1`"* — moot. The entire feature was cut at QA.

Meanwhile **both events that actually reshaped the task were unforecast**: preflight Finding C (a live silent-corruption defect on `main`, unrelated to the task's premise) and the fire-alone redundancy that deleted two features and one creative decision. The pre-mortem was well-constructed and still predicted nothing that happened. Its value, if any, was indirect — it prompted the blast-radius scan that made one of its own risks impossible.

## Creative Phase Review

**`creative-hooks-disposition.md` (OQ2) held completely.** Zero churn: no code change, no test change, no doc change. Its real product was not the answer but the generalized rule it extracted — *loss that silently removes an author-specified restriction fails closed; loss that visibly breaks a substitution fails open* — which was reused verbatim in `systemPatterns.md` and in the code comment above the skip. A creative phase that outputs a reusable classifier rather than a one-off verdict is doing its job.

**`creative-body-feature-detection.md` (OQ1) was overturned in its selection and vindicated in its eliminations.** It evaluated four options and chose C (frontmatter-gated hybrid) over A (tightened regex on the raw body). The *entire* distinguishing feature of C over A was using frontmatter as a disambiguating gate for body constructs that collide with shell syntax — which existed solely to make `$N` detectable safely. When QA cut `$1` and `$name`, the gating machinery (`declaresArguments`, `declaredArgumentNames`) went with them. **What shipped is Option A.** The frontmatter handling that remains is plain key membership, which the creative doc itself classified as "unambiguous — no design decision here."

The eliminations, by contrast, hold and still matter. Option B (strip fenced code blocks before scanning) was rejected on *correctness*, not cost: Claude substitutes inside fences, so exempting them manufactures false negatives in the higher-cost direction. That is a non-obvious finding that would likely have been implemented as "the careful choice" without the creative phase. Option D was correctly dismissed as emulation of something never rendered.

**Why the selection failed is the useful part, and it is not a reasoning error.** The creative phase asked *"how do we detect `$N` accurately?"* and answered it well. It never asked *"should `$N` be reported at all?"* — it inherited requirement 2's "cover everything non-spec" as a given and optimized within it. The design question was well-posed and well-answered; the scoping question was never posed by anyone until QA.

**Mega-unknowns were correctly identified but wrongly ranked.** The plan treated blast radius as its largest unknown; preflight proved it was nil in a single scripted pass. The genuine unknown — whether the enumerated feature set was the right set — was never flagged by any phase.

## Build & QA Observations

**Build was clean and unremarkable, which is the notable thing.** TDD held throughout (18 cursor tests failing before the gate deletion, 25 detector tests before `spec-compliance.ts`, 2 integration tests before the wiring). Preflight Finding A's blast-radius prediction held exactly: not one pre-existing assertion outside the three named files needed touching. No rework, no reordering, no discovered blockers. All the difficulty in this task lived in deciding what to build.

**QA's most valuable output was deletion, not defect-finding.** Of four changes it drove, one was a genuine bug (`$0`), two were feature removals, and one was a test-strength change. Net: `NON_SPEC_FEATURES` 15 → 13, suite 1042 → 1038, and **warning counts unchanged on every possible input** — the trims removed labels from warnings that were already firing, never a warning.

**The `$0` defect has a diagnostic shape worth keeping.** `$N` gating was correctly identified across three phases as the hard case and given real design attention. The pattern that shipped was `/\$[0-9]/` — so the difficult half (deciding *when* to look for positionals) was right, while the trivial half (deciding *what a positional looks like*) silently regressed against the very code being deleted, which used `[1-9]`. Attention concentrated where the design difficulty was, and the mechanical half went unexamined *because* it was mechanical.

**One test-hygiene finding generalizes.** Removing the `$N` gate silently converted its tests into tautologies that still read like coverage — "should not report `$1` when the skill declares no arguments" kept passing while asserting nothing and implying gating logic that no longer existed. A green test describing deleted machinery is worse than no test.

**The best single artifact of the whole task is one word.** Tightening the per-feature assertion from `toContain(label)` to `toEqual([label])` converts the fire-alone rule from convention into a CI failure for any future detector that cannot warn independently. No new test, no new code. The coverage test already iterated every feature — it was one assertion-strength away from having caught both trims automatically.

## Cross-Phase Analysis

**Chain 1 — a requirement's framing propagated three phases before failing (the expensive one).** Requirement 2 said "cover *all* non-spec features," a **feature-enumeration** framing. Creative built gating machinery to make the hardest member of that set detectable. Build implemented `declaresArguments` and `declaredArgumentNames`. QA discovered those members could not fire independently and cut them, taking the creative decision and its implementation with them. The root cause sits at requirement-writing time: *"cover every non-spec feature"* and *"report every loss"* read as the same instruction and produce different sets, because a feature that cannot occur without another feature is not a distinct loss. The divergence is invisible while enumerating and obvious once you ask which members can fire alone.

**Chain 2 — a late discovery that *increased* coherence (the cheap one).** Preflight Finding C was initially recorded as non-blocking on reasoning that was backwards: it used the artificiality of a16n's *own fixtures* as evidence about what *users* can write. The operator challenged it, an experiment against unmodified `main` disproved it, and the resulting OQ4 produced a fifth disposition that all four offered options had excluded by construction — *preserve the content and warn*. The task ended on a single principle it did not start with: **preserve content the source harness cannot act on semantically, and report it exactly once.** Both halves now do the same thing; #142's gate was the exact inverse. Note the contrast with Chain 1 — a late reversal is not inherently costly. Chain 1 was expensive because it invalidated built work; Chain 2 was cheap because preflight is before build.

**Chain 3 — preflight's detection worked while its judgment failed.** Finding C was found by preflight and then dismissed by preflight. Only the operator's challenge recovered it. The phase's mechanical value (looking at the real code) and its evaluative value (deciding what matters) came apart, and only the first was reliable.

**Chain 4 — the same analogy trap fired twice, at two different levels.** Planning read `plugin-claude` across from `plugin-cursor` and invented a `discoverSkills()` that does not exist. Later, at QA, `positional-arguments` was nearly trimmed by analogy with `named-arguments` on the shared property "cannot fire alone" — and the analogy was genuinely unsound (one's companion is the declaration machinery, the other's may be a mere display hint). It happened to reach the right answer for the wrong reason, since the operator cut both on a general rule. Structural similarity invited a single verdict twice in one task.

**Chain 5 — a consolidation justified as future insurance paid immediately, three times.** The single `NON_SPEC_FEATURES` array was accepted at preflight as anti-drift protection for future edits. It paid at build (the ordering contract came free from iterating ids), at QA (verifying docs completeness became counting 9 and 6 against an array instead of reading prose and judging), and at QA again (it was the hook that made the fire-alone rule enforceable by one assertion change). None of these were the predicted benefit.

## Process Observations

**Phase value was unevenly distributed, and not where the workflow assumes.** Preflight was decisive — it found a live production defect unrelated to the task premise, corrected three plan errors before they cost build time, and discharged the plan's largest flagged unknown by script. QA was decisive in an unusual direction: scope reduction on operator principle. Plan and Creative produced one durable artifact each (the disposition rule; the fence-stripping rejection) alongside decisions that were later overturned. Build was mechanical.

**The artifact ratio is lopsided and, here, defensible.** Roughly 210 lines of production code and ~390 of tests and fixtures, against ~930 lines of memory-bank prose. That ratio is not normal and should not be normalized — but this task's difficulty was almost entirely in deciding what to build, and it reversed course twice on questions that were genuinely hard. The prose is where the work happened.

**Empirical probes beat reading, repeatedly and cheaply.** Four times, a short script settled a question that analysis could not: the blast-radius scan across 27 fixtures, the `main` experiment that disproved the Finding C advisory, the fire-alone probe across every `arguments:` YAML shape, and the forced uncached test run in this phase. Each was minutes of work and each overturned or hardened a conclusion reached by reading.

## Insights

### Technical

- **A detector that cannot fire without another detector is not a distinct signal, and should be cut.** Now enforced in CI by `toEqual([label])` on the per-feature coverage test rather than left as convention. Generalizes to any validator, linter, or reporter set: the enumeration question is not "is this a real feature?" but "can this be the *only* thing I have to say?"
- **Deleting a guard silently converts its tests into tautologies that read like coverage.** They keep passing, assert nothing, and actively mislead the next reader about what the module does. When removing a gate, audit its negative tests for ones that only had meaning while the gate existed.
- **Content fidelity and semantic fidelity are separate obligations, and a conversion tool can only fully discharge the first.** Bytes it cannot interpret still belong to the author. The correct default for anything unrecognized is preserve-and-report — never strip-because-meaningless, and never pass through silently. Both halves of this task collapsed onto that rule.
- **`--delete-source` converts every silent-degradation bug into a data-loss bug**, because its safety rests entirely on `Skipped` warnings. Any path that degrades content without warning is invisible to it by construction. Filed as [#144](https://github.com/Texarkanine/a16n/issues/144); worth treating as a standing invariant when touching any emit path.
- **The gitignored `.generated/` docs under `packages/docs/static/` are a standing false alarm** for any orphan or stale-claim scan. They surfaced stale "Complex Commands" rows that look like missed documentation until you confirm they are untracked build output.
- **`pnpm lint` is a no-op in this repo** — no package defines the task. Any checklist, acceptance criterion, or doc that lists it as validation is overstating coverage. It was claimed in `techContext.md`, in this task's own AC6, and in the step-11 verification list; all three were corrected during PR review to name only the three commands that actually verify something. Whether the repo *should* gain a real lint task remains open.

### Process

- **Ask of every enumerated set member: "can this fire alone?" — at enumeration time.** This one question, asked during planning, would have prevented a creative decision, a build sub-system, and three QA turns in this task. It is the cheapest available guard against a completeness mandate producing members that cannot independently justify themselves.
- **"Cover every X" and "report every loss" are different instructions that look identical while you are writing the list.** When a requirement is phrased as feature coverage, restate it as loss coverage before enumerating, and see whether the set changes.
- **Options generated from a single unexamined premise all inherit it, and offering four of them manufactures an illusion of coverage.** All four OQ4 dispositions assumed the frontmatter was a problem to remove; the correct answer — keep it and say so — was excluded by construction. When every option shares a direction, the shared direction is the thing to examine, not the options.
- **A format's spec constrains how a tool *interprets* bytes, never which bytes are *present*.** For an ingest tool only the latter matters. The Finding C error was epistemic, not analytical: every fact in the original advisory was correct, and "the format does not support X" was silently converted into "users' files do not contain X."
- **Using your own fixtures as evidence about the world inverts what fixtures are for.** Their unrealism is a coverage gap to fix, not proof that reality is tame. "No test asserts on it" is a problem statement, not reassurance.
- **A migration tool's users are self-selected for atypical config.** Reachability arguments that reason about "typical" users are structurally wrong here — half-migrated state is precisely the condition a16n exists to resolve, so the weirdest inputs are the most likely ones.
- **A rule that is 90% right and uniform beats one that is 100% right and conditional.** The `argument-hint:`-gated exception I defended was real, but encoding it meant a detector whose firing condition was "am I redundant right now" — unexplainable to the next reader and a standing invitation to re-litigate.
- **Prefer a scripted probe against the *built* artifact over reasoning about the source.** Four times this task, minutes of scripting overturned or hardened a conclusion that reading had produced — including one, the fire-alone property, that I had not suspected from reading at all.
