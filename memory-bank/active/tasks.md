# Task: Fix plugin-{cursor,claude} docs for complex skills + fix `--rewrite-path-refs` for AgentSkillIO (resource paths + content inside text-subtree ride-alongs)

* Task ID: 20260420-skills-docs-and-rewrite-resources
* Complexity: Level 2
* Type: Bug fix (docs + engine correctness) — two bugs surfaced by the same repro, plus a bounded scope expansion for rewriting *inside* spec-designated text ride-along subtrees

## Description

Three related defects / gaps:

1. **Docs bug.** `packages/docs/docs/plugin-cursor/index.md` (lines 19–36) and `packages/docs/docs/plugin-claude/index.md` (lines 18–35) claim that skills with multiple files / resources / hooks are *"Skipped"* or *"Skipped w/ Warning"*. In reality (verified in `packages/plugin-cursor/src/discover.ts` and `packages/plugin-claude/src/discover.ts`), skills with ride-along files are classified as `AgentSkillIO` and are **fully converted** (SKILL.md + all resource files are emitted). Only narrower cases are actually skipped:
    * Cursor: skill lacks both `description` and `disable-model-invocation` → Skipped.
    * Claude: `hooks:` present → Skipped. Skill has resource files but no `description` → Skipped.
2. **`--rewrite-path-refs` bug (SKILL.md body → resource paths).** References inside a SKILL.md body to ride-along resource files (e.g., `.cursor/skills/check/scripts/gotthis.sh`) are **not** rewritten when converting an `AgentSkillIO`. Root cause: `packages/engine/src/path-rewriter.ts` `buildMapping()` derives its source→target map from `WrittenFile.sourceItems[*].sourcePath`. For an `AgentSkillIO`, every emitted `WrittenFile` (SKILL.md *and* each resource) has `sourceItems: [skill]`, with `skill.sourcePath` = `.cursor/skills/check/SKILL.md`. There is no source-path entry for the resource files themselves, so references to them are never mapped and never rewritten. (Worse: because the map is keyed by source path and the same `skill.sourcePath` is "written" multiple times, the last writer wins — so the mapping for `SKILL.md → SKILL.md` actually gets clobbered by the last resource write. In practice this still isn't observed because SKILL.md bodies don't usually reference their own SKILL.md path, but it is latent.)
3. **`--rewrite-path-refs` gap (content inside ride-along files).** Even with bug 2 fixed, references *inside* ride-along files themselves (e.g., a `scripts/helper.sh` that says `source .cursor/skills/check/scripts/lib.sh`, or a `references/API.md` that links `.cursor/rules/foo.mdc`) are never rewritten. `rewriteContent` today only touches `item.content` (the SKILL.md body for `AgentSkillIO`), not `item.files`. **Scope** of the fix: rewrite content for files under the two AgentSkills.io-spec-designated text subtrees — `scripts/` and `references/`. Do NOT rewrite `assets/**` (spec: templates/images/data — may be binary or contain placeholder strings that must not change) or any other/unknown subtree (spec permits "any additional files or directories" — we cannot assume they are text). See [AgentSkills.io spec §Optional directories](https://agentskills.io/specification#optional-directories). This scope distinction must be documented clearly alongside `--rewrite-path-refs` in `packages/docs/docs/cli/index.md` and mirrored in `packages/docs/docs/understanding-conversions/index.md`.

## Test Plan (TDD)

### Behaviors to Verify

**Behavior 1 — docs accuracy (no runtime test; covered by prose review):**

Skip conditions are derived directly from the priority order in `packages/plugin-cursor/src/discover.ts` (lines 455–516) and `packages/plugin-claude/src/discover.ts` (lines 402–470).

* `plugin-cursor/index.md` "Cursor Skills" section accurately describes:
    * **Complex skills** (extra files in skill dir) with `description` → `AgentSkillIO` (SKILL.md + resource files copied).
    * **Complex skills without `description`** → Skipped w/ Warning (regardless of `disable-model-invocation`).
    * **Simple skills** with `disable-model-invocation: true` → `ManualPrompt`.
    * **Simple skills** with `description` → `SimpleAgentSkill`.
    * **Simple skills** with neither `description` nor `disable-model-invocation` → Skipped w/ Warning.
* `plugin-claude/index.md` "Claude Skills" section accurately describes:
    * **Any skill with `hooks:` frontmatter** → Skipped w/ Warning (hooks not supported by AgentSkills.io). This check runs first.
    * **Complex skills** (extra files) with `description` → `AgentSkillIO`.
    * **Complex skills without `description`** → Skipped w/ Warning.
    * **Simple skills** with `disable-model-invocation: true` → `ManualPrompt`.
    * **Simple skills** with `description` → `SimpleAgentSkill`.
    * **Simple skills** with neither → Skipped w/ Warning.

**Behavior 2 — `WrittenFile.sourcePaths` plumbing (engine):**
* [input/action] `WrittenFile` with explicit `sourcePaths: ['a/foo.sh']` emitted at target `/t/x/foo.sh` → [expected] `buildMapping` returns `{ 'a/foo.sh' → 'x/foo.sh' }`.
* [input/action] `WrittenFile` with **both** `sourceItems` (pointing at S) and explicit `sourcePaths: [R]` → [expected] mapping contains `R → target`; the `sourceItems` path `S` is **NOT** mapped via that WrittenFile (prevents the clobber described above).
* [input/action] `WrittenFile` with no `sourcePaths` and `sourceItems: [item]` → [expected] mapping uses `item.sourcePath` (existing behavior preserved).

**Behavior 2b — Ambiguous-mapping collision detection (engine):**

Defensive lint to surface the class of bug this task fixes if another 1:N-emit pattern is introduced in the future without populating `sourcePaths`.

* [input/action] Two `WrittenFile`s in the same `buildMapping` call whose derived source paths collide on the SAME key but map to DIFFERENT targets → [expected] `buildMapping` returns a mapping (last-writer-wins, today's behaviour) AND emits a `Warning` with `WarningCode.Approximated` (or a dedicated code if introduced during build) whose message names the colliding source path, both candidate targets, and advises populating `sourcePaths` explicitly on the emitting plugin.
* [input/action] Two `WrittenFile`s whose derived source paths collide on the same key AND map to the same target (legitimate duplicate — e.g., idempotent merge) → [expected] no warning.
* [input/action] Same-key collisions produced from `sourcePaths` (not the `sourceItems` fallback) → [expected] still warned, for symmetry (a plugin author could make this mistake in the explicit path too).
* Contract change: `buildMapping` currently returns `PathMapping` directly. Tactical option A: change return type to `{ mapping: PathMapping; warnings: Warning[] }`. Option B: keep the return type and accept an optional `warnings: Warning[]` out-parameter. **Decision: Option A** — cleaner, no mutation, matches the `detectOrphans` style. The single production caller is `packages/engine/src/transformation.ts:112` — it destructures and merges the returned warnings into the overall conversion result. Existing `buildMapping` unit tests (`path-rewriter.test.ts` P1–P4) all call `mapping.get(...)` directly; they need a one-line update to `buildMapping(...).mapping.get(...)`.

**Behavior 3 — cursor-plugin emit populates `sourcePaths` for resources:**
* [input/action] Emit a cursor `AgentSkillIO` with `sourcePath: '.cursor/skills/check/SKILL.md'` and one resource file `'scripts/gotthis.sh'` → [expected] the resource's `WrittenFile.sourcePaths` contains `'.cursor/skills/check/scripts/gotthis.sh'` (POSIX separators). SKILL.md `WrittenFile` still uses `sourceItems` only (existing).
* Edge case: skill with no resources → no new `sourcePaths` entries; no regression.
* Edge case: skill discovered with no `sourcePath` (IR built in tests without a source file) → resource `WrittenFile` simply omits `sourcePaths` (no crash, no bogus entry).

**Behavior 4 — claude-plugin emit populates `sourcePaths` for resources:**
* Same as Behavior 3 but for `packages/plugin-claude/src/emit.ts`.

**Behavior 5 — integration: cursor→claude with `--rewrite-path-refs` rewrites resource references from SKILL.md body AND from spec-text-subtree ride-alongs:**
* [input/action] Cursor skill at `.cursor/skills/check/SKILL.md` with body referencing `.cursor/skills/check/scripts/gotthis.sh`; ride-alongs on disk:
    * `scripts/gotthis.sh` whose body contains `.cursor/skills/check/references/NOTES.md` (text subtree → MUST be rewritten)
    * `references/NOTES.md` whose body contains `.cursor/skills/check/scripts/gotthis.sh` (text subtree → MUST be rewritten)
    * `assets/template.txt` whose body contains `.cursor/skills/check/scripts/gotthis.sh` (assets subtree → MUST NOT be rewritten)
    * `data/raw.csv` whose body contains `.cursor/skills/check/scripts/gotthis.sh` (unknown subtree → MUST NOT be rewritten)
    Convert with `rewritePathRefs: true`.
* [expected] Emitted `.claude/skills/check/SKILL.md` body contains `.claude/skills/check/scripts/gotthis.sh`, not `.cursor/skills/check/scripts/gotthis.sh`.
* [expected] Emitted `.claude/skills/check/scripts/gotthis.sh` body contains `.claude/skills/check/references/NOTES.md`, not the cursor path.
* [expected] Emitted `.claude/skills/check/references/NOTES.md` body contains `.claude/skills/check/scripts/gotthis.sh`, not the cursor path.
* [expected] Emitted `.claude/skills/check/assets/template.txt` body is unchanged (still contains the `.cursor/...` reference) — asset contents are NEVER rewritten, even though the file itself is copied.
* [expected] Emitted `.claude/skills/check/data/raw.csv` body is unchanged (still contains the `.cursor/...` reference) — non-spec subtrees are NEVER rewritten, even though the file is copied.
* [expected] No orphan-ref warning for the scripts/references rewrites. Orphan-ref warnings are **not** emitted for assets/ or unknown-subtree untouched references (they are intentionally skipped, not orphaned) — but the orphan detector itself must be aware of this distinction (see Behavior 8).

**Behavior 6 — existing path-rewriter behavior preserved (regression):**
* Existing `path-rewriter.test.ts` tests (P1–P12 or equivalent) continue to pass, updated only to destructure the new `{ mapping, warnings }` return shape (no semantic change).
* Existing cursor/claude `emit.test.ts` assertions on `sourceItems` continue to pass (we are *adding* `sourcePaths`, not replacing `sourceItems`).
* `transformation.test.ts` continues to pass; any tests asserting the exact `warnings` array may need to account for new collision warnings if fixtures happen to trigger them (unlikely given current plugins, but verify).

**Behavior 7 — `rewriteContent` rewrites content inside `scripts/**` and `references/**` ride-alongs (engine):**
* [input/action] `AgentSkillIO` item with `files: { 'scripts/a.sh': 'prefix .cursor/skills/check/scripts/b.sh suffix', 'references/a.md': 'link to .cursor/rules/foo.mdc', 'assets/tmpl.txt': '.cursor/skills/check/scripts/b.sh', 'data/raw.csv': '.cursor/skills/check/scripts/b.sh' }` and a mapping containing all those `.cursor/...` paths → [expected] cloned item has rewritten content in `files['scripts/a.sh']` and `files['references/a.md']`; `files['assets/tmpl.txt']` and `files['data/raw.csv']` are **byte-for-byte unchanged**.
* [input/action] `AgentSkillIO` item whose `files` map is empty or absent → [expected] no crash, existing content-only rewrite still works.
* [input/action] Non-`AgentSkillIO` items (no `files` field) mixed with `AgentSkillIO` items → [expected] non-`AgentSkillIO` items pass through untouched apart from the existing `content` rewrite.
* [input/action] `replacementCount` in the returned `RewriteResult` counts replacements in both `content` AND eligible `files[*]` entries.
* Nested-path check: key `'scripts/lib/helper.sh'` is in scope (prefix match `scripts/`); key `'scripts'` with no trailing slash is NOT (rare/degenerate but cover it); key at skill root (e.g., `'notes.txt'` with no `/`) is NOT in scope.

**Behavior 8 — `detectOrphans` scans content inside the same spec-text subtrees (engine):**
* [input/action] `AgentSkillIO` with `files['scripts/a.sh']` containing `.cursor/rules/gone.mdc` (not in mapping) → [expected] orphan warning with `sources` pointing at the skill's `sourcePath` (best available attribution; per-file attribution is not currently plumbed through and is out of scope — note this in the warning message).
* [input/action] Same reference living inside `files['assets/tmpl.txt']` or `files['data/raw.csv']` → [expected] **no** orphan warning (we intentionally did not rewrite, and scanning these could produce false positives on placeholder strings / binary-ish content).
* Existing content-level orphan detection is preserved.

### Test Infrastructure

* Framework: **Vitest** (per `techContext.md`).
* Test locations:
    * `packages/engine/test/path-rewriter.test.ts` — add cases for `sourcePaths` (Behavior 2, 2b), file-subtree rewriting (Behavior 7), and file-subtree orphan scan (Behavior 8).
    * `packages/plugin-cursor/test/emit.test.ts` — add cases for resource `sourcePaths`.
    * `packages/plugin-claude/test/emit.test.ts` — add cases for resource `sourcePaths`.
    * `packages/cli/test/integration/integration.test.ts` — extend the AgentSkillIO + `--rewrite-path-refs` integration test to cover the scripts/references rewrite + assets/unknown negative cases (Behavior 5).
* Conventions: existing tests use `describe(...)/it('Pn: ...', ...)` numbering and inline `makeItem`/`makeWritten` helpers; follow these.
* New test files: none — append to existing files.

## Implementation Plan

### Design Decision: how to fix the rewriter without polluting IR or output

Considered three options:

| Option | Idea | Rejected because |
|---|---|---|
| A — Phantom IR items | For each resource, synthesize an `AgentCustomization` in `sourceItems` whose `sourcePath` is the resource's source path. | Pollutes IR (fake items would flow through `--delete-source` logic, git-ignore detection, counts, etc.). |
| B — Extra field on `AgentSkillIO` | Add per-file source paths into the IR (`AgentSkillIO.files`). | Pollutes IR; every plugin that reads/writes AgentSkillIO has to honour it; cross-cuts for no behaviour gain. |
| **C — `WrittenFile.sourcePaths?: string[]`** | Add optional field on the emit-side data structure only. `buildMapping` prefers it over `sourceItems[*].sourcePath` when present. Plugin emit code that already knows the resource's source path simply passes it through. | **Chosen.** IR untouched. `WrittenFile` (a plugin↔engine contract, not serialized) gains one optional field. No serialized output changes. Backward-compatible with every other plugin. Scope-limited. |

Rules for Option C:

* `sourcePaths` is **optional**. When absent, `buildMapping` falls back to `sourceItems[*].sourcePath` (today's behaviour).
* When present, `sourcePaths` **replaces** the `sourceItems`-based derivation *for that WrittenFile's mapping entries only*. This prevents the latent clobber (resource WrittenFile whose `sourceItems[0].sourcePath` equals the SKILL.md's source path would otherwise overwrite the SKILL.md→target mapping).
* `sourceItems` is still populated on resource WrittenFiles (for attribution, `--delete-source`, etc.). Only the path-rewriter's mapping function changes behaviour.
* Source paths passed in `sourcePaths` use **POSIX separators** to match the existing normalization in `buildMapping`.

### Steps (one TDD cycle each)

1. **Extend `WrittenFile` with `sourcePaths`.**
    * Files: `packages/models/src/plugin.ts`
    * Changes: add `sourcePaths?: string[]` to `WrittenFile`. JSDoc: *"Explicit source-relative paths this output file represents, used by path-rewriting. When set, takes precedence over `sourceItems[*].sourcePath` for mapping purposes. Use for outputs that correspond to source paths that are not first-class `AgentCustomization`s (e.g., AgentSkillIO resource files)."*
    * Test: not directly testable at model layer; covered by step 2.

2. **Update `buildMapping` to honour `sourcePaths` + detect ambiguous collisions.**
    * Files: `packages/engine/src/path-rewriter.ts`; callers in `packages/engine/src/transformation.ts` (line 112); tests in `packages/engine/test/path-rewriter.test.ts` (update P1–P4 to destructure; add new cases for Behavior 2 and 2b) and `packages/engine/test/transformation.test.ts` (verify warnings propagate).
    * Changes:
        1. In the `for (const file of written)` loop, compute the source-path iterable as: `file.sourcePaths && file.sourcePaths.length > 0 ? file.sourcePaths : (file.sourceItems ?? []).map(s => s.sourcePath).filter(Boolean)`. Normalize each to POSIX separators (existing pattern).
        2. Before `mapping.set(normalizedSourcePath, targetRelative)`, check `mapping.get(normalizedSourcePath)`. If a DIFFERENT target is already set for that key, push a `Warning` (code `WarningCode.Approximated`) describing the ambiguity: `` `Ambiguous path mapping: '${normalizedSourcePath}' maps to both '${existing}' and '${targetRelative}'. The plugin emitting these WrittenFiles should populate sourcePaths explicitly.` ``. Same-target overwrites (idempotent) do NOT warn.
        3. Change `buildMapping`'s return type from `PathMapping` to `{ mapping: PathMapping; warnings: Warning[] }`.
        4. Update all callers to destructure and merge the returned warnings into the conversion result's warnings array.
    * Tests first: add cases matching Behavior 2 and 2b above.

2b. **Extend `rewriteContent` + `detectOrphans` to cover `scripts/**` and `references/**` ride-alongs.**
    * Files: `packages/engine/src/path-rewriter.ts`; tests in `packages/engine/test/path-rewriter.test.ts`.
    * Design: add a small private helper `isRewritableSkillResource(key: string): boolean` that returns `key.startsWith('scripts/') || key.startsWith('references/')`. Rationale (AgentSkills.io spec §Optional directories): `scripts/` and `references/` are text-by-convention; `assets/` is templates/images/data (may be binary or contain placeholder strings); "any additional files or directories" is freeform and may be non-text — safest default is not to touch. Keep the helper **local to `path-rewriter.ts`** (not exported from `@a16njs/models`) to minimize blast radius; promote later if a second caller appears.
    * `rewriteContent` changes:
        1. Extract the inner replacement loop into a small local `applyMapping(content: string, sortedEntries): { content: string; replaced: number }` helper — avoids duplication between `item.content` and `item.files[k]`.
        2. When iterating items, in addition to rewriting `clone.content`, if the item has a `files` property (duck-typed, or use `isAgentSkillIO` from `@a16njs/models` for clarity), clone the files map and rewrite each entry whose key satisfies `isRewritableSkillResource`. Leave other entries reference-equal to the original (no clone needed) OR shallow-copy the map entries unchanged (simpler — do the shallow copy for predictable immutability).
        3. `replacementCount` accumulates replacements from content + all eligible files.
    * `detectOrphans` changes: analogously, when an item has a `files` map, iterate entries whose key satisfies `isRewritableSkillResource` and run the same regex scan. Skip other entries. Attribution: use `item.sourcePath` (skill-level) as the source; per-file attribution isn't plumbed today and is out of scope.
    * Tests first: add cases matching Behavior 7 and 8 above (including the negative tests for `assets/` and unknown subtrees).

3. **Cursor emit: set `sourcePaths` on resource WrittenFiles.**
    * Files: `packages/plugin-cursor/src/emit.ts` (inside `emitAgentSkillIO`'s resource loop); tests in `packages/plugin-cursor/test/emit.test.ts`.
    * Changes: compute `resourceSourcePath = skill.sourcePath ? path.posix.join(path.posix.dirname(skill.sourcePath), filename.split(path.sep).join('/')) : undefined`. Set `sourcePaths: [resourceSourcePath]` on the resource `WrittenFile` only when `resourceSourcePath` is defined.
    * Tests first: add case matching Behavior 3 above.

4. **Claude emit: set `sourcePaths` on resource WrittenFiles.**
    * Files: `packages/plugin-claude/src/emit.ts` (inside `emitAgentSkillIO`'s resource loop); tests in `packages/plugin-claude/test/emit.test.ts`.
    * Changes: symmetric to step 3.
    * Tests first: add case matching Behavior 4 above.

5. **End-to-end integration test (expanded scope).**
    * Files: `packages/cli/test/integration/integration.test.ts` (new `it(...)` inside the existing `describe('Integration Tests - Path Reference Rewriting (--rewrite-path-refs)')`).
    * Changes: create `.cursor/skills/check/` with `SKILL.md`, `scripts/gotthis.sh`, `references/NOTES.md`, `assets/template.txt`, `data/raw.csv` — each with cross-references per Behavior 5. Run engine `convert({ rewritePathRefs: true })`; assert per-file expected outcomes from Behavior 5 (rewrites for SKILL.md body, scripts/*, references/*; untouched for assets/* and data/*).
    * Tests first: add the test (expect red), then confirm green after steps 2, 2b, 3, 4.

6. **Fix `plugin-cursor` docs.**
    * Files: `packages/docs/docs/plugin-cursor/index.md` (lines ~27–31 "Cursor Skills" block).
    * Changes: replace the "Complex Skills (more than one file): Skipped" bullet with a structure that mirrors the actual classification priority (see Behavior 1):
        * **Complex Skills** (extra files in skill dir): `AgentSkillIO` — SKILL.md + ride-along files (scripts/, references/, assets/, etc.) are all copied. Skipped w/ Warning if `description` is missing.
        * **Simple Skills** (only SKILL.md):
            * `disable-model-invocation: true` → `ManualPrompt`
            * `description:` present → `SimpleAgentSkill`
            * Neither → Skipped w/ Warning
    * Cross-reference the canonical classification priority in `systemPatterns.md` (note: that file currently only documents the Claude priority order; consider adding the Cursor priority order there in a follow-up, out of scope for this task).

7. **Fix `plugin-claude` docs.**
    * Files: `packages/docs/docs/plugin-claude/index.md` (lines ~28–32 "Claude Skills" block).
    * Changes: replace the "Complex Skills (hooks, multiple files, resources): Skipped w/ Warning" bullet with a structure that mirrors the actual classification priority (see Behavior 1):
        * **Any skill with `hooks:` frontmatter** → Skipped w/ Warning (hooks are not supported by AgentSkills.io; this check runs before file-count classification).
        * **Complex Skills** (extra files in skill dir): `AgentSkillIO` with `description` required; skipped w/ warning if `description` is missing.
        * **Simple Skills** (only SKILL.md):
            * `disable-model-invocation: true` → `ManualPrompt`
            * `description:` present → `SimpleAgentSkill`
            * Neither → Skipped w/ Warning

8. **Document `--rewrite-path-refs` scope for AgentSkillIO ride-alongs.**
    * Files: `packages/docs/docs/cli/index.md` (the existing `## Path Reference Rewriting` section around lines 69–86); mirror a shorter note in `packages/docs/docs/understanding-conversions/index.md` (section `## Path Reference Rewriting`, around lines 203–228).
    * CLI page changes: after the existing "How it works" list, add a **"What gets rewritten"** subsection with a clear table or bullet list:
        * `CLAUDE.md`, `AGENTS.md`, individual rule/prompt/hook file bodies — **rewritten** (existing behaviour).
        * `SKILL.md` body of an `AgentSkillIO` — **rewritten** (new in this fix; covers references to ride-along resources).
        * Ride-along files under a skill's `scripts/` subtree (spec: executable code) — **content rewritten** (new in this fix).
        * Ride-along files under a skill's `references/` subtree (spec: additional documentation) — **content rewritten** (new in this fix).
        * Ride-along files under a skill's `assets/` subtree (spec: templates, images, data files) — file is copied, **content is NOT rewritten** (may be binary or contain placeholder strings; rewriting could corrupt them).
        * Ride-along files under **any other subtree** (e.g., `data/`, `lib/`, `templates/`) — file is copied, **content is NOT rewritten**. The [AgentSkills.io spec](https://agentskills.io/specification#optional-directories) permits arbitrary additional directories and does not guarantee they contain text; content rewriting is limited to the two spec-designated text subtrees (`scripts/` and `references/`) for safety.
    * Cross-link the spec (https://agentskills.io/specification#optional-directories) from the "What gets rewritten" subsection.
    * understanding-conversions page: append one concise paragraph naming the same subtree policy (`scripts/` and `references/` in, `assets/` and others out) and link to the CLI page for the full table.

9. **Run the full validation suite.**
    * `pnpm build && pnpm test && pnpm lint && pnpm typecheck` (per `techContext.md`).
    * **Additionally** run the docs site build to catch Docusaurus/MDX breakage: `pnpm --filter docs run docs:build:current` (or `docs:build:all` for full API parity; Docusaurus is excluded from default `pnpm build`). Expect all changes green; no regressions.

## Technology Validation

No new technology - validation not required. All edits are in-place on existing TypeScript modules and Docusaurus markdown.

## Dependencies

* `@a16njs/models` change must ship before `@a16njs/engine`, `@a16njs/plugin-cursor`, `@a16njs/plugin-claude` consume the new field. This is internal to the monorepo and handled automatically by the composite-project build.
* Docs build is separate (`pnpm build:full`); not blocking CI default.

## Challenges & Mitigations

* **Challenge:** Could the `sourcePaths` fallback-vs-replace semantics regress plugins that populate `sourceItems` with many items? **Mitigation:** the "replace" semantics only kicks in for WrittenFiles that actually set `sourcePaths` — which is zero WrittenFiles pre-change. Backward compatibility by default.
* **Challenge:** POSIX-vs-Windows path separators on Windows CI. **Mitigation:** use `path.posix` explicitly; unit tests on Linux CI are sufficient for the separator logic because the inputs we derive from are already POSIX-normalized (sourcePath is constructed with forward slashes in discover; filename uses the POSIX form emitted by `readSkillFiles`). If a `filename` ever contains a backslash it is already converted to `/` via `split(path.sep).join('/')`.
* **Challenge:** Orphan-ref detector might emit false warnings if we only partially rewrite. **Mitigation:** after the fix, resource-file paths ARE in the mapping, so `detectOrphans` won't flag them.
* **Challenge:** Docs drift — there's also `packages/docs/docs/understanding-conversions/index.md`. **Mitigation:** already reviewed — that page's "Skills with hooks → Cursor" entry is correct; no change needed there.
* **Challenge:** The collision-warning lint (Behavior 2b) could produce noisy warnings on well-formed existing fixtures if the sourceItems-fallback path legitimately produces duplicate-key overwrites with the same target (e.g., a plugin that emits two WrittenFiles both tagged with `sourceItems: [itemA]` and both pointing at the same output path — though this is a degenerate case). **Mitigation:** the warning only fires when the target path differs; same-target duplicates are silently idempotent. Verify via the transformation-test suite after implementation that no new spurious warnings appear.
* **Challenge (scope expansion):** `scripts/` content is frequently a shell script or Python file — unlikely to legitimately contain a substring that matches a `.cursor/...` or `.claude/...` path except as an actual reference, so false-positive rewrites are very unlikely. Same for `references/` (markdown). `assets/` is the risky one (e.g., an HTML template with a literal `.cursor/...` string used as a placeholder) — which is exactly why it is explicitly excluded. **Mitigation:** explicit prefix allowlist (`scripts/`, `references/`), per-subtree negative tests in Behavior 5 and 7.
* **Challenge (scope expansion):** ride-along files were read via `fs.readFile(path, 'utf-8')` in `readSkillFiles` (both plugins). A binary file under `scripts/` or `references/` would already be corrupted at read time — pre-existing issue, unrelated to this change. **Mitigation:** not addressed here; tracked separately if it surfaces.
* **Challenge (scope expansion):** per-file orphan-ref attribution is skill-level, not file-level (we emit `sources: [skill.sourcePath]` for an orphan found inside `files['scripts/helper.sh']`). **Mitigation:** the warning message includes the found path, so the user can locate it; improving to per-file attribution requires plumbing through a second field on `Warning` and is out of scope.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight (PASS w/ ADVISORY — plan amended inline; see `.preflight-status`)
- [x] Post-preflight scope expansion (user request): rewrite inside `scripts/` + `references/` ride-alongs; see `.preflight-status` addendum
- [x] Build
- [x] QA (PASS with trivial cleanup — see `.qa-validation-status`)
- [x] Reflect (see `reflection/reflection-20260420-skills-docs-and-rewrite-resources.md`)
