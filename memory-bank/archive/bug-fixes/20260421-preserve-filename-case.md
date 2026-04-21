---
task_id: 20260421-preserve-filename-case
complexity_level: 2
date: 2026-04-21
status: completed
---

# TASK ARCHIVE: Preserve filename case in rule emit (Cursor + Claude)

## SUMMARY

PR #84 rework: rule files under `.cursor/rules/**` and `.claude/rules/**` were lowercased on emit (e.g. `activeContext.mdc` → `activecontext.md`) without spec mandate. AgentSkills.io requires lowercase-kebab only for skill **directory** names (and thus skill dirs in both plugins). Split normalization **by intent** in `plugin-claude` (`sanitizeRuleFilename`, `sanitizeRuleStem`, `sanitizeSkillDirName`); widened regex and removed lowercasing for rule filenames in `plugin-cursor` (`sanitizeFilename` body + GlobalPrompt inline stem). Added **plugin-local** case-insensitive collision helpers so case-only pairs do not silently overwrite on case-insensitive filesystems; **did not** change public `@a16njs/models::getUniqueFilename` (semver preserved).

## REQUIREMENTS

- Preserve source filename case for rule emits (B1–B2, B6–B7); keep skill directory names lowercase per spec (B3–B5, B8).
- Case-insensitive collision safety (B9); lowercase fixtures remain byte-stable (B10); leading-dot filenames unchanged (B11).
- TDD: tests in existing `emit.test.ts` files only; no public models API behaviour change.

## IMPLEMENTATION

- **`packages/plugin-claude/src/emit.ts`:** Renamed `sanitizeFilename` → `sanitizeSkillDirName` (skill dirs); `sanitizeName` → `sanitizeRuleStem`; added `sanitizeRuleFilename`, shared `normalizeStemPreservingCase`, plugin-local `getUniqueFilenameCI`; dropped `@a16njs/models` `getUniqueFilename` import; five call sites updated.
- **`packages/plugin-cursor/src/emit.ts`:** `sanitizeFilename` preserves case, regex `[^A-Za-z0-9]+`; GlobalPrompt stem preserves case; private `getUniqueFilename` compares case-insensitively; `sanitizePromptName` unchanged for skill dirs.
- **Tests:** `packages/plugin-claude/test/emit.test.ts`, `packages/plugin-cursor/test/emit.test.ts` — new case-preservation and collision cases; two pre-existing cursor tests updated from legacy lowercasing expectations.

## TESTING

- Full `pnpm` validation on Node 22: 15/15 turbo tasks green.
- Manual: `a16n convert --from cursor --to claude --rewrite-path-refs` on mirror of Niko rules → `activeContext.md` preserved in output path.

## LESSONS LEARNED

- **Intent-named helpers** (`sanitizeRuleFilename` vs `sanitizeSkillDirName`) reduce wrong-helper mistakes at new call sites.
- **Case policy belongs in plugins**, not the shared models helper — avoids whitebox coupling and preserves semver for `@a16njs/models@0.12.0`.
- **Tests that passed before the fix** (B3–B5, B11) still document non-regression for the intent-split.
- **Plan review after preflight** caught a semver-breaking idea (changing shared `getUniqueFilename`) and recharacterized B8: Cursor skill dirs are spec-mandated lowercase via AgentSkills.io + parent-directory rule, not “a16n convention.”
- **Cursor agent shell** may put `cursor-server`’s Node 20 ahead of nvm 22 on `PATH` — same class of issue as prior task; consider documenting in `techContext.md` or CI env check.

## PROCESS IMPROVEMENTS

- Treat “preflight PASS” as not freezing the plan; operator critical re-read between preflight and build caught high-impact issues cheaply.
- State a one-sentence **operating principle** when cross-cutting (preserve case by default; exceptions only where target spec requires).

## TECHNICAL IMPROVEMENTS

- Optional later consolidation: promote rule/skill sanitizers to shared package, unify naming in plugin-cursor, centralize collision policy at write boundary (see reflection “million-dollar question”).

## NEXT STEPS

- None required for this archive. Out of scope: Niko `resources/` → `references/` rename; extending rewrite allowlist to non-spec subtrees.
