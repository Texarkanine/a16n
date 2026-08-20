# Current Task: issue-156 plugin-claude unused-vars

**Complexity:** Level 1

## Build

- [x] Inventory: `pnpm exec oxlint packages/plugin-claude` reported 40 `eslint(no-unused-vars)` — unused type/value imports from a copy-pasted models import list, unused `import * as path` in `emit-source-items.test.ts`, and three unused `const result` bindings
- [x] Fix: drop unused import specifiers; drop unused `path` import; change unused `const result = await claudePlugin.emit(...)` to `await claudePlugin.emit(...)` only (do not strip `result` from tests that assert on `written`/`warnings`)
- [x] Files: `emit-global-prompt.test.ts`, `emit-simple-agent-skill.test.ts`, `emit-file-rule.test.ts`, `emit-agent-ignore.test.ts`, `emit-agent-skill-io.test.ts`, `emit-manual-prompt.test.ts`, `emit-mixed-models.test.ts`, `emit-source-items.test.ts`, `emit-filename-case.test.ts`
- [x] `pnpm exec oxlint packages/plugin-claude` clean
- [x] `pnpm --filter @a16njs/plugin-claude test` — 18 files, 197 tests passed (after `turbo run build --filter=@a16njs/plugin-claude`)

## QA

- [ ] Semantic review pending
