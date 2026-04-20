# Active Context

## Current Task
Fix plugin-{cursor,claude} docs for complex skills + fix `--rewrite-path-refs` for ride-along resource file references.

## Phase
PLAN - COMPLETE

## What Was Done
- Level 2 plan written to `memory-bank/active/tasks.md`.
- Design decision for Bug 2: add optional `WrittenFile.sourcePaths?: string[]` (Option C); rejected phantom-IR-items (Option A) and extending `AgentSkillIO` IR (Option B) as IR pollution.
- 6 testable behaviors enumerated; TDD cycle planned across engine, both plugins, and integration tests.
- 8 implementation steps sequenced so each cycle is independently verifiable.

## Next Step
Run Preflight validation on the plan.
