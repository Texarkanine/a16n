# Task: M7 — Split plugin-cursor discover.test.ts

- Task ID: slobac-audit-remediation-m7
- Complexity: Level 2
- Type: Structural test refactor (monolithic file split; no production or behavioral change)

Split `packages/plugin-cursor/test/discover.test.ts` into domain-focused Vitest modules following M5 (`plugin-claude`): `test-support/discover-helpers.ts` with `discoverFixturesDir(importMetaUrl)`, plus **one file per root-level** `describe` in the monolith (**nine** suites — matches Finding 20 / milestone wording):

| New file | Source suite |
|----------|----------------|
| `discover-cursor-plugin.test.ts` | `describe('Cursor Plugin Discovery', ...)` |
| `discover-mdc-parsing.test.ts` | `describe('MDC Parsing', ...)` |
| `discover-file-rule.test.ts` | `describe('FileRule Discovery', ...)` |
| `discover-simple-agent-skill-rules.test.ts` | `describe('SimpleAgentSkill Discovery', ...)` |
| `discover-classification-priority.test.ts` | `describe('Classification Priority', ...)` |
| `discover-agent-ignore.test.ts` | `describe('AgentIgnore Discovery', ...)` |
| `discover-skills.test.ts` | `describe('Cursor Skills Discovery', ...)` |
| `discover-commands.test.ts` | `describe('ManualPrompt Discovery (commands)', ...)` |
| `discover-agent-skill-io.test.ts` | `describe('AgentSkillIO Discovery', ...)` |

Then remove `discover.test.ts`. **Parity:** **66** discover `it` cases (monolith actual; pre-plan “63” was a miscount), **137** tests in `@a16njs/plugin-cursor` unchanged.

## Test Plan (TDD)

### Behaviors to Verify

This milestone adds **no new behaviors**. Verification is **parity and regression**:

- **Discover parity:** Exactly **66** `it(` cases in the discover modules must remain, with bodies unchanged (moved only).
- **Package parity:** Total test count for `@a16njs/plugin-cursor` stays **137** (baseline from post-M6 monorepo state).
- **Repo parity:** Full `pnpm test` (Turbo) remains green.
- **Per test:** Each moved case still asserts the same outcomes for the same fixtures (e.g. `cursorPlugin.discover(root)` return shape, warning codes, `relativeDir`, command skip rules, AgentSkillIO `files` / `resources`).

### Edge / regression focus

- Fixture paths: every file must resolve `fixtures/` via `discoverFixturesDir(import.meta.url)` (files move to `test/` root or nested `test/` paths — helper must match Claude pattern).
- No duplicate `describe` blocks after split (never run the same `it` twice).
- Imports: each new file imports `cursorPlugin` from `../src/index.js` (adjust relative depth if ever nested — **not nested** for this layout).

### Test Infrastructure

- **Framework:** Vitest (package `vitest.config.ts`).
- **Test location:** `packages/plugin-cursor/test/`.
- **Conventions:** ESM, existing `emit-*.test.ts` / M6 layout; new `discover-*.test.ts` aligns with `packages/docs/docs/plugin-development/index.md` (“discover-\*.test.ts”).
- **New files:** `test-support/discover-helpers.ts` plus the nine `discover-*.test.ts` modules listed above.
- **Removed:** `discover.test.ts`.

### TDD ordering note (refactor)

There is **no new production code**. The required order is: **establish baselines → move tests → prove parity**. Each implementation step below ends with **running tests** before the next cut.

## Implementation Plan

1. **Baseline gate**
   - **Action:** From repo root, run `pnpm test` (or package-scoped equivalent) and record green. Count discover `it` in `discover.test.ts` (expect **66**) and total `it` in `packages/plugin-cursor/test/**/*.ts` (expect **137**).
   - **Files:** none changed.
   - **Verify:** Suite green; counts recorded for comparison after split.

2. **Add `discoverFixturesDir` helper**
   - **Files:** `packages/plugin-cursor/test/test-support/discover-helpers.ts` (new).
   - **Changes:** Copy structure from `packages/plugin-claude/test/test-support/discover-helpers.ts` (path join + `fileURLToPath`).
   - **Verify:** `pnpm test` still green (no tests depend on this file yet).

3. **Extract `discover-mdc-and-ignore.test.ts`**
   - **Files:** `discover-mdc-and-ignore.test.ts` (new); `discover.test.ts` (shrink — remove the `Cursor Plugin Discovery` block only).
   - **Changes:** New file: standard imports (`vitest`, `path`, plugin, models types as today), `const fixturesDir = discoverFixturesDir(import.meta.url)`, paste **entire** `describe('Cursor Plugin Discovery', ...)` including inner `describe`s and loose `it(...)` siblings. Remove `const __dirname` / `fixturesDir` pattern from the cut code; use shared `fixturesDir`.
   - **Verify:** `pnpm test` green; discover `it` sum across `discover.test.ts` + new file still **66**; package total still **137**.

4. **Extract `discover-skills.test.ts`**
   - **Files:** `discover-skills.test.ts` (new); `discover.test.ts` (remove `Cursor Skills Discovery` block).
   - **Changes:** Same import/fixture pattern as step 3.
   - **Verify:** Same parity checks as step 3.

5. **Extract `discover-commands.test.ts`**
   - **Files:** `discover-commands.test.ts` (new); `discover.test.ts` (remove `ManualPrompt Discovery (commands)` block).
   - **Changes:** Same pattern.
   - **Verify:** Same parity checks.

6. **Extract remaining suites** (`discover-mdc-parsing`, `discover-file-rule`, `discover-simple-agent-skill-rules`, `discover-classification-priority`, `discover-agent-ignore`, `discover-agent-skill-io`) **or** one atomic commit moving all nine suites — same helper/import pattern.
   - **Verify:** Discover `it` total **66** across nine new files; package **137**; `pnpm test` green repo-wide; delete `discover.test.ts`.

7. **Docs / references**
   - **Files:** Grep for `discover.test.ts` under `packages/`; update any stale references (unlikely — M6 emit split precedent). `plugin-development` doc already prescribes `discover-*.test.ts` — **no change unless** a path literal names the monolith.
   - **Verify:** No broken contributor references.

## Technology Validation

No new technology — validation not required.

## Dependencies

- Vitest, existing `@a16njs/models` types used by tests today.

## Challenges & Mitigations

- **Large first suite:** `Cursor Plugin Discovery` mixes nested `describe`s and top-level `it`s; move the **entire** outer `describe` atomically so structure stays valid.
- **Wrong fixture root:** If a new file uses `import.meta.url` incorrectly, paths break → mitigate by sharing the exact `discoverFixturesDir` pattern from Claude.
- **Double-running tests:** Mitigate by deleting each block from the monolith in the same commit as adding it to the new file.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA — PASS (2026-05-02)
