# Progress

## Summary
Fix two related issues:
1. Docs in `packages/docs/docs/plugin-{cursor,claude}/index.md` inaccurately describe complex-skill handling.
2. `--rewrite-path-refs` does not rewrite references to ride-along resource files inside an `AgentSkillIO`'s SKILL.md body.

**Complexity:** Level 2

## History
- 2026-04-20: Task classified as Level 2 after intent clarification.
- 2026-04-20: Preflight PASS w/ ADVISORY. Plan amended (Behavior 1, step 6, step 7, step 8) to capture full classification priority for both Cursor and Claude skip conditions and to include docs-site build in validation. Three advisory findings recorded.
- 2026-04-20: Plan further amended to include `buildMapping` collision-detection lint (new Behavior 2b, updated step 2, new challenge). Return type of `buildMapping` changes to `{ mapping, warnings }`. Single caller in `packages/engine/src/transformation.ts:112` updates to destructure. Captured the future clean-break refactor as a punchlist in `planning/writtenfile-clean-break.md` for a later Level 3 task.
