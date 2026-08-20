---
task_id: oxlint-160-models-engine
complexity_level: 2
date: 2026-08-20
status: completed
---

# TASK ARCHIVE: Oxlint Unused-Vars Cleanup for Models and Engine

## SUMMARY

Cleared the eight `eslint(no-unused-vars)` findings Oxlint reported in `@a16njs/models` and `@a16njs/engine` (issue #160). Product edits drop unused imports and one unused catch binding. No exported behavior changed. Oxlint is clean on both packages; existing Vitest suites pass.

## REQUIREMENTS

- Clean four unused-vars findings in each of models and engine in one grouped change.
- Do not change exported APIs or callback signatures.
- Do not enable extra Oxlint categories or add lint to CI.
- Do not add change-detector tests; use Oxlint plus existing package tests.
- Done when `pnpm exec oxlint packages/models packages/engine` is clean and `pnpm --filter @a16njs/models test` plus `pnpm --filter @a16njs/engine test` pass.

All requirements were met. Parent review approved the product diff.

## IMPLEMENTATION

Named diagnostics and the edits:

| Finding | Change |
|---------|--------|
| `packages/models/test/agentskills-io.test.ts` — `extractSpecFields`, `ParsedSkill` | Drop unused imports |
| `packages/models/test/version.test.ts` — `IRVersion` | Drop unused type import |
| `packages/models/src/agentskills-io.ts:259` — catch `error` in `readSkillFiles` | `catch (error)` → `catch {` |
| `packages/engine/src/plugin-loader.ts` — `PluginRegistration` | Import only `PluginRegistrationInput` |
| `packages/engine/test/plugin-discovery.test.ts` — `vi` | Drop unused vitest import |
| `packages/engine/test/plugin-registry.test.ts` — `PluginRegistration` | Drop unused type import |
| `packages/engine/test/transformation.test.ts` — `EmitResult` | Drop unused type import |

Unused `__dirname` / `fileURLToPath` in plugin-discovery tests were left alone because Oxlint does not report them.

## TESTING

- Oxlint on the eight sites was the red assertion; each name was removed and the file re-checked.
- `pnpm exec oxlint packages/models packages/engine`: clean (exit 0).
- `pnpm --filter @a16njs/models test`: 131 passed.
- `pnpm --filter @a16njs/engine test`: 175 passed after building `@a16njs/plugin-cursor` and `@a16njs/plugin-claude` (engine tests import those packages).
- Preflight: PASS. QA: PASS. No QA fixes.

## LESSONS LEARNED

### Technical

- Engine's `engine.test.ts` imports bundled plugins by package name. A worktree that only builds models and engine will fail that suite until those plugin packages are built.
- `oxlint --fix` does not clear these unused-name findings; they have to be deleted by hand.

### Process

- For unused-name cleanups, Oxlint is a sufficient red/green assertion. New tests would have been change-detectors.

### Million-Dollar Question

The unused names should never have been imported. The cleanup is deleting them; there is no deeper redesign.

## PROCESS IMPROVEMENTS

When validating engine tests in an isolated worktree, build `@a16njs/plugin-cursor` and `@a16njs/plugin-claude` before `pnpm --filter @a16njs/engine test`.

## TECHNICAL IMPROVEMENTS

This work did not surface architecture changes. Unused locals Oxlint does not report (for example `__dirname` in plugin-discovery tests) remain outside this issue's eight findings.

## NEXT STEPS

None for this task. Remaining Oxlint leftovers in other packages stay per-package follow-up, not a merge gate.
