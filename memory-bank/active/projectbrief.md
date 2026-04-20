# Project Brief: Fix skills docs inaccuracy and --rewrite-path-refs for ride-along files

## Context

Two related bugs were surfaced by a repro in `/tmp/skillcheck` (a Cursor skill with a ride-along `scripts/gotthis.sh`), converted via `npx a16n convert --from cursor --to claude --rewrite-path-refs`.

## Bug 1 — Docs inaccuracy

`packages/docs/docs/plugin-cursor/index.md` (lines 19–36) and `packages/docs/docs/plugin-claude/index.md` (lines 18–35) state that skills with multiple files / resources / hooks are "Skipped with Warning" or just "Skipped".

Reality (in `packages/plugin-cursor/src/discover.ts` and `packages/plugin-claude/src/discover.ts`):
- Cursor: skills with ride-along files are classified as `AgentSkillIO` and fully converted (SKILL.md + resources). Only skipped if they lack a `description`.
- Claude: same, except skills with `hooks:` frontmatter ARE skipped (hooks not supported by AgentSkills.io).

Docs need to be corrected on both pages.

## Bug 2 — `--rewrite-path-refs` ignores ride-along files

In the repro, the Cursor SKILL.md body contains a literal reference `.cursor/skills/check/scripts/gotthis.sh`. After conversion:
- `.claude/skills/check/SKILL.md` is emitted (body unchanged; still references `.cursor/skills/check/scripts/gotthis.sh`).
- `.claude/skills/check/scripts/gotthis.sh` is emitted (copied correctly).

So the resource file is copied, but the reference inside SKILL.md is NOT rewritten to `.claude/skills/check/scripts/gotthis.sh`.

Root cause (from `packages/engine/src/path-rewriter.ts`): the mapping is built from `WrittenFile.sourceItems[*].sourcePath`. For `AgentSkillIO`, every emitted WrittenFile (SKILL.md and every resource) has `sourceItems: [skill]` — all pointing at the single skill sourcePath (`.cursor/skills/check/SKILL.md`). The ride-along resource files have no source-to-target mapping of their own, so references to them in the SKILL.md body never get rewritten.

## Goal

1. Make the docs accurately describe complex-skill handling for both plugins.
2. Fix `--rewrite-path-refs` so references to ride-along resource files in the SKILL.md body are rewritten to their new target paths — without polluting the IR (`AgentSkillIO`) or the output, and without overcomplicating the engine.
3. Also rewrite path references *inside* ride-along files that live in the two AgentSkills.io-spec-designated text subtrees: `scripts/` (executable code) and `references/` (additional docs). `assets/` and any other subtree are left untouched (may be binary / placeholder-laden / non-text by convention). Document this behaviour and its scope clearly in the `--rewrite-path-refs` documentation.

## Non-Goals

- Changing the `AgentSkillIO` IR shape unless strictly necessary.
- Rewriting references inside `assets/**` or any ride-along subtree other than `scripts/` and `references/` (per the [AgentSkills.io spec](https://agentskills.io/specification#optional-directories), these are the spec's two text-by-convention subtrees).
- Handling Claude → Cursor or cross-format symmetry beyond what falls out naturally from a minimal fix.
