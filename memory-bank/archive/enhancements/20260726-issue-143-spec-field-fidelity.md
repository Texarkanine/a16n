---
task_id: issue-143-spec-field-fidelity
complexity_level: 3
date: 2026-07-26
status: completed
---

# TASK ARCHIVE: Model current AgentSkills.io spec fields in the skill IR

## SUMMARY

a16n's skill IR modelled only `name` and `description` from the AgentSkills.io frontmatter spec. Four other spec fields — `license`, `compatibility`, `metadata`, and `allowed-tools` — were parsed by nobody, carried by nothing, and dropped on every conversion without a warning. The worst case was `allowed-tools`: converting a Claude skill declaring `allowed-tools: Bash(rm:*)` to Cursor produced an artifact that was *more permissive than the author wrote*, silently.

This task extended the IR with a shared `AgentSkillSpecFields` interface carried by `SimpleAgentSkill`, `AgentSkillIO`, **and** `ManualPrompt`; taught both source plugins to discover the fields and all emit surfaces to write them; encoded a behavior-keyed warning disposition in one module; and bumped the on-disk IR version to `v1beta3` so the fields round-trip through `.a16n/**`. Losing `allowed-tools` to Cursor now writes the bytes *and* raises a `Skipped` warning, which engages the `--delete-source` guard so the authored original survives.

This is Category B of the conversion-fidelity taxonomy established in [#142](https://github.com/Texarkanine/a16n/issues/142), tracked as [#143](https://github.com/Texarkanine/a16n/issues/143). Two adjacent gaps were deliberately scoped out and filed: [#147](https://github.com/Texarkanine/a16n/issues/147) (`ManualPrompt` discards the authored `description`) and [#148](https://github.com/Texarkanine/a16n/issues/148) (Cursor's `paths:` on skills is unmodelled).

## REQUIREMENTS

From the project brief, targeting the user story: *as a developer converting agent skills with `a16n`, I want spec-compliant `SKILL.md` frontmatter to survive conversion, so that a converted skill still carries the license, environment requirements, and tool restrictions its author specified.*

1. Extend the IR (`SimpleAgentSkill`, `AgentSkillIO` in `@a16njs/models`) to model the spec's currently-unmodelled optional frontmatter fields.
2. Resolve the `metadata` name collision — the spec's `metadata` (persisted, author-authored) and the IR's existing `metadata` (transient, never serialized) are opposite contracts and cannot share a field.
3. Discover the new fields in every source plugin whose format carries them.
4. Emit the new fields in every target plugin whose format can express them.
5. Where a target cannot express a field, warn rather than drop silently — restriction-removing loss fails closed (`Skipped`), visible/benign loss fails open (`Approximated`).
6. Round-trip the new fields through the `a16n` IR serialization format (`plugin-a16n`).
7. Update affected documentation (plugin READMEs, docs site, `systemPatterns.md` where invalidated).

**Constraints:** TDD throughout; laziest solution that works (add fields, not a field framework); no target-awareness in `discover()`; discover-side warning wording names the spec, not a harness; do not recreate the #142 false-positive class; treat `allowed-tools` *loss* as significant even though its *support* is experimental; do not break the transient-`metadata` contract plugins rely on.

**Acceptance criteria:** the issue's reproduction (`license: MIT` + `allowed-tools: Bash(rm:*)`, claude→cursor) preserves both fields or warns — never a silent drop; losing `allowed-tools` never passes silently; full suite green with cache disabled; every new field covered by discover, emit, and round-trip tests; memory bank reconciled with any architectural fact this work invalidated.

All seven requirements shipped. Requirement mapping: R1→step 1, R2→step 1, R3→steps 4/6, R4→steps 5/8, R5→steps 7/8, R6→steps 2/9, R7→step 12.

## IMPLEMENTATION

### The field support matrix

Every emit decision in this task is a lookup against this table. Sources: [AgentSkills.io spec](https://agentskills.io/specification.md) and [Cursor skills reference](https://cursor.com/docs/skills.md), both fetched fresh on 2026-07-25.

| Field | In spec | Claude `SKILL.md` | Cursor `SKILL.md` (official schema) | Has runtime behavior? |
|---|---|---|---|---|
| `name` | Yes (req) | Yes | Yes | Yes — identity/invocation |
| `description` | Yes (req) | Yes | Yes | Yes — activation matching |
| `license` | Yes | Yes | Not documented | No — provenance only |
| `compatibility` | Yes | Yes | Not documented | No — documentation only |
| `metadata` | Yes | Yes | **Yes** | No — arbitrary client data |
| `allowed-tools` | Yes (experimental) | Yes — enforced | Not documented | **Yes — restricts tools** |
| `paths` | No | No | Yes | Yes — scoping (Category A; out of scope, filed as #148) |
| `disable-model-invocation` | No | Yes | Yes | Yes — already modelled |

`allowed-tools` is the only unmodelled field with enforcement semantics, and therefore the only one whose loss is restriction-removing.

### Creative decisions (inlined)

#### OQ1 — the `metadata` name collision

The spec's `metadata` is an author-authored string→string map that must persist. `AgentCustomization.metadata: Record<string, unknown>` already existed as a **required** property that is *never serialized* — it carries tool-specific hints (`{ name: 'Display Name' }`, `{ nested: true, depth: 0 }`) between discover and emit within a single conversion. Opposite contracts on the same name: one must reach disk, the other must never.

Options: **A** rename `AgentCustomization.metadata` → `hints`; **B** add a flat `specMetadata?: Record<string, string>`; **C** nest all four new fields under a `spec?: {...}` object; **D** decline to model it.

**Selected: B.** Measurement decided it — `\bmetadata\b` appears ~326 times (35 across 12 source files, 291 across tests), and it is a required property, so every IR construction site sets it. A is the right end state at the wrong price: a major-version break of a published 1.0.0 interface with third-party `a16n-plugin-*` packages as a supported extension point, bought for a naming nicety. C would encode arrival order as structure — `name` and `description` are spec fields already modelled flat, so nesting only the newer ones is inconsistent. D fails on fitness and would drop the one new field Cursor officially supports.

The decisive insight: **the collision exists only in TypeScript, never on disk.** Transient `metadata` is never serialized (`formatIRFile()` explicitly excludes it; `parseIRFile()` initializes it to `{}`), so the on-disk key `metadata:` is unambiguous in both directions regardless of the in-memory property name. Naming the layer the conflict lives in dissolved most of it.

**Tradeoff accepted:** the IR permanently keeps a field named `metadata` that does not mean what the spec means by `metadata`. Paid down only by documentation — the mitigation is a *matched pair* of doc comments so the collision is discoverable at the definition site rather than by archaeology.

#### OQ2 — which IR types carry the fields

A `SKILL.md` classifies three ways: `hooks:` present → skipped (already warned); extra files → `AgentSkillIO`; `disable-model-invocation: true` → `ManualPrompt`; otherwise `SimpleAgentSkill`. The third route is the trap — `ManualPrompt` models neither `name` nor `description`.

Options: **A** flat duplication on the two skill types; **B** shared interface on the two skill types; **C** shared interface on all three including `ManualPrompt`; **D** reclassify so `disable-model-invocation` skills stop routing to `ManualPrompt`.

**Selected: C** — a shared `AgentSkillSpecFields` extended by `SimpleAgentSkill`, `AgentSkillIO`, and `ManualPrompt`, with `allowedTools` kept as a **single space-separated string** exactly as the spec defines it.

A and B are behaviorally identical and both fail the primary quality attribute: a skill with `disable-model-invocation: true` *and* `allowed-tools` is precisely the worst case the issue names, and it routes through the one type they leave out. Shipping A or B would close the common path while leaving the highest-stakes path open — the exact failure mode #142's reflection warned about ("attention concentrates where design difficulty is; the mechanical half goes unexamined"). D is correct in principle but changes what existing skills classify as, violating the additive-only invariant.

C's taxonomy objection — `ManualPrompt` also represents `.cursor/commands/*.md`, which has no frontmatter — is weaker than it looks: those simply leave the fields `undefined`, which is what optional fields are for, and **verified**, every `ManualPrompt` is emitted as a `SKILL.md` by *both* target plugins (`formatManualPromptAsSkill()` in each), never as a Cursor command. The fields are not foreign to it.

`allowedTools` is not split into an array: the spec's own example (`Bash(git:*) Bash(jq:*) Read`) contains parentheses and colons, and re-joining a parsed array is a lossless-*looking* operation that invites normalization bugs.

#### OQ3 — emit disposition per field and target

Five emit surfaces differ on **two independent axes**: *can it carry the bytes?* and *does it honor the semantics?*

| Surface | Carries bytes? | Honors `allowed-tools`? |
|---|---|---|
| S1 `.claude/skills/*/SKILL.md` | Yes | **Yes** |
| S2 `.cursor/skills/*/SKILL.md` | Yes (unknown keys inert) | **No** |
| S3 `.cursor/rules/*.mdc` | **No** — fixed 3-key schema | No |
| S4 `.a16n/**` | Yes (it is the IR) | N/A — not a runtime |
| S5 `AGENTS.md` | N/A — whole skill already skipped + warned | N/A |

Options: **A** write everywhere possible, never warn; **B** write everywhere possible, warn on every field the target does not document; **C** behavior-keyed; **D** omit unsupported fields and warn.

**Selected: C.** Separating the two axes *is* the design — "can the surface carry the bytes" decides whether to write, "does the target honor the semantics" decides whether to warn. A collapses them by never warning and ships the reported bug. B collapses them by warning whenever the documented schema lacks a key, which reports a loss that did not occur for `license`/`compatibility` (no harness executes them; written verbatim, nothing is lost) and trains users to ignore output. D strips recoverable content.

| Field | S1 claude | S2 cursor `SKILL.md` | S3 cursor `.mdc` | S4 `.a16n` |
|---|---|---|---|---|
| `license` | write, silent | write, silent | dropped → `Approximated` | write, silent |
| `compatibility` | write, silent | write, silent | dropped → `Approximated` | write, silent |
| `metadata` | write, silent | write, silent (officially supported) | dropped → `Approximated` | write, silent |
| `allowed-tools` | write, silent | **write + `Skipped`** | dropped → **`Skipped`** | write, silent |

Two verified facts made this possible. First, **Cursor tolerates unknown frontmatter keys** — its docs state it loads skills from `.claude/skills/` and `.codex/skills/` for compatibility, and those files routinely carry Claude-only keys, so a harness ingesting them cannot be rejecting unknown keys. Second, **`Skipped` does not mean "drop the item"** — `handleDeleteSource()` in `packages/cli/src/commands/convert.ts` only subtracts the item's source path from the `--delete-source` set while the item is still emitted. That single verified fact is what let this decision preserve the author's bytes *and* fail closed, instead of trading one against the other.

Warnings are **one per item per surface, not per field**: collect the affected fields, emit one warning naming them, escalate to `Skipped` if `allowedTools` is among them. A skill losing three fields on the `.mdc` route produces one line, not three. `Skipped` warnings must carry the item's `sourcePath` in `sources` or the `--delete-source` protection does not engage.

An invariant carried forward from #142 was corrected here: *"warnings name the spec, never a destination harness"* is a **discover-side** rule, because `discover()` is target-unaware. Emit-side warnings already name targets (`"AgentIgnore approximated as permissions.deny"`), so emit warnings for these fields may too.

### Implementation sequence

Thirteen TDD cycles ordered fewest-dependencies-first — models → claude → cursor → a16n → CLI → docs — so the riskiest step landed alone and late. Each step was structured as (a) write/extend tests, (b) stub the interface, (c) run expecting red, (d) implement to green.

1. `AgentSkillSpecFields` added to `packages/models/src/types.ts` and extended by all three skill types, with the paired `metadata`/`specMetadata` doc comments.
2. `parseSkillFrontmatter()` / `writeAgentSkillIO()` in `packages/models/src/agentskills-io.ts` taught the four fields — including non-string `metadata` coercion and empty-map omission.
3. `CURRENT_IR_VERSION` bumped `v1beta2` → `v1beta3`, with the 18 remaining literals swept across `plugin-a16n` src/tests/README and the docs site.
4. `plugin-claude` discover — the four fields extracted and populated on all three constructed item types.
5. `plugin-claude` emit — a frontmatter builder introduced because `metadata` is a nested map and cannot use the existing one-line `JSON.stringify` concatenation pattern.
6. `plugin-cursor` frontmatter parser swapped from a hand-rolled line-regex to `gray-matter` — the highest-risk step, performed and committed alone. `parseMdc()` in `src/mdc.ts` was deliberately **not** touched, because Cursor's `.mdc` format is intentionally not standards-compliant YAML.
7. `packages/plugin-cursor/src/skill-field-support.ts` encodes the OQ3 table as the single source of truth.
8. All five cursor emit sites routed through it via one `specFieldsFor()` helper that resolves fields and records the warning together.
9. `plugin-a16n` `format.ts` / `parse.ts` carry the four fields symmetrically under spec key names.
10. The 16-combination fidelity property test (added at preflight — see below).
11. CLI integration fixture reproducing the issue, plus two `--delete-source` e2e cases.
12. Documentation across five surfaces.
13. Follow-ups filed as #147 and #148; `systemPatterns.md` corrected where this work made it factually wrong (the "`hooks:` is currently the only fail-closed case" claim, which `allowed-tools` invalidates).

### Preflight findings

Both findings came from a scripted probe against the codebase rather than from re-reading source — the process improvement carried over from #142.

**Finding A (blocking, remediated in-phase).** The original 12 steps listed test files alongside source files but never ordered test-writing before production code *per unit*; TDD lived only in the plan's preamble. Steps were restructured into explicit a/b/c/d cycles with a "do not begin (d) before (c) is red" instruction. A strict reading of the preflight skill would have returned this to `/niko-plan`; remediating in-phase was justified because the deficiency was in step *encoding*, not design, and no creative decision changed. Flagged explicitly so the operator could overrule.

**Finding B (advisory, adopted).** The test plan enumerated good cases but nothing would catch *one* field/route combination being missed — which is precisely how this bug class arose in the first place. Added step 10.

Every probed assumption held: `gray-matter@^4.0.3` present in three packages and absent in `plugin-cursor` (a dependency edge, not a new technology); zero `v1beta2` literals inside any fixture directory; no snapshot tests anywhere in the repo and no exact-full-file assertions on emitted skill frontmatter; `WarningCode.Skipped` has exactly one consumer outside the plugins; the `.mdc` downgrade route is genuinely reachable via `plugin-a16n`'s `discoverAgentSkillIO()`.

### Key files

**`@a16njs/models`** — `src/types.ts` (the `AgentSkillSpecFields` interface, extended by three types), `src/agentskills-io.ts` (parse/write plus the exported `extractSpecFields`, `formatSpecFieldsYaml`, `assignSpecFields` helpers), `src/version.ts` (`v1beta3`), `src/index.ts` (exports).

**`plugin-claude`** — `src/discover.ts` (four fields extracted via the existing `gray-matter` path), `src/emit.ts` (frontmatter builder).

**`plugin-cursor`** — `src/discover.ts` (regex parser → `gray-matter`), `src/skill-field-support.ts` (**new** — the OQ3 disposition table), `src/emit.ts` (five surfaces routed through one helper), `package.json` (`gray-matter` added).

**`plugin-a16n`** — `src/format.ts`, `src/parse.ts`.

**`packages/cli`** — `test/integration/integration-skill-field-fidelity.test.ts` (**new** — the property test), `test/integration/fixtures/claude-spec-fields-to-cursor/` (**new** — the issue reproduction), `test/e2e/cli-delete-source.test.ts`.

**Docs** — `packages/docs/docs/understanding-conversions/index.md`, `packages/docs/docs/models/index.md`, `packages/docs/docs/plugin-a16n/index.md`, and the `plugin-cursor` / `plugin-claude` / `plugin-a16n` READMEs.

Net across the branch, excluding the memory bank: 51 files, +2179 / −91.

### Build deviations from plan

- **`formatSpecFieldsYaml` hoisted from `plugin-claude` into `models`**, paired with the existing `extractSpecFields`. Not in the plan; taken because `plugin-cursor` needed the same renderer and the four spec key names were about to be spelled in three separate files. Reader and writer now sit together and cannot disagree.
- **A key-presence scan was used instead of adding `gray-matter` to the CLI** for the property test — it only needs to know which keys appeared in the output.
- **Step 7 skipped its stub-first cycle**, recorded honestly: the implementation was written directly after its test, so the observed red was an unresolved-import error rather than assertion failures. Steps 9 and 10 followed the intended cycle and produced real assertion-level reds.

## TESTING

**Final verification (cache disabled):** 1147 tests green across 9 packages; `build` and `typecheck` clean.

Coverage was planned as behaviors before it was written as files:

- **IR types** — all four fields on all three skill types, plus the all-omitted case.
- **Verbatim reader/writer** — parse-all-four, parse-none (`undefined`, not empty string/object), `allowed-tools` preserved as the *exact* authored string, non-string `metadata` coerced, empty `metadata: {}` omitted rather than written, spec key names on write (`allowed-tools`, not `allowedTools`), and write→read round-trip identity.
- **Discover, both plugins** — each field populated, classification unchanged, the `ManualPrompt` + `allowed-tools` case (the single most important discover test), and a regression guard that spec fields raise **zero** warnings and specifically no non-spec advisory from `detectNonSpecFeatures`.
- **Cursor parser swap characterization** — seven cases pinning the *current* regex parser's handling of `description` values containing `:`, `#`, quotes, and trailing spaces were written and run **green against the unmodified parser first**, then re-run after the swap. **Zero characterization diffs**; the full repo suite stayed green.
- **Emit** — claude writes all four with spec key names and zero warnings; cursor writes inert fields silently, writes `allowedTools` **plus** exactly one `Skipped` carrying `sources: [sourcePath]`, produces one warning and not four when all fields are present, and escalates the `.mdc` route's `Approximated` to `Skipped` when `allowedTools` is among the dropped fields.
- **Edge cases** — a `license` containing periods and spaces surviving YAML quoting; a 500-character `compatibility` passing through untruncated (a16n converts, it does not lint); a `metadata` key colliding with a reserved frontmatter name staying nested; spec fields alongside `hooks:` producing exactly one warning; spec fields alongside a non-spec feature keeping the two advisories disjoint.
- **Integration** — the issue's exact reproduction end to end; `claude → a16n → claude` field-identical; and `--delete-source` proving the source file survives when `allowed-tools` cannot be enforced and is deleted when nothing is lost.
- **The property test** — all 16 combinations of the four fields asserted so that no combination is ever both absent from the output *and* unmentioned in the warnings. Rather than trust that it passed, it was **mutation-verified**: stubbing the cursor renderer to return `''` failed exactly the 14 combinations carrying inert fields.

**QA (`/niko-qa`): PASS.** One trivial DRY fix — `writeAgentSkillIO` and `plugin-a16n`'s local `addSpecFields` both mapped IR fields to spec key names, so they were consolidated into an exported `assignSpecFields` (the object-form counterpart of `formatSpecFieldsYaml`), completing the build's "spell the key names once" intent. No completeness, YAGNI, regression, integrity, or documentation issues.

## LESSONS LEARNED

### Technical

- **Stale built plugin output is this monorepo's dominant false-red.** The CLI and cross-package imports resolve `@a16njs/*/dist`, so a source-green package can still fail integration tests until `pnpm --filter <pkg> build`. It cost two false readings during build — 30 failures at once, all looking exactly like "field absent, no warning," i.e. like missing features — and resurfaced immediately in QA when `plugin-a16n` imported a brand-new models export before a rebuild. "Rebuild models/plugins" should be the *first* hypothesis whenever a new export or emit path appears missing.
- **"Bytes preserved" and "behavior preserved" are independent axes.** Only `allowed-tools`→Cursor disagrees on them, and that single disagreement is why a disposition table beats any uniform emit rule. A design that collapses the axes gets that one case wrong in one direction or the other.
- **Naming the layer a conflict lives in can dissolve it.** OQ1 looked like a costly rename until it became clear the collision was purely in TypeScript — transient `metadata` never reaches disk, so the file format was never actually contested.
- **`Skipped` means "do not delete the source," not "no output."** Verifying that once converted OQ3 from a tradeoff into a both-ways win.
- **Measuring beat estimating, twice.** The `metadata` rename looked defensible until counted (~326 sites, public 1.0.0 break); the IR version bump looked risky until counted (18 literals, zero in fixtures).

### Process

- **A thorough Test Plan section that is not mirrored inside the numbered steps creates a false sense of TDD coverage.** The plan's own TDD encoding was the weakest thing preflight found, and it was self-inflicted: a well-written artifact in the wrong place reads as coverage. Preflight caught the encoding gap, but build *still* slipped once at step 7 — so encoding the cycle is necessary and not sufficient. The red has to be assertion-level, not an unresolved-import error.
- **Mutation-check any test whose purpose is detecting silence.** Stubbing the emitter and confirming the property test failed for the right combinations was the single best verification move of the build phase, and it is cheap enough to be the default.
- **The property test earned its place immediately.** Preflight Finding B directly prevented a class of silent-loss regression that the example-based plan would have missed — which matters especially here, because missing one field/route combination is exactly how the original bug arose.
- **Per-package runs are not a substitute for the sweep.** Two of the build's own test bugs were caught only by the full-suite run, because the package under edit was green while `models` was not.
- **Preflight's mechanical half held again.** Last task's lesson was that its evaluative half was unreliable while its mechanical half was sound; every scripted probe this time confirmed the plan. The one premise that could not be verified locally — Cursor's tolerance of unknown frontmatter keys — was recorded as carried risk with a named containment rather than quietly upgraded to fact.

## PROCESS IMPROVEMENTS

- **Write plan steps that cannot be executed without a red assertion run.** The a/b/c/d restructuring was the right remediation but did not fully bind; consider making "paste the failing assertion output" the explicit gate for moving to (d).
- **Make "is `dist` current?" a standing first check** in the build and QA phases of this repo, not a lesson relearned per task. It has now produced false reds in two consecutive phases of the same task.
- **Keep the scripted-probe preflight.** Two consecutive tasks confirm it is faster and more reliable than re-reading source, and it is what produced both findings here.
- **When a creative decision rests on an unverifiable external premise, name the containment in the same breath.** OQ3's "unknown keys are inert in Cursor" is inference from documentation, and the decision to encode the table in exactly one module *is* the mitigation — recording that pairing made the risk cheap to carry.

## TECHNICAL IMPROVEMENTS

- **The taxonomy smell is still there.** `ManualPrompt` swallowing the authored `description` suggests skill identity is modelled by *routing* rather than by a skill type. This task's field additions are correct either way, but if that layering is ever revisited, #147 becomes the main event and this fix will read as partial in hindsight.
- **`AgentCustomization.metadata` vs `specMetadata` should be collapsed** if a major version of `@a16njs/models` is ever cut for other reasons. Option A from OQ1 remains the right end state; only its price disqualified it.
- **a16n models the spec without validating it.** A 900-character `compatibility` or a `name` with consecutive hyphens passes straight through. This is a deliberate non-goal — a16n converts, it does not lint — and tests assert pass-through so the choice is visible rather than accidental. Worth revisiting only if a "spec lint" command is ever wanted.
- **`skill-field-support.ts` stays local to `plugin-cursor`** with a single consumer, mirroring the reasoning that kept `detectNonSpecFeatures` local in #142. Promote to `@a16njs/models` only if a second consumer appears.

## NEXT STEPS

1. Open the PR for branch `issue-143` and address review.
2. [#147](https://github.com/Texarkanine/a16n/issues/147) — `ManualPrompt` discards the authored `description` in favour of a synthesized `Invoke with /<name>`. Required-field loss; needs its own design decision about that convention.
3. [#148](https://github.com/Texarkanine/a16n/issues/148) — Cursor's `paths:` on skills is unmodelled. Category A of the #142 taxonomy.
4. [#144](https://github.com/Texarkanine/a16n/issues/144) — argues `Skipped`'s `--delete-source` coupling should be relied on more broadly; this task is a worked example of it paying off.
