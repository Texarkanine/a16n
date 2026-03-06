# Task: Launch Readiness Polish

* Task ID: launch-readiness
* Complexity: Level 3
* Type: polish / bug fix / documentation

Fix critical issues, clean up garbage tests, improve first-impression UX, and polish the README before publicly announcing a16n.

## Component Analysis

### Affected Components

- **`packages/plugin-claude/src/emit.ts`**: AgentSkillIO emission → add path traversal validation for resource filenames (security fix)
- **`packages/cli/src/commands/convert.ts`**: git-ignore conflict routing → replace `any` types with proper interfaces; improve engine error handling for unknown plugins
- **`packages/cli/src/output.ts`**: Warning formatting → no changes needed (already supports suggestions)
- **`packages/cli/src/index.ts`**: Commander program setup → no structural changes needed (error is caught in convert.ts)
- **`packages/cli/test/cli.test.ts`**: Stubbed test bodies → implement or delete 11 empty tests
- **`packages/cli/package.json`**: Missing `engines` field
- **`packages/docs/docs/plugin-development/index.md`**: Broken link to `/plugin-cursorrules`
- **`packages/docs/docs/intro.md`**: "CLI Reference" link points to `/cli` (overview) instead of reference
- **`README.md`**: Pitch wording and badge additions
- **`CONTRIBUTING.md`** (new): Referenced but doesn't exist

### Cross-Module Dependencies

- `plugin-claude/emit.ts` ← `plugin-cursor/emit.ts`: The fix involves porting path traversal checks from cursor to claude. No runtime dependency — just copying the validation pattern.
- `cli/commands/convert.ts` ← `@a16njs/models`: Need to import `AgentCustomization` type to replace `any`.
- `cli/test/cli.test.ts` ← `cli/commands/convert.ts`: Stubbed tests exercise the git-ignore conflict and `--if-gitignore-conflict` flag functionality in convert.

### Boundary Changes

- None. No public API, interface, or schema changes.

## Open Questions

None — implementation approach is clear for all items. The creative phase (see `memory-bank/active/creative/creative-launch-readiness.md`) already resolved the "what to fix" question. Each implementation item below has an unambiguous approach.

## Test Plan (TDD)

### Behaviors to Verify

#### Security Fix (plugin-claude)
- B1: `emitAgentSkillIO` rejects resource files with absolute paths → emits `Skipped` warning, does not write
- B2: `emitAgentSkillIO` rejects resource files with `..` in path → emits `Skipped` warning, does not write
- B3: `emitAgentSkillIO` rejects resource files that resolve outside skill directory → emits `Skipped` warning, does not write
- B4: `emitAgentSkillIO` accepts valid resource filenames (including nested like `resources/helper.sh`) → writes normally
- B5: Existing AgentSkillIO integration tests still pass

#### Stubbed Tests (cli.test.ts) — Implement or Delete Decision
The 11 stubbed tests fall into two groups:

**Group A — sourceItems conflict detection (CR-10)**: 4 tests
- These test the `handleGitIgnoreMatch` function's behavior when outputs have mixed source git statuses
- The underlying code (`routeConflict`, `routeConflictSimple`) is implemented and already exercised by the existing passing match-mode tests
- **Decision: Implement.** These test distinct behaviors (Case 1: existing tracked output with ignored sources, Case 2: new output with unanimous status, Case 3: new output with conflicting sources) that aren't covered by the existing tests.

**Group B — `--if-gitignore-conflict` flag**: 7 tests (6 value-specific + 1 "only applies to match mode")
- These test the `--if-gitignore-conflict` flag with each of its values: `skip`, `ignore`, `exclude`, `hook`, `commit`, and a test that it only applies to match mode
- The flag and `applyConflictResolution` function are implemented, and the Commander `.choices()` validates values
- **Decision: Implement.** These test real functionality that the user will encounter. The "skip" (default) and conflict resolution behaviors are core to the git-ignore feature.

### Test Infrastructure

- Framework: Vitest
- Test location: `packages/cli/test/cli.test.ts` (CLI integration), `packages/plugin-claude/test/` (plugin unit)
- Conventions: fixture-based integration tests; CLI tests use `spawnSync` to run the actual CLI
- New test files: None. New tests go in existing files:
  - `packages/plugin-claude/test/emit.test.ts` (path traversal tests)
  - `packages/cli/test/cli.test.ts` (stubbed tests already exist, just need implementation)

### Integration Tests

- IT1: Existing `cursor-to-claude-complex-skill` fixture continues to pass (AgentSkillIO round-trip)
- IT2: Existing `roundtrip-cursor-complex` fixture continues to pass

## Implementation Plan

### Step 1: Security fix — path traversal in plugin-claude emit

**TDD cycle**: Write tests for B1-B4 in `packages/plugin-claude/test/emit.test.ts`, then implement the fix.

- **Files**: `packages/plugin-claude/src/emit.ts`, `packages/plugin-claude/test/emit.test.ts`
- **Changes in emit.ts**:
  - **Function signature** (line 176): Add `warnings: Warning[]` parameter to `emitAgentSkillIO`:
    ```typescript
    async function emitAgentSkillIO(
      skill: AgentSkillIO,
      root: string,
      dryRun: boolean,
      usedSkillNames: Set<string>,
      warnings: Warning[],
    ): Promise<WrittenFile[]> {
    ```
  - **Call site** (line 605): Pass `warnings` from the outer `emit()` scope:
    ```typescript
    const skillIOWritten = await emitAgentSkillIO(skillIO, root, dryRun, usedSkillNames, warnings);
    ```
  - **Resource file loop** (lines ~230-253): Before the `path.join(skillDir, filename)` line:
    1. Compute `const baseDir = path.resolve(skillDir);` (before the loop)
    2. Check `path.isAbsolute(filename)` — if true, push `WarningCode.Skipped` warning to `warnings`, `continue`
    3. Check `filename.includes('..')` — if true, push `WarningCode.Skipped` warning to `warnings`, `continue`
    4. Compute `const resolvedPath = path.resolve(skillDir, filename);` and check `!resolvedPath.startsWith(baseDir + path.sep) && resolvedPath !== baseDir` — if true, push warning, `continue`
    5. Add `await fs.mkdir(path.dirname(resolvedPath), { recursive: true });` for nested resource paths (guarded by `!dryRun`)
  - This matches the pattern in `packages/plugin-cursor/src/emit.ts` lines 345-380.
  - **Import**: Add `WarningCode` and `Warning` to imports if not already present.
- **Changes in emit.test.ts**: Add test cases for B1-B4 within the existing AgentSkillIO emission describe block.
- **Verification**: `pnpm --filter @a16njs/plugin-claude test`

### Step 2: Fix `any` types in convert.ts

**No TDD cycle needed** — this is a type-only refactor with no behavioral change. Existing tests cover the behavior.

- **Files**: `packages/cli/src/commands/convert.ts`
- **Changes**:
  1. Add import: `import type { AgentCustomization } from '@a16njs/models';` (alongside existing `WarningCode` import)
  2. Define local interface near `ConflictRouteContext` (~line 403):
     ```typescript
     interface SourceStatusEntry {
       source: AgentCustomization;
       ignoreSource: string | null;
     }
     ```
  3. Change `routeConflict` signature (line 414):
     - `ignoredSources: any[]` → `ignoredSources: SourceStatusEntry[]`
     - `trackedSources: any[]` → `trackedSources: SourceStatusEntry[]`
     - Remove `// eslint-disable-next-line @typescript-eslint/no-explicit-any` above the function
     - Remove `(s: any)` casts inside the function — TypeScript will infer correctly
  4. Change `routeConflictSimple` signature (line 437):
     - `sources: any[]` → `sources: AgentCustomization[]`
     - Remove `// eslint-disable-next-line @typescript-eslint/no-explicit-any` above the function
     - Remove `(s: any)` and `(p: any)` casts inside the function
- **Verification**: `pnpm --filter a16n typecheck && pnpm --filter a16n test`

### Step 3: Improve invalid --from/--to error messages

**No TDD cycle** — existing CLI tests already verify the error path (`should error on unknown source`, `should error on unknown target`). We'll update those assertions after the change.

- **Files**: `packages/cli/src/commands/convert.ts`, `packages/cli/src/commands/discover.ts`, `packages/cli/test/cli.test.ts`
- **Changes in convert.ts** (catch block, line 193-196):
  - Replace generic `formatError((error as Error).message)` with:
    ```typescript
    const msg = (error as Error).message;
    const suggestion = msg.startsWith('Unknown source') || msg.startsWith('Unknown target')
      ? "Run 'a16n plugins' to see available agents."
      : undefined;
    io.error(formatError(msg, suggestion));
    ```
- **Changes in discover.ts**: Same pattern for the discover command's catch block.
- **Changes in index.ts** (lines 48-49, 93): Update `--from` and `--to` option descriptions to hint at valid values:
  - `'Source agent'` → `'Source agent (built-in: cursor, claude, a16n)'`
  - `'Target agent'` → `'Target agent (built-in: cursor, claude, a16n)'`
  - `'Agent to discover'` → `'Agent to discover (built-in: cursor, claude, a16n)'`
  - This doesn't use `.choices()` (which would break community plugins) — it's purely descriptive.
- **Changes in cli.test.ts**: Update the two existing error tests to also assert the suggestion text is present in stderr.
- **Verification**: `pnpm --filter a16n test`

### Step 4: Implement stubbed tests in cli.test.ts

**TDD: tests first (they're already stubbed), then verify they fail, then implement.** But actually — the underlying code is already implemented. So the TDD cycle here is: write the test implementations → they should pass immediately (the tests test existing functionality). If any fail, that's a bug to investigate.

- **Files**: `packages/cli/test/cli.test.ts`
- **Changes**: Implement 11 test bodies:

  **Group A — sourceItems conflict detection (4 tests, ~line 403-427)**:
  Each test needs:
  1. `git init` in tempDir, configure user
  2. Create cursor rules with `alwaysApply: true`
  3. Set up git-ignore state (some sources in `.gitignore`, some tracked/committed)
  4. Run `convert --from cursor --to claude --gitignore-output-with match`
  5. Assert appropriate warnings or gitignore behavior

  **Group B — `--if-gitignore-conflict` flag (7 tests, ~line 465-507)**:
  Each test needs:
  1. Set up a conflict scenario (mixed ignored/tracked sources)
  2. Run with `--if-gitignore-conflict <value>`
  3. Assert the conflict was resolved per the specified strategy

- **Verification**: `pnpm --filter a16n test`

### Step 5: Add `engines` to CLI package.json

- **Files**: `packages/cli/package.json`
- **Changes**: Add `"engines": { "node": ">=20.0.0" }` to match root `package.json`
- **Verification**: `pnpm install` (no errors)

### Step 6: Create CONTRIBUTING.md

- **Files**: `CONTRIBUTING.md` (new, repo root)
- **Changes**: Create a concise contributing guide covering:
  - Prerequisites (Node version from `.nvmrc`, pnpm)
  - Getting started (`pnpm install && pnpm build && pnpm test`)
  - Project structure overview (monorepo, packages/)
  - How to run tests
  - PR expectations (conventional commits, all tests pass, typecheck clean)
  - Link to GitHub issues for finding work
  - Plugin development pointer (link to docs site)
- **Verification**: Link from README resolves

### Step 7: Fix broken docs links

- **Files**:
  - `packages/docs/docs/plugin-development/index.md` (line 210)
  - `packages/docs/docs/intro.md` (line 69)
- **Changes**:
  1. **plugin-development/index.md line 210**: Remove the `[Plugin: cursorrules](/plugin-cursorrules)` link. This plugin exists as a community validation exercise but has no docs page and isn't published. Replace with a note that community plugins following the `a16n-plugin-*` naming convention can be built using this guide.
  2. **intro.md line 69**: Change `[CLI Reference](/cli)` to `[CLI Overview](/cli)` — it already links to the CLI overview page, which is the right landing page. The label was misleading, not the link.
- **Verification**: `pnpm --filter docs build` (checks for broken links since `onBrokenLinks: 'warn'` in Docusaurus config)

### Step 8: README improvements

- **Files**: `README.md`
- **Changes**:
  1. **Pitch breadth**: Update the tagline/description to communicate that a16n is extensible beyond just Cursor and Claude. Something like:
     - Before: "Convert your Cursor rules to Claude Code config, or vice versa."
     - After: "Convert AI coding agent customizations between tools. Cursor and Claude Code are built-in; more tools are supported via plugins."
  2. **Supported Tools table**: Add rows for the plugin architecture story — e.g., "Your tool here" with a link to plugin development docs. Consider mentioning Cline as "in progress" if appropriate, or keeping it as a plugin-architecture callout.
  3. **Aggregate Codecov badge**: Add `[![codecov](https://codecov.io/github/Texarkanine/a16n/graph/badge.svg)](https://codecov.io/github/Texarkanine/a16n)` — the default Codecov badge URL (no `?flag=` parameter) shows aggregate coverage across all flags.
- **Verification**: Visual review; badge URL resolves

## Technology Validation

No new technology — validation not required.

## Challenges & Mitigations

- **Challenge: Stubbed tests may reveal bugs** — The git-ignore conflict handling code exists but may have edge cases the empty tests were meant to catch. *Mitigation*: If a test fails, investigate the root cause and fix the code, not the test.
- **Challenge: Git operations in test environment** — The stubbed tests require `git init`, tracked/committed files, and `.gitignore` manipulation in a temp directory. The existing match-mode tests already do this successfully. *Mitigation*: Follow the same patterns used in the existing passing tests (lines 429-462).
- **Challenge: Codecov badge may show 0% initially** — If the aggregate badge has never been generated, it may take a CI run to populate. *Mitigation*: The badge URL is correct; it will populate on the next push to main.

## Status

- [x] Component analysis complete
- [x] Open questions resolved (none identified)
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
