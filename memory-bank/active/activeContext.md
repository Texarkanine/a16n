# Active Context

## Current Task
Fix plugin-{cursor,claude} docs for complex skills + fix `--rewrite-path-refs` for ride-along resource file references.

## Phase
BUILD - COMPLETE

## What Was Done
- Level 2 plan written to `memory-bank/active/tasks.md`.
- Design decision for Bug 2: add optional `WrittenFile.sourcePaths?: string[]` (Option C); rejected phantom-IR-items (Option A) and extending `AgentSkillIO` IR (Option B) as IR pollution.
- 8 testable behaviors enumerated; TDD cycle executed across engine, both plugins, and integration tests.
- 9 implementation steps executed, each committed independently (commits 6c7337c5..327c4ee2):
  - Step 1: `WrittenFile.sourcePaths?: string[]` in `packages/models`.
  - Step 2 + 2b: `buildMapping` honors `sourcePaths` + collision detection; `rewriteContent`/`detectOrphans` extended to `scripts/**` + `references/**` ride-alongs.
  - Step 3: plugin-cursor emit populates `sourcePaths` on AgentSkillIO resource WrittenFiles.
  - Step 4: plugin-claude emit populates `sourcePaths` on AgentSkillIO resource WrittenFiles (symmetric).
  - Step 5: CI4 end-to-end integration test green on Node 22 (CI1–CI4 all passing; the "Workspace refactor blocker" noted mid-build turned out to be a Node 20 artifact, not a real failure).
  - Step 6 + 7: corrected complex-skill classification docs in `plugin-cursor/index.md` + `plugin-claude/index.md`.
  - Step 8: documented `--rewrite-path-refs` scope for AgentSkillIO ride-alongs in `cli/index.md` + `understanding-conversions/index.md`.
  - Step 9: full validation — build 7/7, typecheck 12/12, **all 15 turbo test tasks pass on Node 22** (the project's only supported runtime). Docusaurus site build deferred to user.

## Next Step
Proceed to REFLECT phase when the user is ready.
