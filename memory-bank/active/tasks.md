# Task: Oxlint Unused-Vars Cleanup for Models and Engine

* Task ID: oxlint-160-models-engine
* Complexity: Level 2
* Type: lint cleanup

Clear the eight `eslint(no-unused-vars)` findings Oxlint reports in `@a16njs/models` and `@a16njs/engine` (issue #160) without changing exported behavior, enabling extra Oxlint categories, adding lint to CI, or adding change-detector tests.

Confirmed diagnostics from `pnpm exec oxlint packages/models packages/engine` at plan time:

- `packages/models/test/agentskills-io.test.ts:10` — value import `extractSpecFields` unused
- `packages/models/test/agentskills-io.test.ts:13` — type import `ParsedSkill` unused
- `packages/models/test/version.test.ts:7` — type import `IRVersion` unused
- `packages/models/src/agentskills-io.ts:259` — catch parameter `error` unused in `readSkillFiles`
- `packages/engine/src/plugin-loader.ts:2` — type import `PluginRegistration` unused
- `packages/engine/test/plugin-discovery.test.ts:1` — value import `vi` unused
- `packages/engine/test/plugin-registry.test.ts:3` — type import `PluginRegistration` unused
- `packages/engine/test/transformation.test.ts:3` — type import `EmitResult` unused

## Test Plan (TDD)

The work does not add executable behavior. Oxlint is the failing assertion for each unused name. Existing Vitest suites are the regression net. Do not add tests that can only fail when someone edits an artifact.

### Behaviors to Verify

- Unused import removal: `pnpm exec oxlint <file>` reports the named unused identifier → after the edit, that diagnostic is gone and no new unused-vars appear in the file
- Unused catch binding: `readSkillFiles` still skips missing resources and still refuses path traversal → existing `packages/models/test/agentskills-io.test.ts` cases keep passing
- Plugin loader types: `PluginLoader.loadInstalled` / `resolveConflicts` signatures and conflict strategies are unchanged → existing `packages/engine/test/plugin-loader.test.ts` cases keep passing
- Package suites: `pnpm --filter @a16njs/models test` → pass
- Package suites: `pnpm --filter @a16njs/engine test` → pass
- Acceptance lint: `pnpm exec oxlint packages/models packages/engine` → exit 0, zero findings
- Edge: do not rename or drop exported functions, parameters, or public types; only unused local names and unused imports
- Edge: do not change `.oxlintrc.json`, CI workflows, or rule categories
- Edge: unused `__dirname` / `fileURLToPath` in `plugin-discovery.test.ts` are out of issue scope because Oxlint does not report them — leave them alone

### Test Infrastructure

- Framework: Vitest (`vitest run` via each package `test` script)
- Test location: `packages/models/test/`, `packages/engine/test/`
- Conventions: `*.test.ts` beside the package; `describe`/`it`/`expect`; no new suites
- New test files: none
- Lint assertion: root `pnpm exec oxlint` (Oxlint 1.79.0, correctness category only)

## Implementation Plan

1. Clear unused imports in `packages/models/test/agentskills-io.test.ts`
   - Files: `packages/models/test/agentskills-io.test.ts`
   - Red: run `pnpm exec oxlint packages/models/test/agentskills-io.test.ts` and confirm both unused-import diagnostics
   - Edit: drop `extractSpecFields` from the value import list; drop `type ParsedSkill` from the type import list; keep `ParsedSkillFrontmatter` and the used runtime imports
   - Green: re-run oxlint on that file; both diagnostics gone
2. Clear unused type import in `packages/models/test/version.test.ts`
   - Files: `packages/models/test/version.test.ts`
   - Red: run `pnpm exec oxlint packages/models/test/version.test.ts` and confirm `IRVersion` unused
   - Edit: remove `type IRVersion` from the import; keep `parseIRVersion`, `areVersionsCompatible`, `getCurrentVersion`, `CURRENT_IR_VERSION`
   - Green: re-run oxlint on that file
3. Clear unused catch binding in `readSkillFiles`
   - Files: `packages/models/src/agentskills-io.ts`
   - Red: run `pnpm exec oxlint packages/models/src/agentskills-io.ts` and confirm catch parameter `error` at line 259
   - Edit: change only that `catch (error)` to optional-catch `catch {`; leave the comment and `continue`; do not touch the other two `catch (error)` blocks that use `error`
   - Green: re-run oxlint on that file; then run `pnpm --filter @a16njs/models test` so skip-missing and path-traversal cases still pass
4. Clear unused type import in `PluginLoader`
   - Files: `packages/engine/src/plugin-loader.ts`
   - Red: run `pnpm exec oxlint packages/engine/src/plugin-loader.ts` and confirm `PluginRegistration` unused
   - Edit: import only `type { PluginRegistrationInput }`; do not change constructor, getters, `loadInstalled`, or `resolveConflicts`
   - Green: re-run oxlint on that file; then run `pnpm --filter @a16njs/engine test` so loader/registry discovery behavior is unchanged
5. Clear unused `vi` import in plugin-discovery tests
   - Files: `packages/engine/test/plugin-discovery.test.ts`
   - Red: run `pnpm exec oxlint packages/engine/test/plugin-discovery.test.ts` and confirm `vi` unused
   - Edit: remove `vi` from the vitest import; do not delete `__dirname` / `fileURLToPath`
   - Green: re-run oxlint on that file
6. Clear unused type import in plugin-registry tests
   - Files: `packages/engine/test/plugin-registry.test.ts`
   - Red: run `pnpm exec oxlint packages/engine/test/plugin-registry.test.ts` and confirm `PluginRegistration` unused
   - Edit: delete the unused `import type { PluginRegistration }` line
   - Green: re-run oxlint on that file
7. Clear unused type import in transformation tests
   - Files: `packages/engine/test/transformation.test.ts`
   - Red: run `pnpm exec oxlint packages/engine/test/transformation.test.ts` and confirm `EmitResult` unused
   - Edit: drop `EmitResult` from the type import; keep `A16nPlugin`, `AgentCustomization`, `WrittenFile`
   - Green: re-run oxlint on that file
8. Acceptance verification
   - Files: none additional
   - Run `pnpm exec oxlint packages/models packages/engine` (must be clean)
   - Run `pnpm --filter @a16njs/models test` and `pnpm --filter @a16njs/engine test` (must pass)
   - If a package test run already passed after its src edit and no further src edits landed, a second full run of that package is still required here as the done-when gate

## Technology Validation

No new technology - validation not required

## Dependencies

- Existing root Oxlint (`.oxlintrc.json`, correctness only)
- Existing Vitest suites in models and engine
- Worktree `node_modules` (already installed)

## Challenges & Mitigations

- Accidental behavior change in `readSkillFiles`: edit only the unused catch binding; keep skip-on-error; rely on existing missing-file and traversal tests
- Over-deleting imports that are used: drop only the eight named identifiers Oxlint reported
- Expanding into unused locals Oxlint does not report (`__dirname` in `plugin-discovery.test.ts`): leave them; they are outside issue #160's eight findings
- Touching exported signatures to "fix" unused names: never; unused imports and one unused catch param are sufficient
- Enabling more Oxlint rules or adding CI lint: out of scope; do not edit `.oxlintrc.json` or workflows

## Pre-Mortem

- The plan treats unused-name cleanup as a feature that needs new tests, and the suite becomes change-detectors: already forbidden; Oxlint plus existing tests are the only gates
- The catch edit starts logging or rethrowing, which changes skip-missing behavior: already covered by Challenge 1
- A src import cleanup accidentally rewrites `PluginLoader` public types: already covered by Challenge 4; step 4 forbids signature edits
- The worktree is validated without install and oxlint/tests cannot run: install already done; step 8 is the gate

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
