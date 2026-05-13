# Active Context

## Current Task: SLOBAC Rework — plugin-cursor test quality

**Phase:** REFLECT — COMPLETE (post-reflect PR #99 review feedback addressed)

**What Was Done:**
- Implemented SLOBAC rework per `tasks.md`: new fixture `cursor-globs-and-description` / `both-fields.mdc`; removed 2 redundant classification tests absorbed by discover-file-rule / discover-simple-agent-skill-rules; reworked globs-vs-description precedence to use that fixture (`toHaveLength(1)` + `FileRule`).
- Strengthened vacuous assertions: `discover-cursor-plugin.test.ts` `relativeDir` exact paths; `emit-global-prompt.test.ts` `My-Rules-v2.mdc`; `emit-skills.test.ts` `my-skill-v2`.
- Removed duplicate ManualPrompt `describe` block from `emit-skills.test.ts` (coverage remains in `emit-manual-prompt.test.ts`).
- Verification: `vitest run` on four touched files, then full `packages/plugin-cursor` suite (**133** tests); `pnpm build` (tsc) clean.
- Semantic QA review found no KISS/DRY/YAGNI/completeness/regression/integrity/documentation issues requiring fixes.
- Reflection completed in `memory-bank/active/reflection/reflection-slobac-rework-cursor-tests.md`; persistent memory files did not need updates.
- **Post-reflect (PR #99 review feedback, 3 commits since `f651768f`):**
  - **P1 collision-key regression** (`packages/plugin-cursor/src/emit.ts`): unified `usedSkillNames` was keying on the bare base name, so two `ManualPrompt`s named `review` in different `relativeDir`s incorrectly renamed the second to `review-1`. Fixed by keying collisions on the path under `.cursor/skills/` (qualified with normalized `relativeDir`) while preserving the unification with `SimpleAgentSkill` (which always emits flat). Regression test added in `emit-manual-prompt.test.ts` (verified failing then passing).
  - **Vacuous integration test** (`packages/cli/test/integration/integration-commands.test.ts`): `cursor-to-cursor-command-passthrough` was reading its own input path back from disk, so it would have passed even with a no-op emitter. Renamed to `cursor-to-cursor-command-migrates-to-skill` and reworked to assert the emitter produces the new `.cursor/skills/review/SKILL.md` with `disable-model-invocation: true` and does NOT regenerate the legacy `.cursor/commands/review.md`. Confirmed the migration round-trip is correct (the prior test gave no such evidence).
  - **Nitpick** (`emit-manual-prompt.test.ts` L39–61): added explicit positive + negative assertions on `result.written[*].path` to pin that the SKILL path is in the emitted output and the legacy commands path is not. Adapted the reviewer's literal suggestion (which referenced a non-existent `sourcePath` on `WrittenFile`) to use the actual `path` field.
  - Verification: `plugin-cursor` 134/134 (+1 regression test), `cli` 175/175 (one test rewritten), `pnpm build` and lints clean.

**Next Step:**
- Run `/niko-archive` to create the archive document and finalize the current project.
