# Active Context

## Current Task: issue-148-cursor-skill-paths-refuse
**Phase:** PLAN - COMPLETE

## What Was Done
- Planned Level 2 refuse-on-`paths:` work for [#148](https://github.com/Texarkanine/a16n/issues/148).
- Selected mechanism: discover-time fail-closed skip (Claude `hooks:` precedent) — `WarningCode.Skipped`, no IR item; not WARN-and-emit; not IR modeling.
- Test plan maps to `packages/plugin-cursor/test/discover-skills.test.ts` via existing `discoverProbeSkill` helper.

## Decisions
- **REFUSE** = item-level discover skip, not whole-CLI hard fail redesign.
- Do **not** model `paths` on the IR in this task (cursor→cursor also refuses until a future survival design).
- Detect via `'paths' in data` (key presence), before skill classification.

## Next Step
- Preflight validation (automatic for Level 2)
