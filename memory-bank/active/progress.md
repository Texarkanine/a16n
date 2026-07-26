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
