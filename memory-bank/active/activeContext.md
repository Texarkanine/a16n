# Active Context

## Task
Preserve filename case in rule emit (Cursor + Claude) — rework follow-up from PR #84 feedback.

## Task ID
20260421-preserve-filename-case

## Complexity
Level 2

## Phase
PREFLIGHT - COMPLETE (PASS with ADVISORY)

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
Proceed to BUILD phase (`/niko-build`) when the operator is ready. Three advisory findings documented in `memory-bank/active/.preflight-status` for operator consideration (none blocking).
