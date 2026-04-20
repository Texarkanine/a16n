# Progress

## Summary
Fix three related issues:
1. Docs in `packages/docs/docs/plugin-{cursor,claude}/index.md` inaccurately describe complex-skill handling.
2. `--rewrite-path-refs` does not rewrite references to ride-along resource files inside an `AgentSkillIO`'s SKILL.md body.
3. `--rewrite-path-refs` does not rewrite references inside the ride-along files themselves. Fix scoped to the two AgentSkills.io-spec text subtrees (`scripts/` and `references/`); `assets/` and any other subtree remain untouched by design.

**Complexity:** Level 2

## History
- 2026-04-20: Task classified as Level 2 after intent clarification.
- 2026-04-20: Preflight PASS w/ ADVISORY. Plan amended (Behavior 1, step 6, step 7, step 8) to capture full classification priority for both Cursor and Claude skip conditions and to include docs-site build in validation. Three advisory findings recorded.
- 2026-04-20: Plan further amended to include `buildMapping` collision-detection lint (new Behavior 2b, updated step 2, new challenge). Return type of `buildMapping` changes to `{ mapping, warnings }`. Single caller in `packages/engine/src/transformation.ts:112` updates to destructure. Captured the future clean-break refactor as a punchlist in `planning/writtenfile-clean-break.md` for a later Level 3 task.
- 2026-04-20: Post-preflight scope expansion (user request, driven by AgentSkills.io spec §Optional directories). Flipped "rewrite refs inside ride-along files" from non-goal to bounded in-scope. Added Behaviors 7 + 8, Step 2b (engine: `rewriteContent` + `detectOrphans` extended with local `isRewritableSkillResource` helper gating on `scripts/**` | `references/**`), expanded Step 5 integration test with assets/unknown negative cases, added Step 8 (docs: "What gets rewritten" table in `packages/docs/docs/cli/index.md`, mirror in understanding-conversions). Complexity remains Level 2. `projectbrief.md` non-goals updated.
