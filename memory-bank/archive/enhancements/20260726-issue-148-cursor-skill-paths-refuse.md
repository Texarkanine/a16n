---
task_id: issue-148-cursor-skill-paths-refuse
complexity_level: 2
date: 2026-07-26
status: completed
---

# TASK ARCHIVE: Refuse conversion of Cursor skills with `paths:`

## SUMMARY

Cursor `.cursor/skills/*/SKILL.md` may declare harness-specific `paths:` that only *surfaces* the skill's description when matching files are in play. a16n did not model that field, so discovery dropped it silently and conversion produced an always-applicable skill — widening scope. This task refuses such skills at discovery (`WarningCode.Skipped`, no IR item), mirroring Claude's `hooks:` fail-closed pattern. A brief detour that mapped bare `paths:` skills to FileRules was reverted: a globbed rule is always in scope on match, which is a different activation contract and also a widening. Tracked as [#148](https://github.com/Texarkanine/a16n/issues/148); draft PR [#150](https://github.com/Texarkanine/a16n/pull/150).

## REQUIREMENTS

1. Detect Cursor skill frontmatter that includes `paths:`.
2. Refuse conversion so scope is never widened by silent drop (not WARN-and-emit).
3. Surface the refusal clearly (`Skipped` naming `paths:` / scope).
4. Leave skills without `paths:` unaffected.
5. Do not map skill `paths:` to FileRule (progressive disclosure ≠ always-in-scope rule).

## IMPLEMENTATION

Discover-time key-presence check in `packages/plugin-cursor/src/discover.ts`: if `'paths' in data`, push `Skipped` and `continue` before classification (covers SimpleAgentSkill, ManualPrompt, and AgentSkillIO routes). `hasPaths` lives on `SkillFrontmatter` (Claude `hasHooks` symmetry). No IR modeling of `paths:`. Docs: `packages/plugin-cursor/README.md`, `memory-bank/systemPatterns.md` (Cursor skill classification + fail-closed case).

## TESTING

- Unit: `packages/plugin-cursor/test/discover-skills.test.ts` — refuse for SAS / AgentSkillIO / ManualPrompt / empty / string `paths:`; unaffected without `paths:`.
- Integration (negative only): `cursor-skill-paths-refuse-to-claude` fixture + case in `integration-filerule-skill.test.ts`.
- Full monorepo `pnpm test` / `pnpm typecheck` green during build; refuse cases re-verified after FileRule revert. `/niko-qa` PASS.

## LESSONS LEARNED

- For Category A fields that widen behavior if dropped, discover-skip is the right refuse shape; emit-side Skipped-with-bytes (`allowed-tools`) is a different safety question.
- Skill `paths:` ≠ FileRule globs: disclosure vs always-in-scope. "Looks like the same patterns" is not semantic equivalence.
- For refuse-only work, integration needs only the negative case; a positive conversion fixture is N/A.
- Copy sibling-plugin field placement (`hasHooks` → `hasPaths` on frontmatter) in the first draft to avoid QA style nits.

## PROCESS IMPROVEMENTS

When a translation looks "smart" (skill paths → FileRule), pause on activation semantics before coding — progressive disclosure vs auto-inject is easy to miss and expensive to thrash through revert.

## TECHNICAL IMPROVEMENTS

None beyond the shipped refuse path. True survival would need IR modeling of progressive path-scoping (not FileRule), which remains out of scope.

## NEXT STEPS

None required for #148. Optional later: model harness path-scoping in the IR if a target can express the same disclosure contract. Merge/archive PR #150 when ready (`/apply-worktree` from the issue-148 worktree).
