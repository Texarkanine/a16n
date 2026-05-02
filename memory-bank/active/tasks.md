# Task: M5 — Split plugin-claude discover.test.ts

* Task ID: slobac-audit-remediation-m5
* Complexity: Level 2
* Type: Test suite restructuring (monolithic file split)

Split `packages/plugin-claude/test/discover.test.ts` into seven domain-aligned Vitest files. Preserve fixture paths (`test/fixtures/...`), imports, and all assertions. No changes under `packages/plugin-claude/src/`.

## Test Plan (TDD)

### Behaviors to Verify

Each existing test case is preserved verbatim per domain file; behaviors are unchanged from the current suite. Representative coverage (non-exhaustive):

- **[CLAUDE.md discovery]**: `claudePlugin.discover(root)` on `claude-basic` / `claude-nested` / `claude-empty` fixtures → correct `GlobalPrompt` items, metadata (`nested`, `depth`, `name`), empty project returns no items.
- **[SimpleAgentSkill]**: Skills without hooks → `SimpleAgentSkill` with `description`, content, correct `sourcePath`; hook skills skipped with warnings.
- **[AgentIgnore]**: `settings.json` `permissions.deny` Read rules → patterns; non-Read ignored; missing file; combined CLAUDE + AgentIgnore discovery.
- **[ManualPrompt]**: `disable-model-invocation: true` → `ManualPrompt`; regular skills remain `SimpleAgentSkill`.
- **[Negative ManualPrompt]**: Plugin discovery never surfaces `ManualPrompt` in the enumerated negative cases; allowed types list unchanged.
- **[AgentSkillIO]**: Hook skills skipped; complex skills with extra files → `AgentSkillIO` shape (files map, resources, recursion); simple vs mixed classification; backward-compat hook skip behavior.
- **[Rules]**: `.claude/rules` file discovery, nesting, `relativeDir`, hidden dir skip, path normalization; frontmatter paths / classification (`GlobalPrompt` vs `FileRule`); gray-matter edge cases; integration with CLAUDE.md and skills; unique IDs and source paths.

### Edge / regression cases

- All cases currently in `discover.test.ts` (including Finding 12 historically: nested rules / `.git` skip title accuracy post-M1) must remain covered with the same assertions.
- **Parity gate:** Count of `it(` in discover tests = **58** before and after; total `it(` in `packages/plugin-claude/test/**/*.test.ts` = **144** after deleting the monolith.

### Test Infrastructure

- Framework: Vitest (package `vitest.config.ts`).
- Test location: `packages/plugin-claude/test/`.
- Conventions: Match M4 — `discover-<domain>.test.ts`, package-local `test-support/` only if a helper reduces duplicated `fixturesDir` setup.
- New test files: seven listed above; `discover.test.ts` removed after migration.

## Implementation Plan

1. **Baseline**
   - Files: (read-only) `packages/plugin-claude/test/discover.test.ts`
   - Changes: Run `pnpm --filter @a16njs/plugin-claude test`; confirm green. Record discover test count 58 and package total 144 (from grep or test summary).

2. **Optional helper (recommended for consistency with M4)**
   - Files: `packages/plugin-claude/test/test-support/discover-helpers.ts` (new); then each new discover test file
   - Changes: Export `discoverFixturesDir(importMetaUrl: string): string` as `path.join(path.dirname(fileURLToPath(importMetaUrl)), 'fixtures')`. Rewire split files to use it instead of duplicating `__dirname` + `fixturesDir` in all seven files. If helper is skipped, duplicate the two-line `fileURLToPath` + `path.join` pattern in each file (acceptable per YAGNI).

3. **Extract domain file 1 — CLAUDE.md plugin discovery**
   - Files: `packages/plugin-claude/test/discover-claude-md.test.ts` (new)
   - Changes: Move `describe('Claude Plugin Discovery', ...)` block with imports (`vitest`, `path`, `fileURLToPath`, `claudePlugin`, `CustomizationType`). Run `pnpm --filter @a16njs/plugin-claude test` — must stay green alongside remaining monolith (duplicate tests briefly) **OR** follow one-shot extraction: generate all seven files and delete monolith in one commit after local verification — prefer **incremental green**: after this step, either keep both monolith and new file temporarily with duplicate tests (BAD - double count) — **Correction**: For split, the correct incremental approach is: copy block to new file, remove from monolith, run tests, repeat. Do not run duplicate `it` names in two files.

   **Ordered extraction (TDD-safe):** For each step: (a) create new file with moved `describe` + imports, (b) delete that block from `discover.test.ts`, (c) `pnpm --filter @a16njs/plugin-claude test` until green.

4. **Extract domain file 2 — SimpleAgentSkill**
   - Files: `discover-simple-agent-skill.test.ts` (new); trim `discover.test.ts`
   - Changes: Move `describe('Claude SimpleAgentSkill Discovery', ...)`. Run package tests.

5. **Extract domain file 3 — AgentIgnore**
   - Files: `discover-agent-ignore.test.ts` (new); trim `discover.test.ts`
   - Changes: Move `describe('Claude AgentIgnore Discovery', ...)`. Run package tests.

6. **Extract domain file 4 — ManualPrompt**
   - Files: `discover-manual-prompt.test.ts` (new); trim `discover.test.ts`
   - Changes: Move `describe('Claude ManualPrompt Discovery', ...)`. Run package tests.

7. **Extract domain file 5 — Never ManualPrompt**
   - Files: `discover-never-manual-prompt.test.ts` (new); trim `discover.test.ts`
   - Changes: Move `describe('Claude Plugin Never Discovers ManualPrompt', ...)`. Run package tests.

8. **Extract domain file 6 — AgentSkillIO**
   - Files: `discover-agent-skill-io.test.ts` (new); trim `discover.test.ts`
   - Changes: Move `describe('AgentSkillIO Discovery', ...)`. Run package tests.

9. **Extract domain file 7 — Rules**
   - Files: `discover-rules.test.ts` (new); trim `discover.test.ts`
   - Changes: Move `describe('Claude Rules Discovery', ...)`. Run package tests.

10. **Remove monolith**
    - Files: delete `packages/plugin-claude/test/discover.test.ts`
    - Changes: File must be empty/deleted; no stray imports. Run `pnpm --filter @a16njs/plugin-claude test`.

11. **Monorepo verification**
    - Changes: `pnpm test` from repo root (Turbo); confirm downstream CLI integration still green.

12. **Documentation sweep**
    - Files: `packages/docs/docs/plugin-development/index.md`, `CONTRIBUTING.md`, grep `discover.test.ts`
    - Changes: Update only if a *tour* reference incorrectly implies a single file path must exist; leave template tree as M4 did if it remains prescriptive for new plugins.

## Technology Validation

No new technology — validation not required.

## Dependencies

- Vitest, existing fixtures under `packages/plugin-claude/test/fixtures/`
- `@a16njs/models` types already imported in monolith

## Challenges & Mitigations

- **Import drift:** Each new file needs full imports used by its block (`WarningCode`, item types). Mitigation: copy import list from monolith header and prune only if TypeScript/lint complains.
- **Accidental duplicate or dropped `it`:** Mitigation: parity gate (`it(` count 58 in discover files; 144 package total).
- **Parallel Vitest:** Discover tests use read-only fixtures only; no shared mutable temp state (unlike emit). No new isolation needed unless a test is found writing to fixture dirs (none expected).

## Preflight (2026-05-02)

- **Result:** PASS
- **TDD:** Each implementation step is a test migration with immediate `pnpm --filter @a16njs/plugin-claude test`; monolith deletion only after all blocks moved.
- **Advisory:** Optional `discover-helpers.ts` for fixtures path; batch/script extraction acceptable if parity gates pass (M4 precedent).

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build (2026-05-02): seven `discover-*.test.ts` files + `test-support/discover-helpers.ts`; monolith removed; parity **58** / **144** `it(`; `pnpm test` green)
- [ ] QA
