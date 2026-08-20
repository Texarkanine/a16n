---
task_id: issue-74-oxc-linter
complexity_level: 2
date: 2026-08-20
status: completed
---

# TASK ARCHIVE: Bind `npm run lint` to Oxlint

## SUMMARY

Root `pnpm lint` / `pnpm lint:fix` now run Oxlint (`oxlint@1.79.0`, `.oxlintrc.json` from `--init`, correctness as error). CI is unchanged. Safe `--fix` rewrote 0 files. 80 leftover correctness errors were inventoried for follow-up tickets. Tracked as [#74](https://github.com/Texarkanine/a16n/issues/74); draft PR [#155](https://github.com/Texarkanine/a16n/pull/155).

## REQUIREMENTS

1. Bind `npm run lint` to Oxlint so it is optionally runnable.
2. Apply only truly safe autofix (`oxlint --fix`).
3. Do not add lint to CI.
4. Inventory leftovers by package for later tickets.
5. Open a PR to `main`.

## IMPLEMENTATION

`pnpm add -Dw oxlint`. Root scripts `"lint": "oxlint"` and `"lint:fix": "oxlint --fix"` replace `turbo run lint`. `.oxlintrc.json` from `oxlint --init`. Docs: `CONTRIBUTING.md`, `memory-bank/techContext.md`. `turbo.json` still has unused `"lint": {}` (left as-is).

## TESTING

No new Vitest cases (operator: script mapping is not a TDD unit; lint is the checker). `pnpm lint` runs Oxlint and exits 1 on leftovers. `pnpm test` (17/17) before and after `--fix`; `pnpm typecheck` green. `/niko-qa` PASS.

## LESSONS LEARNED

- Oxlint `--silent` empties `-f json` diagnostics.
- Unused-vars and irregular-whitespace are not in the safe `--fix` set.
- Mapping a root npm script is not a TDD unit.

## PROCESS IMPROVEMENTS

GPT 5.6 preflight FAILed TDD encoding on this wiring. Operator overruled. Spec gap filed as [Texarkanine/.cursor-rules#116](https://github.com/Texarkanine/.cursor-rules/issues/116): “if something executes it, it is in scope” plus prose-only exclusions let lint-script wiring look like product behavior.

## TECHNICAL IMPROVEMENTS

None. Enabling extra Oxlint categories (style/suspicious/…) is a later choice, not this bind.

## NEXT STEPS

File follow-up issues for leftover correctness errors (80 in 8 packages; `plugin-agentsmd` is clean). Do not add lint to CI until those are gone if a green `pnpm lint` is desired.
