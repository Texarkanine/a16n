# Current Task: issue-71 — ManualPrompt emit to Cursor commands

**Complexity:** Level 1

## Build

- [x] Update existing ManualPrompt emission tests to assert `.cursor/commands/<name>.md` output
- [x] Add new test: ManualPrompt with `relativeDir` emits to `.cursor/commands/<relativeDir>/<name>.md`
- [x] Add new test: ManualPrompt content written directly without frontmatter
- [x] Update collision test (skill vs command no longer collide)
- [x] Run tests — all ManualPrompt tests should fail
- [x] Change emit.ts: ManualPrompt emission block writes to `.cursor/commands/`
- [x] Remove `formatManualPromptSkillMd()`; update `skillItems` and early-return check
- [x] Run full test suite — all tests pass
- [x] Update memory-bank; commit
