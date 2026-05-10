**Current Task:** Cursor Commands deprecation migration (plugin-cursor emit change)

**Phase:** BUILD - COMPLETE

**What Was Done:**
- Completed full TDD Build phase per plan and L3 workflow:
  - Stubbed/modified tests first (emit-manual-prompt.test.ts + 2 others for new Skill expectations + migration comment).
  - Ran failing tests (confirmed).
  - Implemented `formatManualPromptAsSkill` + replaced ManualPrompt emit logic in `emit.ts` (now emits to `.cursor/skills/.../SKILL.md` with disable frontmatter; reused collision/sanitize/relativeDir).
  - Added non-roundtrip comment to `discover.ts`.
  - Fixed cross-test expectations; full suite 137/137 passed.
  - Updated CHANGELOG + docs; build/lint clean.
- No deviations from plan; advisory on shared helper noted for future.
- All per always-tdd, test practices, and Niko rules.

**Next Step:** Update progress.md, commit, then invoke `/niko-qa` for semantic QA review.