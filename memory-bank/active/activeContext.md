# Active Context

## Current Task: issue-143-spec-field-fidelity
**Phase:** PLAN - COMPLETE

## What Was Done
- Mapped the blast radius: `@a16njs/models` (types + the shared verbatim AgentSkills.io reader/writer + IR version), `plugin-claude` (discover + emit), `plugin-cursor` (discover + emit), `plugin-a16n` (IR format/parse), CLI fixtures, docs. `plugin-agentsmd` needs **no** change — it already skips whole skills with a warning, so a field cannot be lost more finely than the item already is.
- Resolved three open questions through creative exploration, all high confidence:
    - **OQ1 (`metadata` collision)** → add flat `specMetadata`; leave `AgentCustomization.metadata` alone. Measured the alternative: renaming touches ~326 sites and breaks a published 1.0.0 interface. The collision is TypeScript-only — the on-disk key stays the spec's `metadata`.
    - **OQ2 (field placement)** → shared `AgentSkillSpecFields` on `SimpleAgentSkill`, `AgentSkillIO`, **and `ManualPrompt`**. A `disable-model-invocation` skill classifies as `ManualPrompt`, so omitting it would close the common path and leave the highest-stakes one (`allowed-tools` on a manual skill) open.
    - **OQ3 (emit disposition)** → behavior-keyed: write wherever the surface carries bytes, warn only where something is genuinely lost. `allowed-tools` to Cursor is written **and** raises one `Skipped`; inert fields stay silent; the `.mdc` route raises one warning per item.
- Key evidence gathered rather than assumed: Cursor's official frontmatter schema (fetched) omits `license`/`compatibility`/`allowed-tools` but Cursor loads `.claude/skills/` directly, so unknown keys are inert; and `handleDeleteSource()` proves a `Skipped` warning blocks source deletion **without** suppressing emission, which is what makes "emit + `Skipped`" a real fail-closed posture.
- Corrected an invariant mid-plan: "warnings never name a destination harness" is a discover-side rule only; emit-side warnings already name targets.
- Produced a 12-step TDD implementation plan, challenges, and a pre-mortem. Highest-risk step is isolated: swapping `plugin-cursor`'s hand-rolled skill frontmatter parser for gray-matter (structurally required to read a nested `metadata:` map), gated behind characterization tests.

## Next Step
- Preflight phase — validate the plan before build.
