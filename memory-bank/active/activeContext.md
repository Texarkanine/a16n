# Active Context

## Task
Preserve filename case in rule emit (Cursor + Claude) — rework follow-up from PR #84 feedback.

## Task ID
20260421-preserve-filename-case

## Complexity
Level 2

## Phase
PLAN - COMPLETE

## Summary
Rule filenames (`.claude/rules/**/*.md`, `.cursor/rules/**/*.mdc`) are being lowercased unnecessarily during emit, e.g. `activeContext.mdc` → `activecontext.md`. The only spec-mandated lowercasing is on AgentSkills.io skill **directory** names (which must match `^[a-z0-9-]+$` per the spec's `name` field). Split normalization by intent: `sanitizeSkillDirName` for skill dir names (keeps lowercasing per spec), `sanitizeRuleFilename` / `sanitizeRuleStem` for rule filenames (preserve source case). Symmetric change across `plugin-claude` and `plugin-cursor`. Adds case-insensitive collision detection in `getUniqueFilename` so case-only differences never silently overwrite on case-insensitive filesystems.

Explicit scope decisions:
- Out of scope: extending a16n's rewrite allowlist to cover `resources/` (reviewer's Finding 1). Niko uses a non-spec `resources/` dir; that's a Niko-repo bug to rename to `references/` (which a16n already handles).
- Out of scope: Cursor skill directory case preservation. Cursor's `sanitizePromptName` continues to lowercase skill dirs; revisit as a separate mini-task if the operator decides it's needed.

## Prior Task Archive Status
`20260420-skills-docs-and-rewrite-resources` completed Reflect on 2026-04-21 but not yet archived — both tasks ship in the same PR (#84, branch `discover-skills-with-files`). Archive can batch both or run them back-to-back once this follow-up task completes.

## Next Step
Proceed to PREFLIGHT phase when the operator is ready.
