# Tasks

Fix oxlint unused-vars and irregular-whitespace in plugin-cursor

## Build

What broke: 10 Oxlint correctness leftovers in `@a16njs/plugin-cursor` — 6 `no-unused-vars`, 4 `no-irregular-whitespace`.

Why: leftover from #74 / #155 (Oxlint bound, leftovers not cleared). `oxlint --fix` does not clear them. The four irregular-whitespace hits were U+200B zero-width spaces inserted so the glob `.cursor/skills/*/SKILL.md` would not terminate a `/* */` comment.

What changed:
- Rewrote the four comment paths as `.cursor/skills/<name>/SKILL.md` (same meaning as the skill-directory model; no hidden character).
- Dropped unused `type FileRule` import in `src/emit.ts` (`isFileRule` remains).
- Dropped unused `path` import in `test/emit-simple-agent-skill.test.ts`.
- Dropped unused `result` bindings in four tests that already assert on written files (same pattern as neighboring cases).

Files affected:
- `packages/plugin-cursor/src/skill-field-support.ts`
- `packages/plugin-cursor/src/discover.ts`
- `packages/plugin-cursor/src/emit.ts`
- `packages/plugin-cursor/test/emit-skills.test.ts`
- `packages/plugin-cursor/test/emit-agent-ignore.test.ts`
- `packages/plugin-cursor/test/emit-agent-skill-io.test.ts`
- `packages/plugin-cursor/test/emit-manual-prompt.test.ts`
- `packages/plugin-cursor/test/emit-simple-agent-skill.test.ts`

Validation: `pnpm exec oxlint packages/plugin-cursor` clean; `pnpm --filter @a16njs/plugin-cursor test` 21 files / 191 tests passed (after `pnpm --filter @a16njs/models build` — worktree had no `models/dist`).
