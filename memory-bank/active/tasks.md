# Task: Preserve filename case in rule emit (Cursor + Claude)

* Task ID: 20260421-preserve-filename-case
* Complexity: Level 2
* Type: Bug fix (unnecessary input mutation during emit)
* Rework follow-up to: `20260420-skills-docs-and-rewrite-resources` (PR #84). Both tasks ship in the same PR.

## Description

PR #84 feedback surfaced that CamelCase source filenames are lowercased when emitted as rule files — e.g., `.cursor/rules/shared/niko/memory-bank/active/activeContext.mdc` becomes `.claude/rules/shared/niko/memory-bank/active/activecontext.md`. The [AgentSkills.io spec](https://agentskills.io/specification) requires lowercase-kebab ONLY for the skill `name` field (which is the skill **directory name**). Rule filenames under `.claude/rules/**` and `.cursor/rules/**` have **no** spec requirement on case — the lowercasing is a16n imposing convention that isn't required to make anything work.

Guiding principle (per operator): *"Never make a change to input that isn't REQUIRED in order for it to work."* Preserve source filename case for rule files. Keep mandatory lowercasing only where the spec genuinely requires it (Claude skill directory names).

Related: the previous PR #84's fix rewrites `.cursor/...` → `.claude/...` path refs inside `references/` ride-alongs but not inside the non-spec `resources/` subtree that the Niko skill happens to use. That is acknowledged as a **Niko-repo bug** (Niko should rename `resources/` → `references/` per AgentSkills.io spec) and is **NOT** in scope here.

## Test Plan (TDD)

### Behaviors to Verify

**B1 — Claude FileRule preserves case:**
* [input/action] FileRule with `sourcePath: '.cursor/rules/shared/niko/memory-bank/active/activeContext.mdc'`, `relativeDir: 'shared/niko/memory-bank/active'` emitted to Claude → [expected] `WrittenFile.path` ends with `active/activeContext.md` (NOT `activecontext.md`).
* [edge] FileRule with `sourcePath: '.../foo.bar.baz.mdc'` → stem `foo.bar.baz` → after stripping last extension `foo.bar.baz` → regex replaces both dots with `-` → filename `foo-bar-baz.md` (case preserved, dots normalized).
* [edge] Empty/only-special-chars stem (e.g., basename `___.mdc`) → falls back to `'rule'` (existing default).

**B2 — Claude GlobalPrompt preserves case:**
* [input/action] GlobalPrompt with `name: 'productContext'`, no `relativeDir` → [expected] `WrittenFile.path` ends with `productContext.md`.

**B3 — Claude AgentSkillIO skill directory stays lowercase (spec compliance):**
* [input/action] AgentSkillIO with `name: 'Pdf-Processing'` (uppercase present) → [expected] skill dir is `.claude/skills/pdf-processing/` (AgentSkills.io spec §`name` requires `[a-z0-9-]+`).
* [input/action] AgentSkillIO with `name: 'niko-archive'` (already lowercase) → [expected] skill dir unchanged: `.claude/skills/niko-archive/`.

**B4 — Claude SimpleAgentSkill skill directory stays lowercase:**
* [input/action] SimpleAgentSkill with `name: 'MyNiceSkill'` → [expected] skill dir `.claude/skills/myniceskill/`.
* [input/action] SimpleAgentSkill with no `name` and `sourcePath: '.../MySkill.mdc'` (fallback path) → [expected] skill dir `.claude/skills/myskill/`.

**B5 — Claude ManualPrompt skill directory stays lowercase:**
* [input/action] ManualPrompt with `promptName: 'MyCommand'` → [expected] skill dir `.claude/skills/mycommand/SKILL.md`.

**B6 — Cursor FileRule preserves case (symmetric to B1):**
* [input/action] FileRule with `sourcePath: '.claude/rules/activeContext.md'` emitted to Cursor → [expected] `WrittenFile.path` ends with `activeContext.mdc`.

**B7 — Cursor GlobalPrompt preserves case (symmetric to B2):**
* [input/action] GlobalPrompt with `name: 'productContext'` → [expected] `.cursor/rules/productContext.mdc`.

**B8 — Cursor skill directory lowercasing behavior (DEFERRED):**
* Intentionally NOT changed in this task. Cursor's skill dir emission uses `sanitizePromptName` (lowercasing). AgentSkills.io spec doesn't bind Cursor, but round-tripping with Claude (which requires lowercase skill dirs) makes "preserve case" a non-trivial semantic change. Captured as a possible follow-up; not blocking.

**B9 — Case-insensitive collision safety on case-insensitive filesystems:**
* [input/action] Two FileRules in the same directory with `sourcePath` ending `activeContext.mdc` and `activecontext.mdc` (hypothetical; real case-sensitive Linux checkout) → [expected] both written without silent overwrite when target FS is case-insensitive (macOS/Windows); the second file lands on `activecontext-1.md` (or similar) via collision detection that treats case-only differences as collisions.
* [input/action] Two unrelated FileRules with names `activeContext.mdc` and `foo.mdc` → [expected] no collision.

**B10 — Existing lowercase-kebab sources regress to same output:**
* Every current fixture with already-lowercase source stems (`general.mdc`, `testing.mdc`, `auth.mdc`, `react.mdc`, `claude-md.mdc`, etc.) produces a byte-identical target filename after the change. Verified by running the full existing test suite unchanged.

**B11 — Leading-dot filenames still sanitize as before:**
* [input/action] FileRule with `sourcePath: '.../.dotfile.mdc'` → [expected] matches existing behavior (no regression). The current `sanitizeFilename` strips ext → `.dotfile` → regex strips leading dot → `dotfile`. After fix the regex widens to `[^A-Za-z0-9]+` → same outcome. Verify.

### Test Infrastructure

* Framework: **Vitest** (per `techContext.md`).
* Test locations:
    * `packages/plugin-claude/test/emit.test.ts` — add B1–B5 cases (FileRule + GlobalPrompt case preservation; AgentSkillIO/SimpleAgentSkill/ManualPrompt skill-dir lowercasing).
    * `packages/plugin-cursor/test/emit.test.ts` — add B6–B7 cases (FileRule + GlobalPrompt case preservation).
    * Both `emit.test.ts` files — add B9 case-insensitive collision test.
* Conventions: existing `describe(...)/it(...)` numbering; inline `makeItem`/`makeWritten` helpers (follow existing patterns).
* No new test files.

## Implementation Plan

### Design Decision: rule-filename vs skill-dir-name normalization

The current `sanitizeFilename` (plugin-claude) and `sanitizeFilename` (plugin-cursor) do three things conflated in one function:

1. Basename extraction + extension stripping (always required).
2. Case normalization (only required for AgentSkills.io skill dir names).
3. Illegal-char replacement (always required).

Call sites today use the same function for both (1)+(2)+(3) rule filenames (where case should be preserved) AND skill dir names (where case must be lowered per spec). The fix splits this by intent, not by one big behavior change:

| Call site | Today | After fix | Why |
|---|---|---|---|
| `plugin-claude` FileRule filename (line 435) | `sanitizeFilename` (lowercases) | `sanitizeRuleFilename` (preserves case) | No spec requirement on rule filenames |
| `plugin-claude` GlobalPrompt filename (line 358) | `sanitizeName` (lowercases) | `sanitizeRuleFilename` (preserves case) | Same |
| `plugin-claude` AgentSkillIO skill dir (line 186) | `sanitizeFilename` (lowercases) | `sanitizeSkillDirName` (still lowercases) | AgentSkills.io spec §`name` requires `[a-z0-9-]+` |
| `plugin-claude` SimpleAgentSkill skill dir fallback (line 497) | `sanitizeFilename` | `sanitizeSkillDirName` | Same |
| `plugin-claude` SimpleAgentSkill / ManualPrompt skill dir (`sanitizePromptName`) | lowercases | unchanged | Same |
| `plugin-cursor` FileRule filename (line 532) | `sanitizeFilename` (lowercases) | `sanitizeRuleFilename` (preserves case) | No spec requirement on Cursor rule filenames |
| `plugin-cursor` GlobalPrompt filename (inline at line 471) | `.toLowerCase()...` | preserve case inline | Same |
| `plugin-cursor` skill dir (`sanitizePromptName`) | lowercases | unchanged (deferred per B8) | See B8 |

**Regex change:** `[^a-z0-9]+` → `[^A-Za-z0-9]+` (widen to allow uppercase). Drop the `.toLowerCase()` call. Everything else unchanged (leading/trailing hyphen trim, fallback `|| 'rule'`).

**Collision safety:** introduce case-insensitive `usedFilenames` check in both plugins' `getUniqueFilename` paths so that `activeContext.md` and `activecontext.md` can't both land on the same case-insensitive filesystem without the collision counter firing. Cleanest approach: store `toLowerCase()` of basenames in the `Set`, compare with `toLowerCase()` on lookup; preserve the original-cased name on disk. No API change needed in the public helper (`@a16njs/models` `getUniqueFilename`) — do the normalization inside it, behind an optional `caseInsensitive` flag defaulting to `true` (or just unconditionally, since "treat case-only matches as collisions" is never worse than the status quo).

### Steps (one TDD cycle each)

1. **Widen regex + preserve case in `sanitizeFilename` / `sanitizeName` in plugin-claude.**
    * Files: `packages/plugin-claude/src/emit.ts`; tests in `packages/plugin-claude/test/emit.test.ts`.
    * Changes:
        * Rename `sanitizeFilename` → `sanitizeSkillDirName` (semantic narrowing); keep current body (lowercase + `[^a-z0-9]+` regex). Single responsibility: produce an AgentSkills.io-spec-compliant skill directory name.
        * Add `sanitizeRuleFilename(sourcePath: string)`: basename → strip last extension → `replace(/[^A-Za-z0-9]+/g, '-')` → trim leading/trailing hyphens → fallback `'rule'`. Case preserved.
        * Change `sanitizeName` (helper for pre-derived stems, line 74) to preserve case: `replace(/[^A-Za-z0-9]+/g, '-')` instead of `.toLowerCase().replace(/[^a-z0-9]+/g, '-')`. Rename to `sanitizeRuleStem` (pairs with `sanitizeRuleFilename` semantically; the rename is cheap and clarifies intent).
        * Update call sites:
            * Line 186 `sanitizeFilename(skill.name)` → `sanitizeSkillDirName(skill.name)`.
            * Line 358 `sanitizeName(gp.name)` → `sanitizeRuleStem(gp.name)`.
            * Line 435 `sanitizeFilename(rule.sourcePath || rule.id)` → `sanitizeRuleFilename(rule.sourcePath || rule.id)`.
            * Line 497 `sanitizeFilename(skill.sourcePath || skill.id)` → `sanitizeSkillDirName(skill.sourcePath || skill.id)`.
            * `sanitizePromptName` (lines 496, 616): unchanged. Still lowercases for skill dirs.
    * Tests first: add B1, B2, B3, B4, B5, B11.

2. **Widen regex + preserve case in `sanitizeFilename` / inline stem in plugin-cursor.**
    * Files: `packages/plugin-cursor/src/emit.ts`; tests in `packages/plugin-cursor/test/emit.test.ts`.
    * Changes:
        * `sanitizeFilename` (line 31): drop `.toLowerCase()`; widen regex to `[^A-Za-z0-9]+`. Used for FileRule rule filenames (line 532) and AgentSkill rule filename fallback (line 259, 593). All of these are **rule filenames**, not skill dir names — case preservation is correct for all.
        * Inline stem at line 471 (GlobalPrompt): change `gp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')` → `gp.name.replace(/[^A-Za-z0-9]+/g, '-')`. Case preserved.
        * `sanitizePromptName` (line 52): unchanged. Used for Cursor **skill dir names** (lines 204, 290, 594, 678). B8 defers changing this.
    * Tests first: add B6, B7.

3. **Case-insensitive collision detection in `getUniqueFilename` (both implementations).**
    * Files:
        * `packages/models/src/helpers.ts` — `getUniqueFilename` at line 101 (used by plugin-claude).
        * `packages/plugin-cursor/src/emit.ts` — local `getUniqueFilename` at line 66.
    * Changes: in each, compare against `usedNames` case-insensitively (store `baseName.toLowerCase()` in the Set, look up with `toLowerCase()`). Preserve the original-cased `baseName` for what's returned and actually written. No public-signature change; the behavior shift (treating case-only differences as collisions) is strictly safer on case-insensitive filesystems and a no-op on case-sensitive filesystems when names don't differ by case only.
    * Tests first: add B9 case-insensitive collision test (one per plugin).

4. **Fixture / regression sweep.**
    * Files: `packages/plugin-claude/test/fixtures/**`, `packages/plugin-cursor/test/fixtures/**`, `packages/cli/test/integration/fixtures/**`.
    * Changes: none expected. Survey performed during planning: no fixture file has mixed-case stem (only all-lowercase-kebab names like `general.mdc`, `testing.mdc`, `auth.mdc`, `react.mdc`, `claude-md.mdc`, `agent-requested.mdc`, `database.mdc`, `typescript.mdc`, `main.mdc`, `style.mdc`, `patterns.mdc`, `helper.mdc`, `root.mdc`, `shared/core.mdc`, `local/project.mdc`, plus hardcoded `SKILL.md` and `CLAUDE.md`). B10 verified indirectly by the existing suite staying green.
    * Tests first: none added here; run the existing suite and confirm zero new failures.

5. **Documentation touch-up.**
    * Files: `packages/docs/docs/plugin-claude/index.md`, `packages/docs/docs/plugin-cursor/index.md`.
    * Changes: scan for any mention of "lowercase", "kebab-case", or "normalized filename" in the rule-emission sections. If present, correct to state that rule filenames preserve source case and only skill directory names are normalized (Claude only, per AgentSkills.io spec). Spot-check result during build.

6. **Full validation.**
    * `pnpm build && pnpm test && pnpm lint && pnpm typecheck` (per `techContext.md`). All 15 turbo tasks must stay green on Node 22.
    * Manual: re-run the converter against a temp tree mirroring the reviewer's setup (`a16n convert --from cursor --to claude --rewrite-path-refs`) and confirm `activeContext.md` appears in the output (not `activecontext.md`). This is the repro-level confirmation.
    * Docusaurus build (`pnpm --filter @a16njs/docs build`) deferred to operator per prior task's precedent; docs edits in step 5 are MDX-safe markdown tweaks.

## Technology Validation

No new technology. All edits are in-place on existing TypeScript modules and Docusaurus markdown.

## Dependencies

* Depends on the already-merged (to this branch) PR #84 work; sits on top of commit `a1e3832d`. No monorepo dep bumps.

## Challenges & Mitigations

* **Challenge:** Case-insensitive FS silently overwriting files when two source names differ only in case. **Mitigation:** step 3 — case-insensitive collision detection in `getUniqueFilename`. Same behavior is a strict safety improvement on both FS kinds.
* **Challenge:** `sanitizeFilename` → `sanitizeSkillDirName` rename + `sanitizeName` → `sanitizeRuleStem` rename is a larger diff than strictly needed. **Mitigation:** the rename is load-bearing for readability (the original name is now actively misleading); call sites already change in the same commit, so the diff is adjacent. If churn becomes a concern during build, the rename can be deferred and the function bodies patched in place — flag this at build time.
* **Challenge:** Cursor **skill dir** case (B8) is deferred; if the operator later decides Cursor skill dirs should also preserve case, that is a separate mini-task (call site `sanitizePromptName` in `plugin-cursor/src/emit.ts`). **Mitigation:** documented explicitly as "not in scope here."
* **Challenge:** Downstream tooling that assumes kebab-lowercase rule filenames. **Mitigation:** none known in the monorepo; the only consumers of these filenames are the file system itself and cross-rewrite in `path-rewriter.ts` (which uses the mapping table, not name conventions). External-user tooling that hardcoded lowercase names would break, but that tooling would already be incorrect per the project's documented behavior (docs don't promise lowercase names). If encountered, revert in a follow-up.
* **Challenge:** `sanitizeRuleStem` body is nearly identical to `sanitizeRuleFilename` minus the basename/ext stripping. **Mitigation:** implement the three-regex step as a small shared local helper `normalizeStemPreservingCase(s)` to avoid duplication; leave `sanitizeRuleFilename` as the only function that does basename extraction + ext stripping.
* **Challenge (scope creep):** Niko's `resources/` → `references/` rename (reviewer's Finding 1). **Mitigation:** explicitly out of scope per operator decision. Will file a separate issue/PR in the Niko repo; not addressed here.
* **Challenge:** Docs-build step is gated on operator. **Mitigation:** keep doc edits in step 5 trivial (prose clarifications, no MDX structural change). If step 5 surfaces nothing to fix, note and move on.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
- [ ] Reflect
