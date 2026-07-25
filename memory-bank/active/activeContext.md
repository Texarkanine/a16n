# Active Context

## Current Task: issue-142-spec-compliance-gates
**Phase:** COMPLEXITY-ANALYSIS - COMPLETE

## What Was Done
- Pre-verified issue #142's premise against current primary sources instead of taking it at face value. Result: the premise inverts.
  - **Cursor** documents `@` only as a chat-input attachment mechanism; no source shows `@path` expanding inside `.cursor/commands/*.md` or `SKILL.md` bodies.
  - **Claude** *does* document `@path/to/file` as a body-level "include file contents" feature (Anthropic's own `plugin-dev/skills/command-development` skill), though it is absent from the current top-level skills reference substitution table.
  - So `fileRefs: /@\S+/` guards a Cursor feature that appears not to exist, and labels it "not convertible to Claude" when Claude is the harness that *does* support it.
- Established that **all four** `COMPLEX_COMMAND_PATTERNS` reasons are obsolete: Claude skills natively support `$ARGUMENTS` / `$ARGUMENTS[N]` / `$N` / `$name`, `` !`cmd` `` bash injection, and `allowed-tools` (the last being in the AgentSkills.io spec itself).
- Confirmed both harnesses exceed the AgentSkills.io spec (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`):
  - Cursor adds only `paths` (+ legacy `globs`) and `disable-model-invocation` — both already first-class in a16n's IR.
  - Claude adds `paths`, `disable-model-invocation`, `user-invocable`, `argument-hint`, `arguments`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `shell`, `hooks`, plus body substitutions `$ARGUMENTS`/`$N`/`$name`/`${CLAUDE_*}` and `` !`cmd` ``.
- Verified Claude merged custom commands into skills: `code.claude.com/docs/en/slash-commands.md` and `.../skills` serve byte-identical content (md5 match). Cursor deprecated commands (`cursor.com/docs/commands.md` → 404) and ships `/migrate-to-skills`, which converts commands to skills with `disable-model-invocation: true` — matching what a16n's ManualPrompt emit already does.
- Identified the correct architectural framing (operator correction): the interop contract is **the spec**, not a target harness. a16n's IR is spec-shaped, so any source-harness extension is a portability hazard at ingest regardless of destination. `plugin-claude` already implements exactly this for `hooks:` ("Hooks are not supported by AgentSkills.io") — it is the sole non-spec feature currently detected.
- Concluded the gate is on the wrong plugin: a16n gated the nearly-spec-compliant harness (Cursor) and left the genuine superset (Claude) almost entirely ungated.

## Operator Decisions
- **Scope:** delete the `plugin-cursor` complexity gate entirely **and** add spec-compliance detection to `plugin-claude` in this same task (rejected both the conservative regex-tightening and the gate-relocation options).
- **Detection coverage:** *everything* non-spec — body-level substitutions **and** non-spec frontmatter keys — and additionally reconsider whether `hooks:` should remain a hard skip.
- **Granularity:** one warning per skill listing all detected features (not one per feature).
- **Issue #142:** post the spec research as a comment before/alongside the work.

## Next Step
- Load `.cursor/skills/shared/niko/references/level3/level3-workflow.md` and begin the Level 3 PLAN phase.
