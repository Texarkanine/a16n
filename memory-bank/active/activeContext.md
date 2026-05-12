# Active Context

## Current Task: SLOBAC Rework — plugin-cursor test quality

**Phase:** BUILD — COMPLETE

**What Was Done:**
- Implemented SLOBAC rework per `tasks.md`: new fixture `cursor-globs-and-description` / `both-fields.mdc`; removed 2 redundant classification tests absorbed by discover-file-rule / discover-simple-agent-skill-rules; reworked globs-vs-description precedence to use that fixture (`toHaveLength(1)` + `FileRule`).
- Strengthened vacuous assertions: `discover-cursor-plugin.test.ts` `relativeDir` exact paths; `emit-global-prompt.test.ts` `My-Rules-v2.mdc`; `emit-skills.test.ts` `my-skill-v2`.
- Removed duplicate ManualPrompt `describe` block from `emit-skills.test.ts` (coverage remains in `emit-manual-prompt.test.ts`).
- Verification: `vitest run` on four touched files, then full `packages/plugin-cursor` suite (**133** tests); `pnpm build` (tsc) clean.

**Next Step:**
- Invoke `/niko-qa` for semantic QA review, then Reflect when QA passes.
