# Active Context

## Current Task: issue-143-spec-field-fidelity
**Phase:** COMPLEXITY-ANALYSIS - COMPLETE

## What Was Done
- Fetched the AgentSkills.io spec fresh from <https://agentskills.io/specification.md> (2026-07-25) and diffed its frontmatter table against the IR in `packages/models/src/types.ts`. Four spec fields are unmodeled: `license`, `compatibility`, `metadata`, `allowed-tools`.
- Operator confirmed the restatement of intent: extend the IR to model the current spec, not merely warn on drop.
- **Level 3 determined.** The change starts in `@a16njs/models`, and `systemPatterns.md` records that IR type changes ripple through every plugin. Blast radius spans models + 4 plugins (cursor, claude, a16n, agentsmd) + CLI integration fixtures + docs. It also carries real design decisions that cannot be answered by reading code: the `metadata` name collision (spec-persisted vs. IR-transient), and per-field disposition when a target cannot express a field. Not Level 2 (not self-contained, not single-subsystem); not Level 4 (extends an existing contract, does not redesign one).

## Next Step
- Load `.cursor/skills/shared/niko/references/level3/level3-workflow.md` and execute its first phase.
