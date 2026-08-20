---
task_id: issue-156-plugin-claude-unused-vars
complexity_level: 1
date: 2026-08-20
status: completed
---

# TASK ARCHIVE: Clear leftover oxlint unused-vars in plugin-claude

## SUMMARY

Cleared 40 leftover `eslint(no-unused-vars)` findings in `@a16njs/plugin-claude` emit tests so `pnpm exec oxlint packages/plugin-claude` is clean. Follow-up to [#74](https://github.com/Texarkanine/a16n/issues/74) / [#155](https://github.com/Texarkanine/a16n/pull/155). Tracked as [#156](https://github.com/Texarkanine/a16n/issues/156). L1 normally skips archive; operator overrode and required this document.

## REQUIREMENTS

1. Clear the 40 unused-vars leftovers in nine `plugin-claude` emit tests ([issue #156](https://github.com/Texarkanine/a16n/issues/156)).
2. Keep existing package tests passing.
3. Do not enable extra Oxlint categories or add lint to CI.
4. Do not write change-detector tests; Oxlint plus existing package tests are the validation.

## IMPLEMENTATION

Hand-edited nine emit tests. Dropped unused `@a16njs/models` type/value import specifiers from a copy-pasted IR import list, dropped unused `import * as path` in `emit-source-items.test.ts`, and converted three unused `const result = await claudePlugin.emit(...)` bindings to bare `await` (`emit-global-prompt.test.ts` ×2, `emit-agent-skill-io.test.ts` ×1). Other `const result` bindings were kept because tests assert on `result.written` / `result.warnings`.

## TESTING

No new Vitest cases. `pnpm exec oxlint packages/plugin-claude` exit 0. `pnpm --filter @a16njs/plugin-claude test` — 18 files, 197 passed (after `turbo run build --filter=@a16njs/plugin-claude` so `@a16njs/models` dist existed). `/niko-qa` (composer-2.5) PASS; no code fixes.

## LESSONS LEARNED

- Emit tests share a copy-pasted full IR type import list; leftover unused-vars were almost entirely unused specifiers, not product code.
- Do not globally drop `const result = await emit`. Most of those bindings are asserted on; only three were unused.
- `oxlint --fix` does not clear unused-vars.

## PROCESS IMPROVEMENTS

L1 skips `/niko-reflect` and `/niko-archive`. This leftover wave needed an archive anyway so the parent L4 can close the sub-run — operator override was the right call. Worktree `pnpm --filter <pkg> test` needs a prior turbo build when `node_modules` is freshly installed.

## TECHNICAL IMPROVEMENTS

Trimming each emit test’s `@a16njs/models` import to only the types that file uses would reduce future unused-var drift. Out of scope for #156.

## NEXT STEPS

None for plugin-claude. Sibling leftover tickets (#157–#161) remain. Do not add lint to CI until those are gone if a green root `pnpm lint` is desired.
