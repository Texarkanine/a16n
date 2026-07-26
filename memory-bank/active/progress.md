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

## 2026-07-26 - PREFLIGHT - COMPLETE

* Work completed
    - Validated plan against codebase (ManualPrompt type, discover drop sites, emit synthesize sites, IR format/parse, agentsmd Unsupported)
    - Amended plan for explicit per-step TDD ordering
    - Wrote `.preflight-status` = PASS
* Decisions made
    - No rearchitect; option 1 stands
* Insights
    - Radical-innovation advisory: a tiny shared description resolver could dedupe Claude/Cursor emit — defer unless duplication bites during build

## 2026-07-26 - BUILD - COMPLETE

* Work completed
    - Optional `ManualPrompt.description` through discover → IR → emit
    - IR version `v1beta4`
    - Full suite + typecheck green (`pnpm test -- --force`)
* Decisions made
    - Keep identical one-liner `prompt.description ?? synthesize` in both emitters (no shared helper)
    - Empty/missing description → synthesize; non-empty authored prose preserved byte-for-byte
* Insights
    - Live skill emit surfaces can carry description; silent overwrite was the real bug, not a missing command emit path

## 2026-07-26 - QA - COMPLETE

* Work completed
    - Semantic review against plan: KISS/DRY/YAGNI/completeness/regression/integrity/docs
    - Wrote `.qa-validation-status` = PASS
* Decisions made
    - Keep duplicated one-line emit resolver (two call sites); not worth a shared helper
* Insights
    - Issue AC "warn when cannot carry" is satisfied by agentsmd `unsupported` (no write / no boilerplate), not a field-level Approximated warning — matches the approved plan
