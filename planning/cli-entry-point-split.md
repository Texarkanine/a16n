# Planning: split CLI entry from `index.ts` (long-term)

**Status:** Design note for a future task. **Not** a committed plan with line-level diffs — it records the *cleanest* way to remove the "am I the main module?" guard from the library entry file so we do not re-argue the tradeoff from scratch.

**Context origin:** After fixing a flaky E2E test (`should show help when invoked through a symlink`), the working design uses an inode-based `statSync` comparison in `packages/cli/src/index.ts` to detect when the process was started as the CLI executable vs. when `index.ts` is imported for structure-only use (doc-gen, unit tests). That fix is correct and production-relevant (`node_modules/.bin/a16n` is a symlink). This document describes an alternative that avoids *any* heuristic in `index.ts` by separating **library surface** from **executable entry**.

---

## The problem today

`packages/cli/src/index.ts` does two jobs at once:

1. **Library API** — exports `createProgram(engine | null, io?)` for consumers that need the Commander tree without running it (docs scripts, `create-program.test.ts`, etc.).
2. **Executable** — when a heuristic decides "this import is the main module," it constructs `A16nEngine`, registers plugins, builds the program, and calls `program.parse()`.

The second job requires a guard so that importing `index.ts` for API inspection does not accidentally start the engine and parse argv. Today's guard compares `process.argv[1]` to `import.meta.url` (historically via `realpathSync`; currently via device+inode after the flake fix). Any such guard is inherently sensitive to how Node resolves argv vs. `import.meta.url` for symlinks, preserve-symlinks flags, and transient filesystem behavior.

**Smell:** Production concerns (symlinks, inode identity, concurrent FS) live in the same file as the stable library export used by tooling.

---

## Target architecture

Split into two compilation units with a single responsibility each:

| Role | File (suggested) | Responsibility |
| --- | --- | --- |
| Library entry | `packages/cli/src/index.ts` | Export `createProgram` (and any other public API). **No** top-level side effects. **No** argv / main-module detection. |
| Executable entry | `packages/cli/src/run.ts` (or `cli.ts` / `main.ts` — pick one name at implementation time) | Import engine + plugins, `discoverAndRegisterPlugins()`, `createProgram(engine)`, `program.parse()`. This file exists *only* to be executed. |
| Published binary | `package.json` → `"bin"` | Points at the **built** executable, e.g. `./dist/run.js`, not `./dist/index.js`. |

Conceptually:

```text
packages/cli/src/
  index.ts     # exports only — importable anywhere with zero side effects
  run.ts       # thin bootstrap — only meant for `node dist/run.js`
```

The built `dist/run.js` should be tiny: shebang + `await` bootstrap (same top-level await pattern as today), importing from `./index.js` for `createProgram` and wiring the engine exactly as the current guarded block does.

---

## Why this is "cleaner"

1. **No heuristic.** Subprocess tests and real users run `node …/dist/run.js` (or the `bin` shim that points there). Imports of `index.ts` never parse argv.

2. **Symlink and FS quirks disappear from `index.ts`.** `node_modules/.bin/a16n` can symlink to `dist/run.js`; argv[1] is irrelevant to library imports.

3. **Clear mental model.** "If you import `a16n/package`, you get factories. If you execute `run.js`, you get a process."

4. **Matches common npm patterns.** Many packages expose `lib/index.js` as API and `bin/cli.js` (or `dist/cli.js`) as entry; the `bin` field is the contract, not "run the library file."

---

## Integration points to update

| Consumer | Change |
| --- | --- |
| `package.json` `"bin"` | `"a16n": "./dist/run.js"` (or `./dist/cli.js` if you prefer that filename). Ensure the built file is included in the `"files"` array if you ever enumerate entries explicitly. |
| E2E / subprocess tests (`packages/cli/test/cli.test.ts`) | Today they spawn `node …/dist/index.js`. Point at `dist/run.js` (or whatever the executable is named). |
| TypeDoc / API docs (`packages/docs/scripts/generate-versioned-api.ts`) | Typedoc entry can remain `packages/cli/src/index.ts` **if** `index.ts` is only the library API — that is actually *better* than today, because TypeDoc will not need to understand a file that also runs the CLI at import time. |

**No change** expected for tests that only `import { createProgram } from '../src/index.js'` — they keep the same import path.

---

## Optional niceties

- **`export async function main()` from `run.ts`** and call it from the bottom of `run.ts` — makes it trivial to unit-test bootstrap in isolation (mock engine registration) if you ever need to.
- **Deprecate** documenting "run `node dist/index.js`" in README; prefer `npx a16n` or `node dist/run.js` after the split.
- Remove the inode / `statSync` helper from `index.ts` entirely once `run.ts` owns execution — that code migrates to the bin path only if still needed (it should not be needed on `run.ts` at all, since `run.ts` is never imported as a library).

---

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Users or scripts hard-code `…/dist/index.js` as the CLI | Rare; grep the repo and docs before release. Changelog note: "CLI entry file is now `dist/run.js`; use `npx a16n` or the package `bin`." |
| Duplicate logic between old `bin/a16n` under `packages/cli/bin/` (if present) and `run.ts` | Audit `packages/cli/bin/` — if it is a stale duplicate of `index.ts`, delete or replace with a one-liner that delegates to `run.js`. Single source of truth should be `run.ts` → `dist/run.js`. |
| Package size | Negligible — one extra small file in `dist/`. |

---

## Suggested implementation order

1. Add `run.ts` with the engine + `program.parse()` logic moved verbatim from the bottom of `index.ts`.
2. Strip the guard and executable block from `index.ts`; leave exports only.
3. Wire `package.json` `"bin"` to `./dist/run.js`; adjust `tsconfig` `include` / `rootDir` if needed so `run.ts` emits next to `index.js`.
4. Update subprocess tests and any CI references from `dist/index.js` → `dist/run.js`.
5. Full `pnpm build`, `pnpm test`, manual `npx`/local link smoke test.
6. Delete inode/`statSync` helper from `index.ts` (should be gone already in step 2).

---

## Relation to the symlink / inode fix

The inode-based guard is **valid** for a single-file entry and should stay until this refactor lands. After the split, **that entire class of logic can be deleted** — not because it was wrong, but because it becomes unnecessary: `run.ts` is never imported by doc-gen or tests as a library.

---

## When to schedule

Appropriate as a **small Level 2** refactor (touch `package.json`, CLI package tests, possibly docs scripts — verify grep). Not urgent relative to shipping behavior fixes; pick it up when touching the CLI package anyway or before a major version if you want a narrative "CLI entry path changed" in release notes.
