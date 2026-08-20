# Current Task: issue-156 plugin-claude unused-vars

**Complexity:** Level 1

## Build

- [x] Inventory: `pnpm exec oxlint packages/plugin-claude` reported 40 `eslint(no-unused-vars)` — unused type/value imports from a copy-pasted models import list, unused `import * as path` in `emit-source-items.test.ts`, and three unused `const result` bindings
- [x] Fix: drop unused import specifiers; drop unused `path` import; change unused `const result = await claudePlugin.emit(...)` to `await claudePlugin.emit(...)` only (do not strip `result` from tests that assert on `written`/`warnings`)
- [x] Files: `emit-global-prompt.test.ts`, `emit-simple-agent-skill.test.ts`, `emit-file-rule.test.ts`, `emit-agent-ignore.test.ts`, `emit-agent-skill-io.test.ts`, `emit-manual-prompt.test.ts`, `emit-mixed-models.test.ts`, `emit-source-items.test.ts`, `emit-filename-case.test.ts`
- [x] `pnpm exec oxlint packages/plugin-claude` clean
- [x] `pnpm --filter @a16njs/plugin-claude test` — 18 files, 197 tests passed (after `turbo run build --filter=@a16njs/plugin-claude`)

## QA

- [x] Semantic review complete — **PASS**
- [x] KISS/DRY/YAGNI: minimal import/result cleanup only; no new abstractions
- [x] Completeness: all 40 `eslint(no-unused-vars)` cleared across nine emit tests; oxlint exit 0; 197 tests pass
- [x] Regression: `const result` retained wherever asserted; only three bare-`await` conversions where `result` was unused
- [x] Integrity: no debug artifacts or session-introduced TODOs
- [x] Documentation: none required (test-only lint cleanup per brief)
