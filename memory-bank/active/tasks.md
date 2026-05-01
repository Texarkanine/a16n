# Task: SLOBAC Audit Remediation — M4 (Split plugin-claude emit.test.ts)

* Task ID: slobac-audit-remediation-m4
* Complexity: Level 2
* Type: simple enhancement (structural test reorganization — monolithic-test-file split)

Split `packages/plugin-claude/test/emit.test.ts` (2471 lines, 10 top-level `describe` blocks) into domain-specific Vitest files along the behavior-domain boundaries prescribed by SLOBAC audit Finding 14. Extract shared emit setup (per-suite temp directory helper + claude-emit boilerplate) into a package-local `test-support/emit-helpers.ts`. Structural reorganization only: no assertion bodies change, no SUT code changes.

## Test Plan (TDD)

### Behaviors to Verify

Because this is a pure structural reorganization of an already-passing test suite, "tests" here means the existing tests must continue to pass unchanged. Verification behaviors:

- **Baseline green**: `pnpm --filter @a16njs/plugin-claude test` passes before the split — confirms the starting state.
- **Post-extraction green**: After introducing `test-support/emit-helpers.ts` and rewiring the monolith's single module-level `tempDir` to the helper, the unchanged monolith still passes.
- **Post-split green**: After replacing the monolith with 9 domain-split files, `pnpm --filter @a16njs/plugin-claude test` passes with the **same number of total tests** as the baseline (no test lost in translation).
- **Post-monolith-deletion green**: After deleting `emit.test.ts`, the suite passes and the split files fully cover the original test count.
- **Full monorepo green**: `pnpm test` passes end-to-end (cross-package integrity check — `plugin-claude` is depended on by `cli`'s integration tests).
- **Parallel-safe isolation**: Each split file uses its own `.temp-emit/<slug>/` root via `suiteTempDir()`; two files running in parallel cannot clobber each other's workspace.
- **Edge — empty input describe preserved**: The `'empty input'` describe (originally nested inside `'Claude Plugin Emission'`, lines 270–279) lands in `emit-global-prompt.test.ts` (its parent domain) so no test is orphaned.
- **Edge — Mixed Model Emission preserved**: Top-level `'Mixed Model Emission'` (line 792) — which is not explicitly named in the audit's 8-file suggestion — lands in its own `emit-mixed-models.test.ts` to avoid wedging a cross-cutting domain into a type-specific file.
- **Edge — FileRule Empty Globs Validation merges with FileRule**: The top-level `'Claude FileRule Empty Globs Validation'` (line 672) is a validation sub-domain of FileRule emission; it joins `emit-file-rule.test.ts` (consistent with the audit naming collapsing them).

### Test Infrastructure

- Framework: Vitest (per `packages/plugin-claude/vitest.config.ts`, existing pattern).
- Test location: `packages/plugin-claude/test/`. Helpers go in `packages/plugin-claude/test/test-support/` (package-local; mirrors the M2/M3 pattern established in `packages/cli/test/test-support/`).
- Conventions observed:
    - Top-level describes form natural behavior domains.
    - File naming for splits follows audit prescription: `emit-<domain>.test.ts`.
    - Imports from `@a16njs/models` and `../src/index.js` (Claude plugin) preserved verbatim per split file.
    - Temp-dir pattern: monolith uses a single module-level `tempDir` at `packages/plugin-claude/test/.temp-emit-test`. Split replaces this with `suiteTempDir(import.meta.url, '<slug>')` → `packages/plugin-claude/test/.temp-emit/<slug>/`, mirroring the M3 `suiteTempDir` signature.
- New test files (9):
    - `packages/plugin-claude/test/emit-global-prompt.test.ts`
    - `packages/plugin-claude/test/emit-file-rule.test.ts` (folds Empty Globs Validation describe)
    - `packages/plugin-claude/test/emit-simple-agent-skill.test.ts`
    - `packages/plugin-claude/test/emit-mixed-models.test.ts`
    - `packages/plugin-claude/test/emit-agent-ignore.test.ts`
    - `packages/plugin-claude/test/emit-manual-prompt.test.ts`
    - `packages/plugin-claude/test/emit-source-items.test.ts`
    - `packages/plugin-claude/test/emit-agent-skill-io.test.ts`
    - `packages/plugin-claude/test/emit-filename-case.test.ts`
- New helper: `packages/plugin-claude/test/test-support/emit-helpers.ts` — exports `suiteTempDir(importMetaUrl, slug)` and `withTempDir(tempDir)` (or equivalent beforeEach/afterEach registrar). Optional re-exports of common `@a16njs/models` types only if duplication proves noisy; otherwise leave per-file imports alone (prefer clarity over DRY here).

## Implementation Plan

Ordered, TDD-consistent. Each step ends with a green `pnpm --filter @a16njs/plugin-claude test` run.

1. **Baseline verification**
   - Files: none modified.
   - Changes: Run `pnpm --filter @a16njs/plugin-claude test` and capture test count + pass state. This is the invariant target for every downstream step.

2. **Create package-local `test-support/emit-helpers.ts`**
   - Files: `packages/plugin-claude/test/test-support/emit-helpers.ts` (new).
   - Changes: Export:
     - `suiteTempDir(importMetaUrl: string | URL, slug: string): string` — returns `<test-dir>/.temp-emit/<slug>/`. Same shape as M3's `suiteTempDir` in `packages/cli/test/test-support/integration-helpers.ts`.
     - Keep interface minimal; if a reusable beforeEach/afterEach registrar helps readability, add `registerEmitTempDir(tempDir: string)` that wraps `fs.mkdir` + `fs.rm` calls. Otherwise, split files register their own `beforeEach`/`afterEach` inline (matches monolith style).

3. **Rewire the existing monolith to use the helper**
   - Files: `packages/plugin-claude/test/emit.test.ts`.
   - Changes: Replace the module-level `const tempDir = path.join(__dirname, '.temp-emit-test');` with `const tempDir = suiteTempDir(import.meta.url, 'monolith');` imported from the new helper. Run the suite — still green, still identical test count. This isolates helper correctness from the split operation.

4. **Split — `emit-global-prompt.test.ts`**
   - Files: new split file; `emit.test.ts` (remove the moved describes).
   - Changes: Move the `'Claude Plugin Emission'` top-level describe (lines 23–279, includes nested `'single GlobalPrompt'`, `'multiple GlobalPrompts'`, `'empty input'`) into the new file. Use `suiteTempDir(import.meta.url, 'global-prompt')`. Preserve imports verbatim (drop unused types). Run the suite — green.

5. **Split — `emit-file-rule.test.ts`**
   - Files: new split file; `emit.test.ts` (remove the moved describes).
   - Changes: Move `'Claude FileRule Emission'` (lines 281–494) **and** `'Claude FileRule Empty Globs Validation'` (lines 672–791) into the new file as two sibling top-level describes (audit merges them under one filename). `suiteTempDir(import.meta.url, 'file-rule')`. Run — green.

6. **Split — `emit-simple-agent-skill.test.ts`**
   - Files: new split file; monolith shrinks.
   - Changes: Move `'Claude SimpleAgentSkill Emission'` (lines 495–671). `suiteTempDir(import.meta.url, 'simple-agent-skill')`. Run — green.

7. **Split — `emit-mixed-models.test.ts`**
   - Files: new split file; monolith shrinks.
   - Changes: Move `'Mixed Model Emission'` (lines 792–857). `suiteTempDir(import.meta.url, 'mixed-models')`. Run — green.

8. **Split — `emit-agent-ignore.test.ts`**
   - Files: new split file; monolith shrinks.
   - Changes: Move `'Claude AgentIgnore Emission'` (lines 858–1117). `suiteTempDir(import.meta.url, 'agent-ignore')`. Run — green.

9. **Split — `emit-manual-prompt.test.ts`**
   - Files: new split file; monolith shrinks.
   - Changes: Move `'Claude ManualPrompt Emission'` (lines 1118–1441). `suiteTempDir(import.meta.url, 'manual-prompt')`. Run — green.

10. **Split — `emit-source-items.test.ts`**
    - Files: new split file; monolith shrinks.
    - Changes: Move `'Claude Plugin - sourceItems tracking'` (lines 1442–1642). `suiteTempDir(import.meta.url, 'source-items')`. Run — green.

11. **Split — `emit-agent-skill-io.test.ts`**
    - Files: new split file; monolith shrinks.
    - Changes: Move `'Claude AgentSkillIO Emission'` (lines 1643–2188). `suiteTempDir(import.meta.url, 'agent-skill-io')`. Run — green.

12. **Split — `emit-filename-case.test.ts`**
    - Files: new split file; monolith shrinks.
    - Changes: Move `'filename case preservation'` (lines 2189–2471). `suiteTempDir(import.meta.url, 'filename-case')`. Run — green.

13. **Delete the monolith**
    - Files: `packages/plugin-claude/test/emit.test.ts` (deleted).
    - Changes: At this point the monolith has no remaining describes — delete the file. Run `pnpm --filter @a16njs/plugin-claude test` and confirm total test count matches the baseline from step 1.

14. **Full-suite verification**
    - Files: none modified.
    - Changes: Run `pnpm test` at the repo root. Confirms no cross-package regression (notably `packages/cli` integration tests that exercise the Claude plugin end-to-end).

15. **Documentation sweep**
    - Files: `CONTRIBUTING.md`, `packages/plugin-claude/README.md` (if it references `emit.test.ts`).
    - Changes: Grep for `emit.test.ts` across tracked docs. If any reference names the monolith as a point of entry, update the reference to the new split layout or remove the reference. Per the M3 reflection, `CONTRIBUTING.md` had no references to tear down — this step may be a no-op, which is fine.

## Technology Validation

No new technology — validation not required. All changes are within the existing Vitest/pnpm/Turborepo stack already validated by M1/M2/M3.

## Dependencies

- M3 is complete and landed on `slobac-audit-5` (current branch).
- The pattern established by M2 (`packages/cli/test/test-support/cli-runner.ts`) and M3 (`packages/cli/test/test-support/integration-helpers.ts` — specifically `suiteTempDir`) is the blueprint for `emit-helpers.ts`.
- No external dependency changes; no plugin-side source changes in `packages/plugin-claude/src/`.

## Challenges & Mitigations

- **Challenge**: Misclassifying a nested describe during the move (e.g., orphaning `'empty input'` from its GlobalPrompt parent). **Mitigation**: Explicit test-count assertion after every step; also the byline-range mapping in the Implementation Plan is derived directly from the `describe(` grep at column 0 and nested indented describes.
- **Challenge**: Parallel test execution colliding on `.temp-emit/` roots. **Mitigation**: Per-suite slug under a single `.temp-emit/` parent (one dir per split file); Vitest runs each file in its own worker by default, and M3 proved the `suiteTempDir` pattern works under this same runner.
- **Challenge**: Imports drift — a split file imports a type it no longer uses. **Mitigation**: After each split step, re-run `pnpm --filter @a16njs/plugin-claude typecheck` (or rely on TypeScript failures surfaced by `pnpm test`, which depends on `build`). Trim unused imports per file, same as M3.
- **Challenge**: `'Mixed Model Emission'` placement — not in audit's suggested 8 filenames. **Mitigation**: Create `emit-mixed-models.test.ts` (9th file). Documented as an explicit deviation in the plan; discussed in reflection. The audit's prescription was representative, not exhaustive; splitting a cross-cutting describe into its own file is consistent with the audit's stated principle of "split by behavior domain".
- **Challenge**: Audit Finding 13 (`emit.test.ts` line 1783 body-comment citing task ID) was already remediated in M1 via rename/body-comment edits — confirm with a read of the current body comment around what will become `emit-agent-skill-io.test.ts` in step 11. If any deliverable-fossil residue shows up in the split output, flag it during QA rather than sneaking a rename into M4 (scope discipline).
- **Challenge**: Reflection reminds us not to touch `milestones.md`. **Mitigation**: Do not advance the L4 milestone during this sub-run; `/niko` Step 2a owns that on the next re-entry.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA
