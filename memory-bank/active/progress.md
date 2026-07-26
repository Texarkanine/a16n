# Progress

Bring a16n's skill IR up to date with the current AgentSkills.io specification, so that spec-compliant frontmatter (`license`, `compatibility`, `metadata`, `allowed-tools`) survives conversion instead of being silently dropped. Category B of the fidelity taxonomy established in #142. Tracked as [issue #143](https://github.com/Texarkanine/a16n/issues/143).

**Complexity:** Level 3

## 2026-07-25 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Fetched the AgentSkills.io spec fresh from <https://agentskills.io/specification.md>; recorded its full frontmatter table in `projectbrief.md` as the authoritative reference for this task.
    - Compared the spec against `SimpleAgentSkill` / `AgentSkillIO` in `packages/models/src/types.ts`; confirmed `license`, `compatibility`, `metadata`, and `allowed-tools` are all unmodeled.
    - Confirmed intent with the operator and wrote the project brief.
* Decisions made
    - Level 3. IR-rooted change with a documented ripple to every plugin, plus two open design questions (metadata collision, per-target disposition).
    - Scope includes the spec's `metadata` field, which #143 does not name — the issue predates this fresh spec read, and omitting it would leave the same class of gap the issue exists to close.
* Insights
    - The issue names three missing fields; the fresh spec read finds four. `metadata` is the one the issue missed, and it is also the one with a naming conflict against an existing IR concept — the IR's `metadata` is transient and never serialized (`systemPatterns.md`), which is the opposite of what the spec's `metadata` requires.
    - `allowed-tools` is flagged experimental by the spec but is the highest-stakes field here: dropping it makes the emitted artifact more permissive than authored, which the recorded disposition rule says must fail closed.

## 2026-07-25 - CREATIVE - COMPLETE

Three open questions explored, all resolved at high confidence.

* Work completed
    - `creative-metadata-collision.md` — how to model the spec's `metadata` against the IR's existing transient `metadata`.
    - `creative-ir-field-placement.md` — which IR types carry the new fields.
    - `creative-emit-disposition.md` — what each emit surface does with each field.
* Decisions made
    - OQ1: flat `specMetadata?: Record<string, string>`; do not rename `AgentCustomization.metadata`.
    - OQ2: shared `AgentSkillSpecFields` extended by `SimpleAgentSkill`, `AgentSkillIO`, and `ManualPrompt`; `allowedTools` stays one space-separated string.
    - OQ3: behavior-keyed disposition; `allowed-tools`→Cursor is written and raises one `Skipped`; inert fields silent; `.mdc` route raises one warning per item.
    - Deferred with reasons recorded: `description` loss on `ManualPrompt`, Cursor `paths:` on skills, spec-limit validation.
* Insights
    - Measuring beat estimating twice. The `metadata` rename looked defensible until counted (~326 sites, public 1.0.0 break); the IR version bump looked risky until counted (18 literals, no fixtures).
    - The collision that framed OQ1 turned out to exist only in TypeScript — transient `metadata` never reaches disk, so the file format was never actually contested. Naming the layer a conflict lives in dissolved most of it.
    - `Skipped` does not mean "no output" — it means "do not delete the source." That single verified fact is what let OQ3 preserve the author's bytes *and* fail closed, instead of trading one against the other.
    - An invariant carried forward from #142 was over-general: spec-only warning wording is a constraint on `discover()` because it is target-unaware, not a universal rule. Emit may name the target.

## 2026-07-25 - PLAN - COMPLETE

* Work completed
    - Full component analysis with a pinned field-support matrix (spec vs. Claude vs. Cursor, sourced from freshly fetched docs) and a dataflow diagram of where skill frontmatter travels today.
    - 12-step ordered TDD implementation plan, test plan with edge cases, challenges, and pre-mortem written to `tasks.md`.
* Decisions made
    - Sequence models → claude → cursor → a16n → CLI → docs, so the riskiest step (cursor parser swap) lands alone and late.
    - `plugin-agentsmd` explicitly out of scope; IR version bumps to `v1beta3`.
    - The OQ3 disposition table gets encoded in exactly one module, which is also the mitigation if its central premise is wrong.
* Insights
    - The pre-mortem's sharpest finding was not a risk but a layering doubt: `ManualPrompt` swallowing `description` suggests skill identity is modelled by routing rather than by type. Scoped out, but it is the thing most likely to make this fix look partial in hindsight.

## 2026-07-25 - PREFLIGHT - COMPLETE (PASS)

* Work completed
    - Probed every load-bearing plan assumption against the codebase rather than re-reading the source: dependency versions, fixture contents, snapshot usage, `Skipped` consumers, `.mdc` route reachability, `ManualPrompt` emit destinations, and overlap with existing modules. All held.
    - Finding A (blocking): the numbered steps lacked per-unit test-before-code ordering. Restructured all steps into explicit a/b/c/d TDD cycles, with step 6 carrying the special "characterization tests must pass green *before* the parser swap" instruction.
    - Finding B (advisory, adopted): added step 10, a 16-combination fidelity property test.
    - Wrote `.preflight-status` = PASS.
* Decisions made
    - Remediated Finding A in-phase rather than returning to `/niko-plan`, on the grounds that the deficiency was in step encoding and no design or creative decision changed. Flagged explicitly so the operator can overrule.
    - Step count 12 → 13; the cursor parser swap gets its own commit.
* Insights
    - The plan's own TDD encoding was the weakest thing preflight found, and it was self-inflicted: a thorough separate "Test Plan" section made the numbered steps *feel* test-driven while none of them said so. A well-written artifact in the wrong place reads as coverage.
    - Every probe confirmed the plan, which is itself worth noting: last task's preflight lesson was that its evaluative half was unreliable while its mechanical half was sound. The mechanical half held again.
    - The one premise that could not be verified locally — Cursor's tolerance of unknown frontmatter keys — is recorded as carried risk with a named containment, rather than being quietly upgraded to fact.
