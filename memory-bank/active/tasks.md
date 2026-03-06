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
- **`packages/cli/src/index.ts`**: Commander program setup → dynamic plugin-sourced descriptions for `--from`/`--to`
- **`packages/cli/test/cli.test.ts`**: Stubbed test bodies → implement or delete 11 empty tests
- **`packages/*/package.json`** (all published): Missing or outdated `engines` field → align to `>=20.0.0`
- **`.github/workflows/docs.yaml`**: Hardcoded `node-version: '22'` → defer to `.nvmrc`
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

**No TDD cycle needed** — this is a pure type-annotation change with zero behavioral impact. No new runtime code, no new tests needed. Existing tests cover the behavior.

- **Files**: `packages/cli/src/commands/convert.ts`
- **Changes**:
  1. Add to existing import line 9: `import { WarningCode } from '@a16njs/models';` → `import { WarningCode, type AgentCustomization } from '@a16njs/models';`
  2. Change `routeConflict` signature (line 414):
     - `ignoredSources: any[]` → `ignoredSources: { source: AgentCustomization; ignoreSource: string | null }[]`
     - `trackedSources: any[]` → `trackedSources: { source: AgentCustomization; ignoreSource: string | null }[]`
     - Remove `// eslint-disable-next-line @typescript-eslint/no-explicit-any` above the function
     - Remove `(s: any)` casts on line 428 — TypeScript infers correctly from the typed params
  3. Change `routeConflictSimple` signature (line 437):
     - `sources: any[]` → `sources: AgentCustomization[]`
     - Remove `// eslint-disable-next-line @typescript-eslint/no-explicit-any` above the function
     - Remove `(s: any)` and `(p: any)` casts on line 447
  4. **No new interface/type alias.** The inline object type is used in two params of one function — not enough repetition to justify a named type. `ConflictRouteContext` (line 403) is a named interface because it's shared across 3 functions; these types are used in exactly one.
- **Verification**: `pnpm --filter a16n typecheck && pnpm --filter a16n test`

### Step 3: Improve invalid --from/--to error messages

**No TDD cycle** — existing CLI tests already verify the error path (`should error on unknown source`, `should error on unknown target`). We'll update those assertions after the change.

- **Files**: `packages/cli/src/commands/convert.ts`, `packages/cli/src/commands/discover.ts`, `packages/cli/test/cli.test.ts`
- **Changes in convert.ts** (catch block, line 193-196):
  - The `engine` is in scope (passed to `handleConvert`). Build a dynamic suggestion from the actual registered plugins:
    ```typescript
    const msg = (error as Error).message;
    let suggestion: string | undefined;
    if (msg.startsWith('Unknown source') || msg.startsWith('Unknown target')) {
      const ids = engine.listPlugins().map(p => p.id).join(', ');
      suggestion = `Available agents: ${ids}`;
    }
    io.error(formatError(msg, suggestion));
    ```
  - This means the error message lists the REAL plugins (including any community plugins the user has installed), not a hardcoded list.
- **Changes in discover.ts**: Same pattern — `engine` is already passed to `handleDiscover`.
- **Changes in index.ts** (lines 48-49, 93): Update `--from` and `--to` option descriptions dynamically from the engine:
  - In `createProgram(engine, io)`, compute the plugin list: `const pluginIds = engine?.listPlugins().map(p => p.id).join(', ') ?? 'cursor, claude, a16n';`
  - Use it in descriptions: `'Source agent'` → `` `Source agent (available: ${pluginIds})` ``
  - Same for `'Target agent'` and `'Agent to discover'`
  - When `engine` is null (doc-gen mode), falls back to the hardcoded list. When engine is populated, lists whatever's actually registered.
- **Changes in cli.test.ts**: Update the two existing error tests to also assert the suggestion text is present in stderr (e.g., `expect(stderr).toContain('Available agents:')`).
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

### Step 5: Align `engines` across all packages to `>=20.0.0`

Node 20 is the oldest version we'll attempt to support. `.nvmrc` (24) is the development version; `engines` is the minimum supported version. CI already defers to `.nvmrc` via `node-version-file`.

- **Files**:
  - `package.json` (root): `>=18.0.0` → `>=20.0.0`
  - `packages/cli/package.json`: missing → add `"engines": { "node": ">=20.0.0" }`
  - `packages/engine/package.json`: missing → add `"engines": { "node": ">=20.0.0" }`
  - `packages/models/package.json`: missing → add `"engines": { "node": ">=20.0.0" }`
  - `packages/plugin-cursor/package.json`: missing → add `"engines": { "node": ">=20.0.0" }`
  - `packages/plugin-claude/package.json`: missing → add `"engines": { "node": ">=20.0.0" }`
  - `packages/plugin-a16n/package.json`: missing → add `"engines": { "node": ">=20.0.0" }`
  - `packages/glob-hook/package.json`: `>=18.0.0` → `>=20.0.0`
  - `packages/docs/package.json`: `>=18.0` → `>=20.0.0`
  - `.github/workflows/docs.yaml`: hardcoded `node-version: '22'` → `node-version-file: ".nvmrc"` (align with other workflows)
- **Verification**: `pnpm install` (no errors), `git --no-pager diff` to confirm all changes

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
