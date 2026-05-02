# Active Context

## Current Task: SLOBAC Audit Remediation — M5 (Split plugin-claude discover.test.ts)

**Phase:** L2 BUILD — COMPLETE

## What Was Done

- **Build:** Split completed. Added `packages/plugin-claude/test/test-support/discover-helpers.ts` (`discoverFixturesDir(import.meta.url)` → `test/fixtures`). New files: `discover-claude-md.test.ts`, `discover-simple-agent-skill.test.ts`, `discover-agent-ignore.test.ts`, `discover-manual-prompt.test.ts`, `discover-never-manual-prompt.test.ts`, `discover-agent-skill-io.test.ts`, `discover-rules.test.ts`. Removed `packages/plugin-claude/test/discover.test.ts`.
- **Docs:** `packages/docs/docs/plugin-development/index.md` template tree updated to `discover-*.test.ts` / `emit-*.test.ts` (aligned with split suites).
- **Verification:** Discover `it(` count **58**; package total **144**; full `pnpm test` green.

## Next Step

- **QA:** Invoke `/niko-qa` (Level 2 QA phase).
