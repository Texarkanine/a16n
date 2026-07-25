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
