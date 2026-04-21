# Active Context

## Task
Preserve filename case in rule emit (Cursor + Claude) — rework follow-up from PR #84 feedback.

## Task ID
20260421-preserve-filename-case

## Complexity
Level 2

## Phase
Reflect - COMPLETE

## Files Modified
- `packages/plugin-claude/src/emit.ts` — renamed `sanitizeFilename` → `sanitizeSkillDirName` (unchanged body), renamed `sanitizeName` → `sanitizeRuleStem` (case-preserving), added `sanitizeRuleFilename` (case-preserving), added shared local helper `normalizeStemPreservingCase`, added plugin-local `getUniqueFilenameCI`, dropped `getUniqueFilename` import from `@a16njs/models`, updated 5 call sites (lines 186, 358, 435, 497, 616-ish) to use the new helpers.
- `packages/plugin-cursor/src/emit.ts` — `sanitizeFilename` body: dropped `.toLowerCase()`, widened regex to `[^A-Za-z0-9]+`. Inline GlobalPrompt stem at `emit`-loop: same change. Private `getUniqueFilename` helper: now case-insensitive (lowercases Set keys, preserves original case in returned filename).
- `packages/plugin-claude/test/emit.test.ts` — added `Claude Filename Case Preservation` describe block with B1, B2, B3, B4, B5, B9, B11 behaviors (14 tests).
- `packages/plugin-cursor/test/emit.test.ts` — added `Cursor Filename Case Preservation` describe block with B6, B7, B9 behaviors (5 tests); updated 2 pre-existing `filename sanitization` tests that asserted legacy lowercasing (now expect original case preserved).

## Key Implementation Decisions (build phase)
- Extracted shared local `normalizeStemPreservingCase(s)` helper in plugin-claude per the challenge note in `tasks.md` §Challenges & Mitigations, so the regex + hyphen-trim lives in exactly one place.
- Kept the `sanitizeSkillDirName`/`sanitizeRuleStem`/`sanitizeRuleFilename` rename triad in plugin-claude as planned. Call-site diff was adjacent to the rename, so churn stayed bounded.
- For plugin-cursor, followed the plan's minimal approach (regex widening in place) rather than the advisory 2 parallel rename. All cursor `sanitizeFilename` call sites are rule-filename sanitization; the function body change is semantically sufficient. Defer the rename to a separate clean-up PR if requested.
- Plugin-claude's `getUniqueFilenameCI` preserves the ORIGINAL-case `baseName` in the returned name; only the Set key is lowercased. Symmetric behavior in plugin-cursor's updated `getUniqueFilename`.

## Deviations from Plan
- None functional. Minor note: B3/B4/B5/B11 tests passed even before the fix (current code was already correct for those behaviors). These tests are still valuable as regression guards for the intent-split (so a future refactor doesn't accidentally lowercase rule filenames or un-lowercase skill dirs).
- Two pre-existing `filename sanitization` tests in plugin-cursor's `emit.test.ts` (lines 137, 216) asserted the old lowercasing behavior. Updated them to assert the new case-preserving behavior; this is B10 in reverse — fixtures with mixed-case sources now produce mixed-case outputs.

## Validation
- Node 22 is the project's only supported runtime (engines.node>=22 and .nvmrc=22). On Node 22: full test suite 15/15 turbo tasks pass. On Node 20 the unrelated `plugin-discovery > should fall back to index.js when no package.json exists` test fails — known issue, not introduced by this task (documented in `progress.md`).
- Typecheck: all 12 packages pass. Build: all 7 build tasks pass.
- Manual repro confirmed: running `a16n convert --from cursor --to claude --from-dir src --to-dir out --rewrite-path-refs` against a temp tree mirroring this repo's `.cursor/rules/shared/niko/memory-bank/active/activeContext.mdc` produces `out/.claude/rules/shared/niko/memory-bank/active/activeContext.md` (CamelCase preserved; lowercase `activecontext.md` does not appear).

## Summary
Rule filenames (`.claude/rules/**/*.md`, `.cursor/rules/**/*.mdc`) are being lowercased unnecessarily during emit, e.g. `activeContext.mdc` → `activecontext.md`. The only spec-mandated lowercasing is on AgentSkills.io skill **directory** names (which must match `[a-z0-9-]+` per the spec's `name` field + "must match parent directory name" rule). This binds BOTH plugins' skill dirs, since Cursor also implements AgentSkills.io ([cursor.com/docs/skills](https://cursor.com/docs/skills)). Split normalization by intent: `sanitizeSkillDirName` for skill dir names (keeps lowercasing per spec), `sanitizeRuleFilename` / `sanitizeRuleStem` for rule filenames (preserve source case). Symmetric change across `plugin-claude` and `plugin-cursor`. Adds case-insensitive collision detection **plugin-locally** (not in `@a16njs/models`'s public helper) so case-only differences never silently overwrite on case-insensitive filesystems.

Operating principle (per operator): preserve case by default across the whole system. The only exceptions are target-spec-mandated (AgentSkills.io skill dir names in both plugins). Case handling is per-plugin business, not a shared-model concern.

Explicit scope decisions:
- Out of scope: extending a16n's rewrite allowlist to cover `resources/` (reviewer's Finding 1). Niko uses a non-spec `resources/` dir; that's a Niko-repo bug to rename to `references/` (which a16n already handles).
- Retained as-is: Cursor skill directory lowercasing (via `sanitizePromptName`). Initially flagged B8 for follow-up; confirmed on 2026-04-21 that this is spec-mandated (AgentSkills.io §name + parent-directory rule) since Cursor implements the spec. No change needed — behavior is correct.
- Retained as-is: public `@a16njs/models::getUniqueFilename` — semver preserved. Case-insensitive collision detection lives in each plugin, not the shared helper.

## Prior Task Archive Status
`20260420-skills-docs-and-rewrite-resources` completed Reflect on 2026-04-21 but not yet archived — both tasks ship in the same PR (#84, branch `discover-skills-with-files`). Archive can batch both or run them back-to-back once this follow-up task completes.

## Next Step
Reflection written to `memory-bank/active/reflection/reflection-20260421-preserve-filename-case.md`. Reconcile-persistent check: no updates (systemPatterns.md already current from prior task's reconcile; no factual invalidation from this task in productContext.md or techContext.md). Ready for `/niko-archive` (both `20260420-skills-docs-and-rewrite-resources` and this task can be archived back-to-back since they ship in the same PR #84).
