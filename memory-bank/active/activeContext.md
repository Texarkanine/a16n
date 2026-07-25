# Active Context

## Current Task: issue-142-spec-compliance-gates
**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

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

## Plan Phase Outcome
- Posted the spec research to issue #142 ([comment](https://github.com/Texarkanine/a16n/issues/142#issuecomment-5080265945)).
- Component analysis: 10 affected files across `plugin-cursor`, `plugin-claude`, `cli`, and docs. No `A16nPlugin` interface change; the blast radius is the observable warning surface.
- Discovered a **third fidelity category** the operator's framing did not cover: spec-compliant fields (`allowed-tools`, `license`, `compatibility`) that a16n's IR silently drops anyway. Scoped **out** (OQ3) as a distinct defect; filing a separate issue is an explicit plan deliverable.
- **OQ1 resolved** (`creative-body-feature-detection.md`): frontmatter-gated hybrid detection. Two findings drove it — Claude does *not* exempt fenced code blocks from substitution, so fence-stripping is semantically wrong; and because these warnings are `Approximated` rather than `Skipped`, a false positive costs one advisory line instead of dropping content, which inverts the calibration relative to #142.
- **OQ2 resolved** (`creative-hooks-disposition.md`): keep `hooks:` as a hard `Skipped`. Generalized into a reusable disposition rule — *loss that silently removes an author-specified restriction fails closed; loss that visibly breaks a substitution fails open.* Zero churn to existing hooks tests and docs.
- 11 ordered implementation steps, 40+ enumerated test behaviors, no new dependencies.

## Preflight Phase Outcome
- **PASS WITH ADVISORY.** The approach, taxonomy, and both creative decisions survived validation unchanged; every blocking-class finding was a plan-accuracy defect, fixed in place.
- Corrected three factual errors about the codebase and one TDD ordering defect in `tasks.md`:
  - `plugin-claude` has **no** `discoverSkills()` — the skill loop is inlined in `discover()` (lines 376–478). The plan and `creative-body-feature-detection.md` both named it by analogy to `plugin-cursor`.
  - "Emit the advisory after the `hooks:` skip" would double-warn: three later branches also `continue` without producing an item. Correct predicate is *an item was produced*.
  - Step 9 missed two hand-maintained docs-site pages (`docs/plugin-cursor/index.md:37`, `docs/understanding-conversions/index.md:82`).
  - Steps 3/4 swapped so the CLI integration test inversion precedes the gate deletion.
- Discharged the plan's largest flagged unknown by scripted scan: **no** existing Claude fixture trips the new detector (only the two `hooks:` fixtures match, and both are skipped before detection), and only the two already-named Cursor fixture dirs change item counts.
- **Finding C — CORRECTED, now blocking on a scope decision (OQ4).** Initially recorded as a non-blocking advisory because the malformed emit looked "only reachable via fixtures encoding input Cursor cannot produce." That reasoning was backwards — it used the artificiality of a16n's own fixtures as evidence about what users can write. Operator challenged it; direct experiment against unmodified `main` disproved it.
  - Any `.cursor/commands/*.md` whose content begins with a `---` block is **silently corrupted today**, gate in place, zero warnings. The gate never masked this — it only masked the subset that also contained `allowed-tools`/`@`/`$ARGUMENTS`/`` !`cmd` ``.
  - Likeliest victim is a16n's core user: Claude Code commands *do* support frontmatter, so half-migrated config hits it. A plain markdown thematic break (`---` as a title rule) hits it too.
  - Survives round-trip unchanged (never self-heals), and `--delete-source` deletes the original — the malformed skill becomes the only artifact.
  - Root cause is an IR inconsistency a16n owns: `ManualPrompt.content` means "raw bytes" from `discoverCommands()` but "body only" from `classifyRule()`.
  - Gate removal does not cause this, but widens the aperture. Awaiting operator's OQ4 call before build.
- One in-scope amendment accepted: export a single `NON_SPEC_FEATURES` array so the feature list is not hand-copied into four drifting places.

## Next Step
- **Operator must resolve OQ4** (fix the command-frontmatter passthrough in this task, fix-and-map, or defer). Then run `/niko-build`.
