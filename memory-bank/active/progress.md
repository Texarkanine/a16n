# Progress

## Summary
Fix two related issues:
1. Docs in `packages/docs/docs/plugin-{cursor,claude}/index.md` inaccurately describe complex-skill handling.
2. `--rewrite-path-refs` does not rewrite references to ride-along resource files inside an `AgentSkillIO`'s SKILL.md body.

**Complexity:** Level 2

## History
- 2026-04-20: Task classified as Level 2 after intent clarification.
- 2026-04-20: Preflight PASS w/ ADVISORY. Plan amended (Behavior 1, step 6, step 7, step 8) to capture full classification priority for both Cursor and Claude skip conditions and to include docs-site build in validation. Three advisory findings recorded.
