---
task_id: issue-142-spec-compliance-gates
complexity_level: 3
date: 2026-07-25
status: completed
---

# TASK ARCHIVE: Realign conversion gates with the AgentSkills.io spec

## SUMMARY

Deleted `plugin-cursor`'s obsolete four-pattern command-complexity gate ([issue #142](https://github.com/Texarkanine/a16n/issues/142)) and added AgentSkills.io spec-compliance detection to `plugin-claude` skill discovery, plus an unplanned third deliverable — a Cursor ingest advisory for command frontmatter passthrough. The premise inverted under research: a16n had gated the nearly-spec-compliant harness (Cursor) and left the genuine superset (Claude) almost entirely ungated. Both halves landed on one coherent principle: **preserve content the source harness cannot act on semantically, and report it exactly once.**

Final verification (cache-disabled): **1038 tests** green across 9 packages; `pnpm build` and `pnpm typecheck` clean. Seven of eight requirements delivered as written; requirement 2 deliberately narrowed at QA on operator principle. PR [#145](https://github.com/Texarkanine/a16n/pull/145). Follow-ups filed: [#143](https://github.com/Texarkanine/a16n/issues/143) (Category B IR drop), [#144](https://github.com/Texarkanine/a16n/issues/144) (`--delete-source` / `Skipped` coupling).

## REQUIREMENTS

**User story.** As a developer converting agent customizations with `a16n`, conversion gates should reflect what the AgentSkills.io spec and each harness actually support today, so valid Cursor commands are not silently dropped and Claude-specific skill features are not silently degraded without warning.

**Functional**

1. Remove the obsolete complexity gate from `plugin-cursor` command discovery (`COMPLEX_COMMAND_PATTERNS` / `isComplexCommand()`); discover all `.cursor/commands/**/*.md` as ManualPrompts.
2. Add AgentSkills.io spec-compliance detection to `plugin-claude` covering **all** non-spec Claude features (body substitutions and frontmatter keys). *Deliberately narrowed at QA — see Outcome below.*
3. Report detection as **one warning per skill**, worded against the AgentSkills.io spec (never a destination harness).
4. Use `Approximated` when content survives but runtime behavior is lost; reserve `Skipped` for genuinely unrepresentable items.
5. Re-evaluate whether `hooks:` should remain a hard `Skipped`, and implement the outcome.
6. Add #142 regression fixtures (`@reviewer` / `@coderabbitai` false-positive class).
7. Update affected documentation (plugin READMEs, docs site, `systemPatterns.md`).
8. Post the spec research findings as a comment on issue #142.

**Constraints**

- Detection must not recreate the #142 false-positive class.
- TDD throughout.
- Preserve intentional discover/emit asymmetry for Cursor commands.
- No target-awareness in `discover()`.
- Warning wording references the AgentSkills.io spec only.

**Outcome vs requirements**

- Requirements 1, 3–8: delivered as written.
- Requirement 2: **deliberately not met as written.** Shipped detector covers 13 features and excludes `$1` positionals and `$name` named arguments (genuine non-spec Claude features) under the operator's fire-alone rule. Documented in the module header so the omission is not "fixed" later.
- Added beyond plan: Cursor frontmatter advisory (OQ4); second follow-up issue (#144); fifth docs surface (`packages/docs/docs/plugin-claude/index.md`).

## IMPLEMENTATION

### Architectural framing

The interop contract is **the AgentSkills.io spec**, not a target harness. a16n's IR is spec-shaped, so any source-harness extension is a portability hazard at ingest regardless of destination. Prior art: `plugin-claude`'s `hooks:` skip ("Hooks are not supported by AgentSkills.io").

**Fidelity taxonomy used throughout**

| Category | Spec? | Modeled by IR? | Survives conversion? | In scope |
|---|---|---|---|---|
| A | No | No | No — silently lost | **Yes** — this task |
| B | Yes | No | No — silently lost | No — filed as #143 |
| C | No | Yes | Yes | No — nothing lost |
| D | Yes | Yes | Yes | No — nothing lost |

**Disposition rule (OQ2, reused for every Category-A feature)**

> Loss that silently removes an author-specified restriction → fail closed (`Skipped`).
> Loss that visibly breaks a substitution → fail open (`Approximated`).

`hooks:` is the sole fail-closed case. Everything else in Category A is fail-open.

**Preserve-and-report shape (both halves)**

Content the source harness cannot act on semantically is preserved verbatim and reported once — never stripped, never silent. Cursor advisory keyed to what Cursor supports; Claude advisory keyed to what the spec supports. #142's gate was the inverse of that principle.

### plugin-cursor — gate removal + frontmatter advisory

**Deleted:** `COMPLEX_COMMAND_PATTERNS` and `isComplexCommand()` from `packages/plugin-cursor/src/discover.ts`. Every `.cursor/commands/**/*.md` becomes a ManualPrompt with no skip warnings.

**Added:** exported `hasFrontmatterBlock(content)` in `packages/plugin-cursor/src/mdc.ts` — true when (1) first non-empty line is `---`, (2) some later line is `---`, (3) at least one line between matches `/^[A-Za-z_][\w-]*\s*:/`. In `discoverCommands()`, still store **raw content unchanged**, and push one `WarningCode.Approximated` per frontmatter-bearing command (Cursor commands do not support frontmatter; the block is preserved as body content).

**Key decision (OQ4):** the passthrough was never corruption — preserving the bytes is correct because the user wrote them. The defect was the silence. No `parseMdc()` on commands, no stripping, no `metadata` extraction. Byte-identity is the correct assertion.

### plugin-claude — spec-compliance detection

**New module:** `packages/plugin-claude/src/spec-compliance.ts`

- Exports `NON_SPEC_FEATURES` (single source of truth — 13 entries: 9 frontmatter keys + 4 body substitutions) and pure `detectNonSpecFeatures(frontmatter, body): string[]`.
- Frontmatter keys detected by membership; body patterns shape-tightened (`$ARGUMENTS`, `` !`cmd` ``, `${CLAUDE_*}`, `@path` with extension/relative-path shape).
- `$1` / `$name` deliberately absent (fire-alone rule); explained in module doc comment.
- `hooks` deliberately absent (handled by hard skip before advisory).

**Wiring:** `parseSkillFrontmatter()` retains raw keys. Advisory emitted from the skill loop in `discover()` **only when an item was actually produced** (watermark on `items.length` — not "after the hooks skip", which would double-warn description-less / invalid skills).

### Creative decisions (inlined)

#### OQ1 — Body-level detection strategy (`creative-body-feature-detection.md`)

**Problem:** produce Category-A feature labels for a Claude `SKILL.md` (frontmatter + body). Frontmatter keys are unambiguous (`gray-matter` membership). Body substitutions are ambiguous.

**Cost-model insight:** false positive here is one advisory line (`Approximated`), not a hard skip — opposite of #142. Lean slightly permissive on ambiguous constructs; still eliminate zero-signal noise like `@reviewer`.

**Second finding:** Claude does **not** exempt fenced code blocks from substitution. Fence-stripping before scanning is semantically wrong (false negatives in the higher-cost direction).

**Options:** A raw regex · B fence-stripping · C frontmatter-gated hybrid · D full substitution emulation.

**Selected at creative time:** Option C — shape-tightened regexes plus frontmatter gates for `$N` / `$name` (shell positionals are lexically identical to Claude positionals).

**What actually shipped:** Option A. QA cut `$1` and `$name` under the fire-alone rule, deleting the gating machinery that was C's only distinction from A. Frontmatter handling that remains is plain key membership (which the creative doc itself called "unambiguous — no design decision"). **Eliminations held:** B rejected on correctness; D rejected as YAGNI.

#### OQ2 — `hooks:` disposition (`creative-hooks-disposition.md`)

**Options:** A keep hard skip · B uniform `Approximated` · C per-event triage · D configurable flag.

**Selected:** Option A — keep hard `Skipped`. A lost `$ARGUMENTS` is visible in the body; a lost `hooks:` block leaves a clean skill that still claims to enforce security. Restriction-removing invisible loss must fail closed.

**Held completely:** zero churn to existing hooks tests/docs. Generalized rule recorded in `systemPatterns.md` and above the skip in code. `disallowed-tools` considered (also removes a restriction) but kept on `Approximated` — single-turn, no code execution, cannot remove `EndConversation`.

### Key files

| Path | Change |
|---|---|
| `packages/plugin-cursor/src/discover.ts` | Gate deleted; frontmatter advisory added |
| `packages/plugin-cursor/src/mdc.ts` | `hasFrontmatterBlock()` exported |
| `packages/plugin-claude/src/spec-compliance.ts` | **New** — detector + `NON_SPEC_FEATURES` |
| `packages/plugin-claude/src/discover.ts` | Retain raw keys; wire advisory; disposition-rule comment |
| `packages/plugin-cursor/test/discover-commands.test.ts` | Inverted skip suite; #142 + OQ4 cases |
| `packages/plugin-cursor/test/mdc.test.ts` | `hasFrontmatterBlock` unit + characterization |
| `packages/plugin-claude/test/spec-compliance.test.ts` | **New** — pure detector table |
| `packages/plugin-claude/test/discover-spec-compliance.test.ts` | **New** — discovery integration |
| `packages/cli/test/integration/integration-commands.test.ts` | Inverted complex-command skip test |
| Fixtures | `cursor-command-complex` → `cursor-command-runtime-features`; added `cursor-command-mentions/`, `claude-skills-nonspec/` |
| Docs | plugin READMEs; `docs/plugin-cursor`, `docs/plugin-claude`, `docs/understanding-conversions`; `systemPatterns.md` |

**Commits (implementation halves):**

- `ce21f318` — `fix(plugin-cursor): discover all commands, warn on frontmatter passthrough`
- `5b46f4ab` — `feat(plugin-claude): warn when a skill uses non-spec features`

### Build deviations from plan

- Claude-migrated command fixture placed in `cursor-command-runtime-features/` so `cursor-command-mentions/` stays a pure zero-warning #142 regression at whole-fixture granularity.
- Extra docs file: `packages/docs/docs/plugin-claude/index.md`.
- Two issues filed (#143 + #144), not one.

### PR #145 review (post-reflect)

CodeRabbit review 4780506510: five findings — three fixed, one deferred, one dismissed.

- **Dismissed** `hasFrontmatterBlock` "all inner lines must be keys" patch after probe over 11 inputs: proposed fix fails its own motivating case and breaks four real frontmatter shapes (lists, nested maps, block scalars, comments). Current wrong on 1/11; proposed wrong on 5/11. Over-reporting is the correct direction (spurious advisory vs restored silence).
- **Fixed:** characterization + multi-line-value tests; stale arithmetic in `tasks.md` (9+4=13); "seven of eight" phrasing; `pnpm lint` no-op claim at AC6 / step 11 / `techContext.md`.
- **Declined** retroactive rewrites of brief requirement 2 and plan steps — historical intent stays; archive-feeding facts get corrected.

## TESTING

**TDD held throughout.** 18 cursor-side tests failing before gate deletion; 25 detector tests before `spec-compliance.ts`; 2 discovery-integration tests before wiring.

**Behaviors covered (condensed)**

- Cursor: all four former gate patterns discover with zero skip warnings; #142 prose/`@coderabbitai` regressions; byte-identical content; frontmatter advisory (one `Approximated`, content preserved); thematic-break negatives for `hasFrontmatterBlock`; mixed fixture count 1→2.
- Claude pure detector: spec-clean → `[]`; each of 13 features fires alone (`toEqual([label])`); false positives rejected (`@reviewer`, `foo@bar.com`, `` KEY=!`cmd` ``, etc.); Category C / `hooks` not reported; multi-feature ordering stable.
- Claude discovery: non-spec skill → one `Approximated`; clean → silence; hooks → one `Skipped` zero `Approximated`; description-less + non-spec → one `Skipped` zero `Approximated`.
- CLI: cursor→claude runtime-feature command converts; frontmatter-bearing command preserves block end-to-end with advisory.

**Preflight status (inlined)**

```
PASS

Task: issue-142-spec-compliance-gates
Level: 3
Date: 2026-07-25 (revised twice)

TDD plan encoding: PASS
Convention compliance: PASS
Dependency impact: PASS (blast radius fully enumerated)
Conflict detection: PASS
Completeness: PASS (docs scope widened; OQ4 resolved)

History of this verdict:
  1. PASS WITH ADVISORY - Finding C judged non-blocking (malformed emit
     looked reachable only via unrealistic fixtures).
  2. HOLD - operator challenged. Experiment against unmodified main:
     any .cursor/commands/*.md beginning with --- is silently affected
     today, gate in place, zero warnings.
  3. PASS - OQ4: preserving the block is CORRECT; defect was the silence.
     Fix is Approximated ingest advisory, not a parser change.
```

**Blast-radius scan (preflight Finding A):** all 27 `SKILL.md` fixtures vs Category-A triggers — only two match, both `hooks:` and skipped before detection. Of 12 `.cursor/commands/*.md`, exactly 6 were gate-skipped, all in the two dirs the plan already named. Zero churn to pre-existing assertions outside the three named files — prediction held exactly at build.

**QA validation status (inlined)**

```
PASS

Mechanical verification (re-run at QA, not trusted from build):
  pnpm build     PASS
  pnpm typecheck PASS
  pnpm test      PASS - initially 1042, then 1038 after trims
  pnpm lint      vacuous - zero tasks

Fixes during QA:
  1. /\$[0-9]/ → /\$[1-9]/ ($0 is not a Claude positional)
  2. Cut named-arguments ($name) — never fires alone
  3. Cut positional-arguments ($1) — never fires alone
  4. toContain(label) → toEqual([label]) — fire-alone rule in CI

Net: NON_SPEC_FEATURES 15 → 13; suite 1042 → 1038;
warning COUNTS unchanged on every possible input.
```

**Reflect verification:** `pnpm test` returned FULL TURBO (17/17 cached) — exactly the pre-mortem "caching masks stale results" scenario. Forced `--force`: 17/17 executed, **1038 tests**, zero failures — matches QA.

## LESSONS LEARNED

### Technical

- **A detector that cannot fire without another detector is not a distinct signal — cut it.** Enforced in CI by `toEqual([label])` on the per-feature coverage test. Enumeration question is not "is this a real feature?" but "can this be the *only* thing I have to say?"
- **Deleting a guard silently converts its tests into tautologies that read like coverage.** Green tests describing deleted machinery mislead worse than no test. Audit negatives when removing a gate.
- **Content fidelity and semantic fidelity are separate obligations.** A conversion tool can only fully discharge the first. Unrecognized bytes still belong to the author — preserve-and-report, never strip-because-meaningless, never silent passthrough.
- **`--delete-source` converts every silent-degradation bug into a data-loss bug** because its safety rests entirely on `Skipped` warnings (#144).
- **Gitignored `.generated/` docs under `packages/docs/static/` are a standing false alarm** for orphan / stale-claim scans.
- **`pnpm lint` is a no-op in this repo** — any checklist naming it overstates coverage. Corrected in `techContext.md`; whether the repo should gain a real lint task remains open.
- **Attention concentrates where design difficulty is; the mechanical half goes unexamined because it is mechanical.** `$N` gating was carefully designed; the pattern shipped as `/\$[0-9]/` and silently regressed against the deleted gate's `[1-9]`.

### Process

- **Ask of every enumerated set member: "can this fire alone?" — at enumeration time.** Would have prevented a creative decision, a build sub-system, and three QA turns.
- **"Cover every X" and "report every loss" look identical while writing the list and produce different sets.** Restate feature-coverage requirements as loss-coverage before enumerating.
- **Options from a single unexamined premise all inherit it; offering four manufactures an illusion of coverage.** All four OQ4 options assumed frontmatter was a problem to remove; the correct answer (keep it and say so) was excluded by construction.
- **A format's spec constrains interpretation of bytes, never which bytes are present.** Finding C's error was epistemic: "the format does not support X" was silently converted into "users' files do not contain X."
- **Using your own fixtures as evidence about the world inverts what fixtures are for.** Their unrealism is a coverage gap, not proof that reality is tame.
- **A migration tool's users are self-selected for atypical config.** Half-migrated state is exactly the condition a16n exists to resolve — the weirdest inputs are the most likely.
- **A rule that is 90% right and uniform beats one that is 100% right and conditional.** The `argument-hint:`-gated exception was real but would have encoded "am I redundant right now" as a firing condition.
- **Prefer a scripted probe against the built artifact over reasoning about the source.** Four times: blast-radius scan, `main` experiment for Finding C, fire-alone probe across YAML shapes, forced uncached test run — each minutes of work, each overturned or hardened a reading-based conclusion.
- **Late reversals are not uniformly expensive; the phase decides.** OQ4 at preflight *increased* coherence. Fire-alone at QA invalidated built work. Same kind of event, opposite cost.
- **Preflight's detection and judgment came apart.** It found Finding C and then dismissed it; only the operator's challenge recovered it. Mechanical half reliable; evaluative half not.
- **Analogy trap fired twice:** inventing `discoverSkills()` in `plugin-claude` by reading across from `plugin-cursor`; nearly trimming `positional-arguments` by analogy with `named-arguments`.
- **A consolidation justified as future insurance paid three times immediately:** `NON_SPEC_FEATURES` gave free ordering contract at build, mechanical docs verification at QA, and the hook for the one-word fire-alone CI rule.
- **Forecasting record was poor in a specific way.** Ten Challenges/Pre-Mortem predictions essentially none materialized; both events that reshaped the task were unforecast. Pre-mortem's value was indirect (prompted the blast-radius scan).
- **`memory-bank/active` documents feed the archive — wrong facts must be fixed; wrong-in-hindsight intent must not.** Discriminator from PR review that settled which record edits were legitimate.
- **A reviewer can be right about the symptom and wrong about the cure** — only running the cure tells you which (`hasFrontmatterBlock` patch).

## PROCESS IMPROVEMENTS

- When a requirement is phrased as feature coverage, restate it as loss coverage and ask "can each member fire alone?" before creative/build invest in the hard members.
- When every offered option shares a direction, examine the shared premise — not the options.
- Prefer scripted blast-radius / property probes at preflight over "grep the three files we already know."
- Do not use fixture artificiality as evidence about user input reachability for ingest tools.
- When removing gates or detectors, audit their negative tests for tautologies in the same change.
- Treat `Approximated` as potentially delete-blocking for `--delete-source` (or document the invariant) — tracked as #144.
- Do not name vacuous commands (`pnpm lint`) in acceptance criteria or "full validation" lists.

## TECHNICAL IMPROVEMENTS

- [#143](https://github.com/Texarkanine/a16n/issues/143) — Category B: spec-compliant fields (`allowed-tools`, `license`, `compatibility`) that a16n's IR silently drops.
- [#144](https://github.com/Texarkanine/a16n/issues/144) — `--delete-source` safety rests entirely on `Skipped`; silent degradation becomes data loss.
- `plugin-cursor`'s hand-rolled `parseSkillFrontmatter()` only recognizes three keys — blocker if detection ever needs to be symmetric (already noted in `techContext.md`).
- Whether the repo should gain a real `pnpm lint` task remains open and unfiled.
- Optional: extract `detectNonSpecFeatures` to `@a16njs/models` if a second consumer appears (YAGNI for now).

## NEXT STEPS

- Merge [PR #145](https://github.com/Texarkanine/a16n/pull/145) when ready.
- Triage [#143](https://github.com/Texarkanine/a16n/issues/143) and [#144](https://github.com/Texarkanine/a16n/issues/144) as separate work.
- Close [#142](https://github.com/Texarkanine/a16n/issues/142) on merge (research comment already posted: [5080265945](https://github.com/Texarkanine/a16n/issues/142#issuecomment-5080265945)).
