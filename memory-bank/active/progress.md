# Progress

Realign a16n's conversion gates with what the AgentSkills.io spec and each harness actually support today. Two halves: delete the obsolete four-pattern complexity gate from `plugin-cursor` command discovery (the subject of [issue #142](https://github.com/Texarkanine/a16n/issues/142)), and add AgentSkills.io spec-compliance detection to `plugin-claude` skill discovery covering all non-spec Claude features, reported as one advisory warning per skill.

**Complexity:** Level 3

## 2026-07-25 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Fetched and analyzed issue #142 and the current `plugin-cursor` command-discovery implementation, its tests, and its fixtures.
    - Pre-verified the issue's premise against current primary sources: agentskills.io specification, Cursor skills/context docs, Claude Code skills + slash-commands docs, and Anthropic's `plugin-dev/skills/command-development` skill.
    - Inventoried both harnesses' frontmatter and body-level features against the AgentSkills.io spec baseline.
    - Located the existing prior art for spec-compliance detection: the `hooks:` skip in `packages/plugin-claude/src/discover.ts`.
    - Wrote `projectbrief.md` and `activeContext.md` capturing findings, operator decisions, requirements, and acceptance criteria.
* Decisions made
    - Classified **Level 3**: spans two plugin packages plus docs, changes a classification priority order documented in `systemPatterns.md`, and requires design decisions (detection pattern set, `Skipped` vs `Approximated` taxonomy, `hooks:` disposition) that cannot be made at the keyboard.
    - Delete the `plugin-cursor` complexity gate outright rather than tightening `fileRefs` or relocating the gate behind target-awareness. Relocating would build infrastructure around a check that should return `false` unconditionally, and threading target-awareness into `discover()` would violate the `A16nPlugin` contract.
    - Add detection on the `plugin-claude` **discover** side, keyed to the AgentSkills.io spec rather than to any emit target, matching the established `hooks:` precedent.
    - Cover all non-spec Claude features (body substitutions and frontmatter keys), one warning per skill, and reconsider the `hooks:` hard-skip disposition.
* Insights
    - The issue's suggested fix direction (tighten the `fileRefs` regex) would have treated a symptom. All four gate reasons are obsolete: Claude natively supports `$ARGUMENTS`, `` !`cmd` ``, and `allowed-tools`, and `@path` is a Claude body feature that Cursor bodies do not appear to expand at all.
    - The gate was on the wrong plugin. Cursor exceeds the spec by only `paths` and `disable-model-invocation` — both already modeled in a16n's IR — while Claude is a large superset whose extensions pass through discovery silently except for `hooks:`.
    - The real degradation direction is not a plugin pair but a spec relationship: Claude-authored skills look spec-compliant while carrying non-portable runtime behavior, so any spec-only consumer of a16n's IR loses it silently.
    - Both vendors converged on a16n's existing model independently: Claude merged commands into skills (identical docs pages), and Cursor deprecated commands in favor of skills with `disable-model-invocation: true`. a16n's discover/emit asymmetry was right; only the gate was stale.
    - The chief implementation risk is self-referential: over-broad detection patterns are precisely the defect under repair, so new patterns need explicit false-positive fixtures (prose `@mentions`, `@` inside shell strings, fenced examples discussing Claude syntax).

## 2026-07-25 - PLAN - COMPLETE

* Work completed
    - Posted the spec research findings to issue #142 as [comment 5080265945](https://github.com/Texarkanine/a16n/issues/142#issuecomment-5080265945).
    - Mapped 10 affected files across `plugin-cursor`, `plugin-claude`, `cli`, and documentation, plus cross-module dependencies and boundary changes.
    - Ran two creative-phase explorations and resolved both open questions.
    - Enumerated 40+ test behaviors across three tiers (pure unit, plugin discovery, CLI integration) and wrote an 11-step ordered implementation plan.
    - Recorded challenges, mitigations, and a pre-mortem in `tasks.md`.
* Decisions made
    - **OQ1 — detection strategy:** frontmatter-gated hybrid. Shape-tightened regexes, with `$N` positional detection gated on an independent argument signal (`$ARGUMENTS` in body, or `arguments:`/`argument-hint:` in frontmatter). Rejected fence-stripping and full substitution emulation.
    - **OQ2 — `hooks:` disposition:** keep the hard `Skipped`, now justified by an explicit rule rather than inheritance. Rejected per-event triage as unsafe-by-default.
    - **OQ3 — warning axis:** non-spec (Category A) only. Spec-compliant-but-unmodeled fields are a separate defect to be filed, not absorbed.
    - Detection lives in a new pure module `packages/plugin-claude/src/spec-compliance.ts`; not extracted to `@a16njs/models` until a second consumer exists.
* Insights
    - Claude does **not** exempt fenced code blocks from substitution — its docs say substitution "runs once over the original file," and the only documented positional exemption is for `!`. So the intuitively-cautious "strip fences before scanning" approach is actually *incorrect*, producing false negatives in the higher-cost direction.
    - The false-positive cost model here is categorically different from #142. There, an over-broad match caused a hard skip and destroyed content; here it prints one advisory line. That asymmetry justifies leaning slightly permissive on ambiguous constructs while still eliminating zero-signal noise like `@reviewer`.
    - `$N` cannot be disambiguated lexically — a Claude positional and a shell positional are *identical strings*. The old gate's `\$[1-9]` is a direct ancestor of the #142 defect. Document-level context (does this skill declare arguments?) is the only available discriminator.
    - OQ2 produced a general classifier worth more than its own answer: *loss that silently removes an author-specified restriction must fail closed; loss that visibly breaks a substitution can fail open.* A lost `$ARGUMENTS` is self-evidently broken in the output; a lost `hooks:` block leaves a clean-looking skill that still claims to enforce security — the project's own `secure-operations` fixture is exactly that trap.
    - A third fidelity category surfaced that neither the issue nor the operator's framing anticipated: spec-compliant fields a16n's IR drops regardless. Being spec-compliant is necessary but not sufficient for surviving a spec-shaped IR.

## 2026-07-25 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated all 11 implementation steps against the actual source, correcting three factual errors about the codebase and one TDD ordering defect.
    - Discharged the plan's own flagged mitigation by scripting the blast-radius scan instead of grepping file-by-file: all 27 `SKILL.md` fixtures repo-wide against the Category-A trigger set, and all 12 `.cursor/commands/*.md` files against the four current gate patterns.
    - Empirically verified the post-gate-removal emit path by driving the built `plugin-claude` `emit()` with the exact ManualPrompt that `discoverCommands()` will produce.
    - Amended `tasks.md` (steps 3/4 swapped, steps 6/8/9 corrected and expanded, four test behaviors added) and surgically corrected the integration note in `creative-body-feature-detection.md`.
    - Wrote `memory-bank/active/.preflight-status`.
* Decisions made
    - **PASS WITH ADVISORY**, not FAIL: every blocking-class finding was a plan-accuracy defect fixable in place, not an approach defect. The architecture, the taxonomy, and both creative decisions survived validation unchanged.
    - Advisory Finding C left unfixed by design — the malformed emit only reachable through fixtures encoding input Cursor cannot produce. Recommended the build assert byte-identity on the `@mention` fixtures (where it guards #142) rather than on frontmatter-bearing ones, and file the passthrough with the Category-B issue in step 10.
    - Accepted one in-scope structural amendment (single exported `NON_SPEC_FEATURES` array) and deferred one out-of-scope observation (`plugin-cursor`'s regex frontmatter parser) to existing debt.
* Insights
    - The blast radius the plan treated as its largest unknown is essentially nil. No existing Claude fixture trips the new detector, and the only Cursor fixtures whose item counts move are the two the plan already named. The "new warnings are so noisy users ignore all warnings" pre-mortem risk has no purchase on the test suite.
    - The plan and a creative doc both directed the implementer to call into `discoverSkills()` in `plugin-claude` — a function that exists in `plugin-cursor` but **not** in `plugin-claude`, where the skill loop is inlined in `discover()`. Symmetric-looking plugins are not symmetric, and planning read across them by analogy.
    - "Call detection after the `hooks:` skip" was precise-sounding but wrong: three later branches also `continue` without producing an item, so a description-less skill would have collected both a `Skipped` and an `Approximated`. The correct predicate is *an item was produced*, not *a position in the function*. This is the same double-warning trap OQ2 pinned a test for, reached by a different path.
    - Cursor commands do not support frontmatter at all — so the gate's fourth pattern, `allowed-tools:`, guarded a capability Cursor never had, exactly as `fileRefs: /@\S+/` did. Two of the four gate patterns were checking for *Claude* features on the *Cursor* side. The gate was not merely stale; it was written against the wrong harness's feature set from the start.
    - Deleting a gate is never purely subtractive: it admits inputs that downstream code has never been exercised against. `discoverCommands()` stores raw bytes while `classifyRule()` strips frontmatter, and only the gate was hiding that inconsistency.

## 2026-07-25 - PREFLIGHT (REVISED) - Finding C escalated, OQ4 opened

* Work completed
    - Operator challenged the Finding C advisory ("a human can write absolutely anything in the `.cursor` directory... we control our fixtures and we control our intermediate representation"). Re-tested against unmodified `main` instead of reasoning from the fixtures.
    - Disproved the advisory's central claim: a `.cursor/commands/*.md` beginning with a `---` block is silently corrupted **today**, gate in place, zero warnings, no fixture involvement.
    - Established reachability by experiment: Claude-migrated command frontmatter, plain markdown thematic breaks, round-trip persistence, and `--delete-source` permanence (`handleDeleteSource()` deletes any source that produced a written file and is absent from `Skipped` warnings).
    - Rewrote Finding C, opened **OQ4**, and moved `.preflight-status` from `PASS WITH ADVISORY` to `HOLD` pending the operator's scope call.
* Decisions made
    - Downgrade of the preflight verdict rather than defending the original call. The completeness check cannot pass while the plan widens exposure to a live silent-corruption path it does not address.
    - Deferred the disposition itself to the operator (OQ4): mirror `classifyRule()`, mirror-and-map the command's own `description:`, or file separately. The middle option changes emit behavior beyond the task's stated surface, so it is not a call to make unilaterally.
* Insights
    - **The error was epistemic, not analytical.** Every fact in the original advisory was correct — Cursor really does not support command frontmatter, the fixtures really are unrealistic. The conclusion was still wrong, because "the format does not support X" was silently converted into "users' files do not contain X." A format's spec constrains how a tool *interprets* bytes, never which bytes are *present*. For an ingest tool, only the latter matters.
    - **Using our own fixtures as evidence about the world inverts what fixtures are for.** Fixtures are a claim about what we chose to test, so their unrealism is a coverage gap to fix, not proof that reality is tame. "No test asserts on it" was likewise treated as reassurance when it was the actual problem statement.
    - **The gate was hiding a second, unrelated bug that nobody was looking for.** Attention went to what the gate *wrongly skipped* (#142). It was also, incidentally, the only thing keeping the worst-corrupted inputs away from a broken emit path — while quietly letting a milder version of the same input through untouched.
    - **The population most exposed is the tool's own core audience.** Frontmatter in `.cursor/commands/` is the signature of half-migrated Claude config, i.e. exactly the state a16n exists to resolve. Reachability arguments that reason about "typical" users miss that a migration tool's users are self-selected for atypical, in-between config.
    - **`--delete-source` converts every silent-corruption bug into a data-loss bug.** Its safety rests entirely on `Skipped` warnings, so any defect that corrupts *without warning* is invisible to it by construction. That coupling deserves to be a stated invariant somewhere: emit paths that can silently degrade content must warn, or `--delete-source` will destroy the evidence. Filed as a step-10 deliverable.

## 2026-07-25 - PREFLIGHT - COMPLETE (PASS, OQ4 resolved)

* Work completed
    - Put OQ4 to the operator with four dispositions. All four were rejected in favour of a fifth the options had excluded by construction: **preserve the frontmatter as body content, and warn on ingest.**
    - Amended the plan accordingly — step 2 (advisory tests + `hasFrontmatterBlock()` unit cases), step 4 (gate deletion now also adds the advisory), step 9 (document it), step 10 (file the `--delete-source` invariant) — plus seven new test behaviors and a component-analysis entry for `mdc.ts`.
    - Moved `.preflight-status` to **PASS**, retaining the full verdict history rather than overwriting it.
* Decisions made
    - **OQ4: content handling is unchanged.** `discoverCommands()` keeps storing raw bytes; no `parseMdc()` on commands, no `metadata` extraction, no stripping in discover or emit. The leading `---` block in the emitted skill body is preserved user content and is the *correct* outcome.
    - New `WarningCode.Approximated` advisory in `plugin-cursor`, one per frontmatter-bearing command. `Approximated` ("translated imperfectly") fits precisely: the content survives, its apparent semantics do not.
    - Detection via exported `hasFrontmatterBlock()` in `mdc.ts`, gated on a leading `---`, a closing `---`, **and** a YAML-ish key line between, so markdown thematic breaks stay silent.
    - Byte-identity assertions now apply to every command case, reversing the recommendation Finding C originally carried.
* Insights
    - **The options I offered were all wrong in the same direction, and the direction was the tell.** Three proposed stripping the frontmatter, one proposed ignoring it; none proposed keeping it *and* saying so. Each reasoned about what the *harness* means by those bytes. The user is the one who typed them, and a conversion tool's obligation runs to the author's intent, not to any harness's parser. Options generated from a single unexamined premise all inherit it — offering four of them created an illusion of coverage.
    - **Content fidelity and semantic fidelity are separate obligations, and a16n can only ever discharge the first completely.** Bytes it cannot interpret still belong to the user. The right move for anything unrecognized is preserve-and-report, never strip-because-meaningless — a rule that generalizes well beyond commands.
    - **The defect was the silence, not the passthrough.** Three separate analyses — the original advisory, the escalation, and the proposed fixes — all mislocated it, because all three asked "is this output correct?" instead of "does the user know what we did?" The output was already correct.
    - **This lands the task on a single coherent principle it did not start with.** Both halves now do the same thing: preserve content the source harness cannot act on semantically, and report it exactly once. The Cursor advisory is keyed to what Cursor supports, the Claude one to what the spec supports. #142's gate was the inverse of that principle — it destroyed content it could not interpret and stayed quiet about the rest.

## 2026-07-25 - BUILD - COMPLETE

* Work completed
    - Executed all 11 implementation steps in order, TDD throughout: 18 cursor-side tests failing before the gate deletion, 25 detector tests failing before `spec-compliance.ts`, 2 discovery-integration tests failing before the wiring.
    - **plugin-cursor:** deleted `COMPLEX_COMMAND_PATTERNS` and `isComplexCommand()`; added exported `hasFrontmatterBlock()` to `mdc.ts` and a one-per-command `Approximated` advisory in `discoverCommands()`. Content handling untouched — still raw bytes.
    - **plugin-claude:** new pure `spec-compliance.ts` exporting `NON_SPEC_FEATURES` (15 features) and `detectNonSpecFeatures()`; `parseSkillFrontmatter()` now retains the raw key-values; advisory emitted from the skill loop only when an item was actually produced.
    - Renamed `cursor-command-complex/` → `cursor-command-runtime-features/`, added `cursor-command-mentions/` (#142 regression) and `claude-skills-nonspec/` (advisory + spec-clean + description-less).
    - Updated five docs surfaces plus the warn-and-continue section of `systemPatterns.md`, which gained both the preserve-and-report shape and the fail-closed/fail-open disposition rule.
    - Filed [#143](https://github.com/Texarkanine/a16n/issues/143) (Category B) and [#144](https://github.com/Texarkanine/a16n/issues/144) (`--delete-source` invariant).
    - Verified: 1042 tests passing across 9 packages, `pnpm build` and `pnpm typecheck` clean.
* Decisions made
    - Implemented "advise only when an item was produced" as an `items.length` watermark rather than restructuring the four `continue` branches. Behaviourally identical to the preflight correction, one line each side, and it stays correct as branches are added.
    - Kept `cursor-command-mentions/` free of frontmatter-bearing commands so its #142 assertion can be whole-fixture (`warnings` is empty), which is a stronger claim than per-path filtering. The Claude-migrated Finding C case went into the runtime-features fixture instead.
    - Derived the nine non-spec frontmatter entries of `NON_SPEC_FEATURES` from one key array via `.map()`, and made the detector's fallback predicate `feature.id in frontmatter`, so supporting a newly-discovered Claude key is a one-line edit with no detector change.
* Insights
    - **Preflight Finding A's blast-radius scan paid for itself exactly as scoped.** Not one pre-existing assertion outside the three named files needed touching, in either direction — the gate deletion added items and the advisory added warnings, and both landed entirely inside predicted territory. The pre-mortem risk "deleting the gate changes warning counts in tests that assert aggregate totals" never materialised because that question had already been answered by script rather than by grep.
    - **The `it.each` rewrite of the five gate tests revealed how little those tests were actually asserting.** Each of the five originally checked "item absent, warning mentions feature X" — five near-identical bodies encoding one behavior. Inverted, they collapse into one parameterised case plus a single "no `Skipped` warnings at all" assertion, and the byte-identity helper does the load-bearing work. The old shape's verbosity was proportional to the gate's arbitrariness, not to the behavior's complexity.
    - **The detector's honest test is the negative table, not the positive one.** The positive cases were mechanical; every genuine design question (`$1` gating, `@` shape, `KEY=!`cmd``, `foo@bar.com`) lives in the false-positive block, which passed *before* implementation because an empty detector trivially satisfies "detects nothing." That inversion is worth naming: for detection work, a green negative suite means nothing until the positive suite is also green, and TDD's usual "watch it fail first" signal is only available on half the specification.
    - **`NON_SPEC_FEATURES` earned its keep during the build, not later.** Writing the unit test against feature *ids* rather than message substrings meant the "every exported feature has a positive case" test caught the ordering contract for free, and the multi-feature ordering assertion became a statement about the array rather than a hand-maintained expected string.

## 2026-07-25 - QA - COMPLETE (PASS)

* Work completed
    - Re-ran the full pipeline at QA time rather than trusting the build phase's report: 1042 tests across 9 packages green, `pnpm build` and `pnpm typecheck` clean. Independently confirmed the build's claim that `pnpm lint` is vacuous — Turbo reports zero tasks.
    - Reviewed both halves of the implementation against the plan on all seven QA axes, reading the detector, both discover paths, `hasFrontmatterBlock()`, every new and repurposed fixture, and all five docs surfaces.
    - Scripted the orphan scan (deleted gate identifiers, "complex command" prose, debug artifacts) across the whole repo in one pass instead of grepping file-by-file.
    - Applied one fix, re-ran the affected package suite and then the full suite.
    - Wrote `memory-bank/active/.qa-validation-status` and recorded findings in `tasks.md`.
* Decisions made
    - **PASS.** The one defect found was trivially fixable without touching design intent; the two remaining observations are a scope call and a pre-existing inaccuracy, neither of which blocks.
    - Narrowed the positional-argument pattern from `/\$[0-9]/` to `/\$[1-9]/`. Fixed rather than reported because it is a one-character correctness fix with no design content — `$0` is not a Claude positional, the feature's own label says `$1`, and the gate this replaced already used `[1-9]`.
    - Left `named-arguments` alone despite it being the module's weakest line-per-value. Removing a feature the operator explicitly scoped in ("everything non-spec") is a scope decision, and QA's line is that anything requiring a choice between approaches routes out rather than gets fixed in place.
    - Left the ragged markdown table alignment in `understanding-conversions/index.md` alone: it renders identically, the file already mixes both styles, and there is no formatter in the repo to be consistent *with*. Cosmetic churn is not a QA finding.
* Insights
    - **The detector's remaining weak spot is the same one the build phase named, one level down.** `$1` gating was correctly identified as the hard case and given real thought, but the pattern that survived was `[0-9]` — so the careful part (deciding *when* to look for positionals) was right while the mechanical part (deciding *what* a positional looks like) silently regressed against the code being deleted. Attention concentrated where the design difficulty was, and the trivial half went unexamined precisely because it was trivial.
    - **`named-arguments` is what a completeness mandate costs.** "Cover everything non-spec" is a good instruction that here bought ~15 lines of three-shape YAML parsing whose only effect is adding a word to a warning that was already firing for a different reason. Nothing is wrong with it; it is simply the shape that exhaustive-coverage requirements take when one member of the set is structurally dependent on another. Worth noticing at planning time, when the set is being enumerated, rather than at QA.
    - **Deriving the README from `NON_SPEC_FEATURES` made the documentation check mechanical.** Verifying docs completeness usually means reading prose and judging; here it was counting 9 and 6 against an array. The single-source-of-truth amendment was justified in the plan as anti-drift insurance for future edits, but it paid off immediately, at review time, in a way nobody predicted.
    - **The gitignored `.generated/` docs are a standing trap for exactly this check.** An orphan scan turns up stale "Complex Commands" rows under `packages/docs/static/`, which look like missed documentation until you check that they are untracked build output. Any future task that greps docs for stale claims will hit the same false alarm.

## 2026-07-25 - QA (cont.) - `named-arguments` trimmed on operator principle

* Work completed
    - Proved the redundancy empirically instead of resting on a read-through: drove the built detector across every `arguments:` YAML shape (list of objects, list of strings, mapping), plus `argument-hint:`-only and bare-body controls. `named-arguments` fired in exactly the cases where `arguments:` also fired, and never alone.
    - Removed the feature, `declaredArgumentNames()`, its `POSITIVE_CASES` entry, and the `plugin-claude/README.md` table cell. Suite 1042 → 1041, the delta being precisely the deleted case; `pnpm build` and `pnpm typecheck` clean.
    - Added the governing principle to the warn-and-continue section of `systemPatterns.md`.
    - Ran the same probe against `positional-arguments` and surfaced it as an operator question rather than trimming by analogy.
* Decisions made
    - **Operator principle: "Our job is not to lint people's files. Our job is to faithfully convert them and be honest about WHEN we cannot."** A warning names what will not survive; it does not enumerate every construct that depends on it. A detector that can only fire alongside another detector reports the same loss twice and does not earn its place.
    - Trim rather than upgrade-to-real-names (`$pr` instead of the `$name` metavariable). The upgrade would have fixed the actionability complaint but is addition rather than deletion, would have made labels dynamic and broken the static `NON_SPEC_FEATURES` array the coverage test and README derive from, and would still not let the feature fire independently.
    - **Did not** trim `positional-arguments` by analogy. It shares the structural dependency but not the redundancy: gated by `$ARGUMENTS` it duplicates, gated by `argument-hint:`/`arguments:` it carries the only signal that the body will render `$1` literally.
* Insights
    - **The operator's framing beat my own argument for the same conclusion.** I justified the trim on the label not being greppable — true but incidental. The real reason is jurisdictional: cataloguing which constructs in a user's body depend on a dropped feature is linting their file, which is not this tool's job. Same action, but the principle generalizes to every future detector while "the label is a metavariable" generalizes to nothing.
    - **A completeness mandate and a "report the loss" mandate produce different feature sets, and the difference is invisible while enumerating.** "Cover everything non-spec" reads as a list of Claude features; "report what will not survive" reads as a list of *losses*. `$name` is a feature but not a distinct loss. That divergence only becomes legible once you ask which detectors can fire independently — a question worth asking at planning time, when the set is being written down.
    - **Proving redundancy beats arguing it.** The claim "X never fires without Y" is a property, and a six-line probe against the built module settles it across YAML shapes I would not have thought to reason through by hand. It also caught that `positional-arguments` has the same property, which I had not suspected from reading — and which turns out to have a materially different answer.
    - **Structural similarity is not equivalence, and the analogy trap here is the same one preflight fell into with `discoverSkills()`.** Two detectors sharing "cannot fire alone" invites one verdict for both. But `named-arguments`' companion is the declaration machinery itself, while `positional-arguments`' companion may be a mere display hint. Reading across by shape would have deleted a real signal. *(Operator subsequently overruled this and cut both — see below. The distinction was real; it just was not decisive.)*

## 2026-07-25 - QA (cont.) - `positional-arguments` cut, fire-alone rule made self-enforcing

* Work completed
    - Explained "fires alone" with diagrams after the term proved opaque, then took the decision: cut `positional-arguments`, its gate, and the now-unused `declaresArguments`.
    - Removed two `$N gating` tests and one negative test that had become tautological once the gate was gone (it named a guard that no longer existed, which is worse than no test). Updated the multi-feature ordering assertion.
    - **Tightened the per-feature positive assertion from `toContain(label)` to `toEqual([label])`**, converting the fire-alone rule from convention into a CI failure for any future detector that cannot warn independently.
    - Updated the module header (explaining why `$1`/`$name` are absent despite being real Claude features), two `plugin-claude/README.md` paragraphs, and the docs-site feature list.
    - `NON_SPEC_FEATURES` 15 → 13; suite 1042 → 1038; `pnpm build` and `pnpm typecheck` clean.
* Decisions made
    - **Operator rule: detectors that cannot fire alone get cut. Keep only the top-level detectors needed so that a warning IS emitted when something that should warn happens.** This is the operational form of the earlier principle, and it decided the case against my recommendation.
    - I had argued to narrow the gate instead — keep `positional-arguments` only on its `argument-hint:`-gated path, where the companion is a display hint that understates body breakage. Overruled, and correctly: the narrowed version would have been a detector whose firing condition encoded "am I redundant right now," which is a worse thing to maintain than either keeping or cutting.
* Insights
    - **"Fires alone" was jargon I invented and then reasoned in for three turns without checking it had landed.** The operator understood it, then stopped understanding it — which is the more informative failure, because it means the term was doing work its definition could not support. Two small diagrams and six lines of real detector output fixed in one turn what more prose would not have. Coining a compact term for a subtle property is useful; assuming it transfers is not.
    - **My "half lint, half honest signal" analysis was correct and still lost, because a rule that is 90% right and uniform beats one that is 100% right and conditional.** The exception I defended was real: `argument-hint:` alone genuinely understates a body containing `$1`. But encoding it meant a detector gated on its own redundancy — unexplainable to the next reader, and a standing invitation to re-litigate. Precision that costs uniformity is usually a bad trade in a rule meant to be applied by someone else later.
    - **The best artifact of this exchange is the one-word test change.** `toContain` → `toEqual` costs nothing, needed no new test, and makes the principle impossible to violate silently. Both trims came from noticing a property by hand that the existing test was one assertion-strength away from having caught automatically — the coverage test already iterated every feature; it just was not asking enough of each one.
    - **Deleting a guard silently converts its tests into tautologies that read like coverage.** "Should not report `$1` when the skill declares no arguments" still passed after the gate was gone, but it now asserted nothing and implied gating logic that had been removed. A green test that describes machinery you deleted is worse than no test, because it misleads the next reader about what the module does.

## 2026-07-25 - REFLECT - COMPLETE

* Work completed
    - Reviewed the full lifecycle — brief, plan, both creative docs, preflight (all three verdicts), build, and both QA rounds — and wrote `memory-bank/active/reflection/reflection-issue-142-spec-compliance-gates.md`.
    - Discharged the pre-mortem's one remaining open risk by experiment. `pnpm test` returned FULL TURBO (17/17 cached) — precisely the "caching masks stale test results" scenario the pre-mortem warned about. Re-ran with `--force`: 17/17 tasks executed, **1038 tests**, zero failures, matching QA's figure exactly.
    - Audited requirements and acceptance criteria against what actually shipped, rather than against the phase reports.
    - Reconciled the three persistent memory-bank files; none required changes.
* Decisions made
    - **Recorded requirement 2 as deliberately unmet rather than as satisfied.** The shipped detector omits `$1` and `$name`, which are genuine non-spec Claude features, on the operator's fire-alone rule. Logging this as "all requirements met" would have buried a real and intentional scope narrowing.
    - **Recorded AC6 as vacuous in its fourth term.** `pnpm lint` executes zero tasks, so the criterion verifies three things while appearing to verify four.
    - **Did not reconcile `techContext.md`'s `pnpm lint` claim**, despite having just confirmed it false. It is pre-existing rather than invalidated by this task, and the fix is a decision rather than a correction — deleting the mention is correct only if the repo should have no lint task, and conceals a real gap if it should. Routed to the operator instead of resolved unilaterally.
    - Left `systemPatterns.md` untouched: the preserve-and-report shape, the fire-alone rule, and the fail-closed/fail-open disposition rule all landed in-commit during build and QA, and the Claude classification order is unchanged by OQ2's design.
* Insights
    - **The creative phase's selection was overturned while its eliminations held, and the distinction is the lesson.** Cutting `$1`/`$name` deleted the gating machinery that was the *sole* difference between Option C and Option A, so the shipped detector is Option A. But the doc's rejection of fence-stripping — on correctness grounds, because Claude substitutes inside fences — remains a genuine save that would otherwise have been implemented as "the careful choice." Elimination reasoning generalized; selection reasoning did not, because the phase optimized *how* to detect `$N` and never asked *whether* to.
    - **Ten forecasts, zero hits, and both real surprises unforecast.** Five Challenges and a five-item Pre-Mortem predicted essentially nothing that happened, while preflight Finding C and the fire-alone redundancy — the two events that reshaped the task — appeared in no forecast. The pre-mortem's actual value was indirect: it prompted the blast-radius scan that made one of its own risks impossible.
    - **Late reversals are not uniformly expensive; the phase they land in decides.** OQ4 arrived at preflight and *increased* the task's coherence, landing it on a single principle (preserve content the harness cannot act on, report it once) that it did not start with. The fire-alone reversal arrived at QA and invalidated a creative decision plus a built sub-system. Same kind of event, opposite cost, and the difference is simply build.
    - **The one question that would have prevented the expensive chain is cheap and askable at plan time: "can each member of this set fire alone?"** "Cover every X" and "report every loss" look like the same instruction while you are writing the list and produce different sets. Now enforced in CI by one assertion (`toEqual([label])`) rather than left to judgment.
    - **Preflight's detection and its judgment came apart.** It found Finding C — a live silent-corruption defect on `main`, unrelated to the task premise — and then dismissed it on reasoning that used a16n's own fixtures as evidence about what users can write. Only the operator's challenge recovered it. The mechanical half of the phase (read the real code) was reliable; the evaluative half was not.
    - **A consolidation justified as future insurance paid three times at review time.** The single `NON_SPEC_FEATURES` array was accepted at preflight as anti-drift protection for future edits; it instead paid at build (ordering contract for free), at QA (docs verification became counting, not judging), and at QA again (it was the hook that made the fire-alone rule enforceable in one word). None was the predicted benefit.
