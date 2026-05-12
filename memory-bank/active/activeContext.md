**Current Task:** Cursor Commands deprecation migration — SLOBAC rework (plugin-cursor test quality)

**Phase:** PLAN - IN-PROGRESS

**What Was Done:**
- Original task (Commands → Skills migration) completed full L3 lifecycle (Plan → Preflight → Build → QA → Reflect).
- SLOBAC audit (`slobac-audit.md`) identified 10 findings across the plugin-cursor test suite: 3× conditional-logic, 3× vacuous-assertion, 4× semantic-redundancy.
- Several findings (9, 10) are directly caused by the migration's ManualPrompt tests duplicated in emit-skills.test.ts.
- Other findings (1-3, 7-8) predate the migration but affect the same test domain.

**Next Step:**
- Complete rework plan per SLOBAC audit prescriptions, then proceed through Preflight → Build.
