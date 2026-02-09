# Tasks

## Active Task: Fix CLI Documentation Generation

**Complexity:** Level 3 (Multi-Component)
**Branch:** `cli-docs`
**Status:** Reflection Complete

### Completion Status

- [x] Planning complete
- [x] Implementation complete
- [x] Testing complete (165 tests pass: 131 CLI + 34 docs)
- [x] Reflection complete
- [ ] Archiving

### Reflection Highlights

- **What Went Well**: Plan mapped 1:1 to implementation; zero regressions; bonus fix for hidden options leaking into docs; clean `createProgram()` separation.
- **Challenges**: TDD stub broke compilation (module-scope code can't be partially extracted); Vitest import resolution required workspace builds first.
- **Lessons Learned**: ESM main-module guard pattern; dynamic import cache-busting; Commander hidden option API; TDD with module-level code requires "compilable extraction" step.
- **Next Steps**: Archive task; consider CI doc completeness check; review other doc generators for similar hardcoded-duplicate patterns.

### Problem Statement

The CLI API reference docs are supposed to be auto-generated from the Commander.js interface, but `packages/docs/scripts/generate-cli-docs.ts:getCliProgram()` (lines 252–315) manually reconstructs a **hardcoded duplicate** of the CLI program. This duplicate is missing `--from-dir`, `--to-dir`, `--rewrite-path-refs` on `convert`, and `--from-dir` on `discover`. Every versioned doc page renders the same stale content regardless of which git tag is checked out.

**Goal:** Make docs truly auto-generated from the real CLI source, with graceful fallback for historical versions that predate the refactor.

---

### Implementation Plan

#### Step 1: Refactor CLI — export `createProgram()` factory

**File:** `packages/cli/src/index.ts`

1. Extract all program construction (`.command()`, `.option()`, `.argument()`, `.action()`) into an exported function:
   ```ts
   export function createProgram(engine: A16nEngine): Command { ... }
   ```
2. Guard the module-level execution so `.parse()` only runs when executed directly as a CLI, not when imported:
   ```ts
   // ESM "is main module" guard
   const isDirectRun = process.argv[1] &&
     realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
   if (isDirectRun) {
     const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin]);
     const program = createProgram(engine);
     program.parse();
   }
   ```
3. Move the engine creation, plugin imports, and helper functions (`toGitIgnorePath`, git-ignore imports) inside `createProgram()` or keep them at module level but ensure they're harmless when imported (they are — no side effects beyond object creation).

**Non-breaking:** The compiled `dist/index.js` still works identically as a CLI binary. The `isDirectRun` guard fires when invoked via `node dist/index.js` or the `a16n` bin link. When imported by the doc generator, `.parse()` is skipped.

#### Step 2: Update doc generator — dynamic import + fallback

**File:** `packages/docs/scripts/generate-cli-docs.ts`

1. **Replace `getCliProgram()`** with:
   ```ts
   async function getCliProgram(): Promise<Command> {
     buildCli(); // pnpm --filter @a16njs/cli build
     const cliDistPath = join(getRepoRoot(), 'packages', 'cli', 'dist', 'index.js');
     const mod = await import(cliDistPath);
     if (typeof mod.createProgram !== 'function') {
       throw new Error('createProgram not found — CLI version predates factory export');
     }
     return mod.createProgram(null); // null engine — actions never invoked
   }
   ```
2. **Add `generateFallbackPage(version: string): string`** — returns minimal markdown:
   ```markdown
   ---
   title: {version}
   slug: /cli/reference/{version}
   ---
   # CLI Reference — {version}

   Auto-generated reference is not available for this version.

   To view the full command reference, run:
   ```bash
   npx a16n@{version} --help
   ```
   ```
3. **Update `generateCliDocsForVersion()`** — wrap the program import in try/catch. On failure, write the fallback page instead. The version still appears in the picker and pagination chain.

#### Step 3: Minor versioned pipeline adjustment

**File:** `packages/docs/scripts/generate-versioned-api.ts`

The existing per-tag loop (lines 348–370) already has try/catch. The only change: instead of letting CLI failures record as `success: false` (which excludes them from `versions.json`), we need to ensure fallback pages still register as successful so the version appears in the picker.

This is handled by the change in Step 2 — `generateCliDocsForVersion()` catches the import failure internally and writes the fallback, so from the versioned pipeline's perspective it succeeds.

#### Step 4: Tests (TDD — written before implementation)

**File:** `packages/cli/test/create-program.test.ts` (new)
- `createProgram` returns a Command instance
- Has subcommands: `convert`, `discover`, `plugins`
- `convert` has all expected options including `--from-dir`, `--to-dir`, `--rewrite-path-refs`
- `discover` has `--from-dir`
- Passing `null` as engine doesn't throw (structure-only usage)

**File:** `packages/docs/test/generate-cli-docs.test.ts` (add to existing)
- `generateFallbackPage('0.5.0')` returns correct frontmatter (title, slug)
- Fallback page contains `npx a16n@0.5.0 --help`
- Fallback page contains "not available" messaging

#### Step 5: Verification

1. `pnpm run format && pnpm run lint -- --fix` across affected packages
2. `pnpm run build` in CLI package
3. `pnpm run test` in CLI and docs packages
4. `pnpm run clidoc:current` in docs package — verify output includes `--from-dir`, `--to-dir`, `--rewrite-path-refs`

---

### Files Affected

| File | Change |
|------|--------|
| `packages/cli/src/index.ts` | Extract `createProgram()`, add ESM main-module guard |
| `packages/docs/scripts/generate-cli-docs.ts` | Dynamic import, remove hardcoded program, add fallback |
| `packages/docs/scripts/generate-versioned-api.ts` | Minimal — ensure fallback versions count as successful |
| `packages/cli/test/create-program.test.ts` | New — test `createProgram` export |
| `packages/docs/test/generate-cli-docs.test.ts` | Add — test `generateFallbackPage` |

### Key Design Decisions

- **`createProgram(engine)` takes engine param** rather than creating it internally, so the doc generator can pass `null` (actions are never invoked for doc generation)
- **`isDirectRun` guard** uses `import.meta.url` comparison — standard ESM pattern, no need for a separate entry point file
- **Fallback is try/catch on import**, not source-text regex — robust against any structural changes in old versions
- **Fallback pages still appear in version picker** — versions don't silently disappear

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Dynamic import of CLI triggers side effects | `createProgram()` is pure — only `.parse()` (behind `isDirectRun` guard) triggers execution |
| Old version builds fail during versioned generation | `generateCliDocsForVersion()` catches import failure and writes fallback page instead |
| Engine dependency in `createProgram()` | Pass `null` — doc generator only needs Commander structure, not working actions |
| Breaking change to CLI package consumers | No breaking change — `createProgram` is a new export, existing `bin` entry unchanged |
