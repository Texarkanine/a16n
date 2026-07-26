# Progress

Preserve authored `description` on `ManualPrompt` (skills with `disable-model-invocation: true`) through discovery, IR, and emit; warn when a target cannot carry it; synthesize boilerplate only when absent. Tracked as [#147](https://github.com/Texarkanine/a16n/issues/147).

**Complexity:** Level 2

## 2026-07-26 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Memory bank ephemeral files created for issue-147
    - Intent restated from issue body and approved by operator
    - Complexity determined as Level 2
* Decisions made
    - Lean option 1 (optional `description` on `ManualPrompt`); re-evaluate `disable-model-invocation` special-casing at plan/build; option 2 out of scope unless research overturns
* Insights
    - Issue-143 already carried AgentSkillSpecFields onto ManualPrompt; this gap is specifically the required-spec `description` field that ManualPrompt still lacks as a first-class authored value

## 2026-07-26 - PLAN - COMPLETE

* Work completed
    - Level 2 implementation plan and TDD test plan written to `tasks.md`
    - Re-evaluated `disable-model-invocation` special-casing: keep ManualPrompt classification (option 1)
* Decisions made
    - Optional `description?: string` on ManualPrompt; synthesize only when absent
    - Bump IR to v1beta4 for the additive field
    - Do not restore Cursor command emit; satisfy cannot-carry via agentsmd Unsupported + never overwrite authored prose
* Insights
    - agentskills/agentskills#236 proposed standardizing the flag but it is not in the official spec; Cursor + Claude already share it
    - #99 already moved ManualPrompt emit to skills, so the issue's "commands cannot carry description" example is historical relative to live emit
