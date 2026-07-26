---
task_id: issue-147-manualprompt-description
complexity_level: 2
date: 2026-07-26
status: completed
---

# TASK ARCHIVE: Preserve authored description on ManualPrompt

## SUMMARY

Skills with `disable-model-invocation: true` classify as `ManualPrompt`. That type had no `description` field, so authored prose was dropped at discover and both skill emitters always wrote `Invoke with /<promptName>`. Round-trips silently replaced real descriptions with boilerplate.

This task added optional `description?: string` on `ManualPrompt`, preserved it through Claude/Cursor discover and `plugin-a16n` IR (`v1beta4`), and changed emit to `prompt.description ?? synthesize`. Command-origin prompts still synthesize when absent. `agentsmd` continues to mark the whole type unsupported without inventing a description. Tracked as [#147](https://github.com/Texarkanine/a16n/issues/147); draft PR [#151](https://github.com/Texarkanine/a16n/pull/151).

## REQUIREMENTS

From the project brief: *as a developer converting agent skills with `a16n`, I want a skill's authored `description` to survive when classified as `ManualPrompt`, so round-trips do not silently replace real prose with synthesized boilerplate.*

1. Preserve authored `description` on `ManualPrompt` when present (discover, IR, emit).
2. Synthesize `Invoke with /<promptName>` only when absent and the target requires a description.
3. When a target cannot carry ManualPrompt / the description, do not silently substitute boilerplate (agentsmd `unsupported`).
4. Option 1 only — optional field on ManualPrompt; keep `disable-model-invocation` → ManualPrompt classification (not option 2).

**Acceptance:** Claude skill with `disable-model-invocation: true` + real `description:` round-trips through `.a16n/` intact; cannot-carry path does not invent boilerplate over authored text.

All requirements shipped. Cannot-carry is agentsmd type-level `unsupported` (live skill surfaces *can* carry the field after #99); field-level Approximated warning was not needed.

## IMPLEMENTATION

- **Models:** `ManualPrompt.description?: string`; `CURRENT_IR_VERSION` → `v1beta4`.
- **Discover:** Claude + Cursor skill paths copy non-empty frontmatter `description`; commands leave it undefined.
- **IR:** `plugin-a16n` format/parse write/read optional `description`.
- **Emit:** Claude + Cursor `formatManualPromptAsSkill` use `prompt.description ?? \`Invoke with /${prompt.promptName}\``.
- **Docs:** models index + plugin-a16n version examples; Claude README ManualPrompt emit note.
- **Direction confirmed at plan time:** Cursor and Claude both implement `disable-model-invocation`; agentskills proposal exists but is not in the official spec — keep special-casing via ManualPrompt classification, do not pre-model the flag in the AgentSkills.io field set.

## TESTING

TDD per step. New/extended coverage: models type + version; Claude/Cursor discover preserve + command `description` undefined; Claude/Cursor emit preserve ‖ synthesize; a16n format/parse/fixture round-trip; agentsmd unsupported with authored description. Full `pnpm build && pnpm test -- --force && pnpm typecheck` green. Preflight + QA PASS.

## LESSONS LEARNED

- Diagnose fidelity against **current** emit paths. After #99, ManualPrompt already emits to skills that can carry `description`; the live bug was silent overwrite on a carrying surface, not a missing command emit path.
- If ManualPrompt had always been “skill-shaped IR with optional authored description + synthesize-when-absent,” #143’s `AgentSkillSpecFields` work and this change would have been one IR story. This task completed that shape for `description`.

## PROCESS IMPROVEMENTS

Nothing notable beyond clean Level 2 TDD execution (worktree needed a one-time `pnpm install` — no `worktrees.json` setup).

## TECHNICAL IMPROVEMENTS

Optional shared `resolveManualPromptDescription` helper could dedupe the identical Claude/Cursor emit one-liner — deferred as not worth a module for two call sites.

## NEXT STEPS

- PR [#151](https://github.com/Texarkanine/a16n/pull/151): Greptile noted forward-compat docs omit `v1beta3` from the “v1beta4 can read …” example — small doc fix still open on that PR.
- Merge via `/apply-worktree` when ready; close #147 with the merge.
