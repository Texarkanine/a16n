---
task_id: 20260420-skills-docs-and-rewrite-resources
complexity_level: 2
date: 2026-04-21
status: completed
---

# TASK ARCHIVE: Fix skills docs + `--rewrite-path-refs` for AgentSkillIO

## SUMMARY

Fixed three related defects from a single repro: inaccurate `plugin-cursor` / `plugin-claude` docs for complex skills, `--rewrite-path-refs` missing mappings for AgentSkillIO ride-along resource paths (so SKILL.md still pointed at `.cursor/...` after conversion), and unrewritten references inside those ride-along files. Shipped a minimal IR-preserving engine change (`WrittenFile.sourcePaths?`), bounded rewrite scope to AgentSkills.io text subtrees `scripts/**` and `references/**` (not `assets/**`), collision-detection lint on `buildMapping` (`{ mapping, warnings }`), and docs updates for CLI and plugins. QA also fixed a latent CLI symlink / main-module detection bug in `cli/src/index.ts` (device+inode `statSync` instead of fragile `realpathSync` string compare) that caused silent exit 0 with empty stdout under `npx a16n`.

**Post-reflection (PR #84 review):** `buildMapping` now filters empty strings from explicit `file.sourcePaths` (mirrors `sourceItems` fallback); `applyMapping` skips empty keys (defence-in-depth against infinite loop on `indexOf('')`). `path-rewriter.test.ts` gained P27/P28. CI4 Behaviour 8 orphan-scope test was tightened to use unmapped refs so the assertion would fail if scope-skip regressed.

## REQUIREMENTS

- Correct docs: complex skills with ride-alongs are converted (not “skipped”) except where the target truly cannot support them (e.g. Claude `hooks:`).
- Rewrite path refs in SKILL.md bodies to ride-along resources after conversion.
- Rewrite refs inside ride-along files only under `scripts/` and `references/`; leave `assets/` and other subtrees untouched; document scope in CLI/docs.
- Optional additive `WrittenFile.sourcePaths` replaces `sourceItems`-derived mapping per file when set; collision lint warns on ambiguous mappings.
- Full validation on Node 22; no IR pollution.

## IMPLEMENTATION

- **Engine:** `packages/engine/src/path-rewriter.ts` — `buildMapping` / `applyMapping`, `isRewritableSkillResource`, empty-key handling; `transformation.ts` destructures `{ mapping, warnings }`.
- **Models:** `WrittenFile.sourcePaths` (optional).
- **Plugins:** Cursor/Claude emit populate `sourcePaths` for AgentSkillIO written files as needed; discover/docs aligned.
- **CLI:** `packages/cli/src/index.ts` — symlink-safe main-module check; integration tests (CI1–CI4) including orphan-scope hardening.
- **Docs:** `packages/docs/docs/plugin-*/index.md`, CLI “what gets rewritten” documentation.

## TESTING

- Build: nine plan steps, conventional commits; surgical engine change.
- QA: full turbo matrix on Node 22 (not only changed packages); semantic QA pass; CI integration suite green.
- Post-review: engine tests P27/P28; CLI integration CI4 assertion fix.

## LESSONS LEARNED

- `WrittenFile.sourcePaths` as optional additive field with `sourceItems` fallback avoids 1:N clobber; collision lint guides future plugins.
- `realpathSync` string compare for “am I main?” is fragile; `statSync` dev+ino is robust for symlinked `.bin` entrypoints.
- **Node-version drift pollutes narrative:** a Node 20 run produced a failing test that was mis-documented as a repo-level “Workspace blocker”; re-verify on Node 22 before freezing phase notes.
- **Tests that would pass if behaviour were inverted are useless:** orphan-scope test needed unmapped paths in payloads to pin “assets/data not scanned.”
- **Parallel code paths need parallel defences:** explicit `sourcePaths` branch needed the same empty filtering as the `sourceItems` fallback.

## PROCESS IMPROVEMENTS

- Print/assert Node version before test runs in phases that commit memory-bank narrative.
- Run full suite in QA for cross-package tasks.
- Mid-preflight amendments to `tasks.md` + `.preflight-status` worked well for Level 2 scope tweaks.

## TECHNICAL IMPROVEMENTS

- Long-term: `planning/writtenfile-clean-break.md` (Flavor B) for a cleaner single source-attribution model; `planning/cli-entry-point-split.md` to remove main-module heuristic entirely.

## NEXT STEPS

- None required for this archive. Optional follow-ups live in planning docs above.
