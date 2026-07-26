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
