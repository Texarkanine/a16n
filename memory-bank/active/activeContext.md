# Active Context

## Current Task: issue-142-spec-compliance-gates
**Phase:** BUILD - COMPLETE

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
  - Gate removal does not cause this, but widens the aperture.

## Operator Decisions (cont.)
- **OQ4 — command frontmatter: preserve it, and warn.** Every option offered assumed the frontmatter was a problem to remove; all were wrong for the same reason — they reasoned about what the *harness* means by those bytes instead of what the *user* meant. The user wrote them and may well have wanted them (cf. how this repo uses frontmatter in `memory-bank/archive`). a16n just cannot respond to them semantically.
  - Content handling is **unchanged**: `discoverCommands()` keeps storing raw bytes. No `parseMdc()` on commands, no `metadata` extraction, no stripping. The leading `---` block in the emitted skill body is preserved user content, which is the desired outcome.
  - New courtesy advisory in `plugin-cursor`: one `WarningCode.Approximated` per frontmatter-bearing command, saying Cursor commands do not support frontmatter and the block is being kept as body content.
  - Detection via a new exported `hasFrontmatterBlock()` in `mdc.ts`, requiring a leading `---`, a closing `---`, and at least one YAML-ish key line between — so markdown thematic breaks do not trigger it.
  - Byte-identity is now the correct test assertion everywhere, reversing what Finding C originally recommended.
  - **The bug was never the passthrough; it was the silence.**
- One in-scope amendment accepted: export a single `NON_SPEC_FEATURES` array so the feature list is not hand-copied into four drifting places.

## Build Phase Outcome
- All 11 implementation steps complete, built to plan. Full suite green: **1042 tests**, zero failures. `pnpm build`, `pnpm typecheck` pass. (`pnpm lint` is a no-op in this repo — no package defines a `lint` task.)
- Two commits, one per half:
  - `ce21f318 fix(plugin-cursor): discover all commands, warn on frontmatter passthrough`
  - `5b46f4ab feat(plugin-claude): warn when a skill uses non-spec features`
- **Files created:** `packages/plugin-claude/src/spec-compliance.ts`, `packages/plugin-claude/test/{spec-compliance,discover-spec-compliance}.test.ts`, fixtures `cursor-command-mentions/` (2 commands) and `claude-skills-nonspec/` (3 skills).
- **Files modified:** `plugin-cursor/src/{discover,mdc}.ts`, `plugin-cursor/test/{discover-commands,mdc}.test.ts`, `plugin-claude/src/discover.ts`, `cli/test/integration/integration-commands.test.ts`, four docs files, `systemPatterns.md`.
- **Fixture renamed:** `cursor-command-complex/` → `cursor-command-runtime-features/` (the name no longer described anything complex).
- Blast-radius prediction from preflight Finding A held exactly: **zero churn to any pre-existing assertion** outside the three files the plan named. No existing Claude fixture newly warns.

## Build Implementation Decisions
- **"An item was produced" implemented as a watermark**, not a branch restructure: `const itemsBefore = items.length` before the classification chain, `if (items.length > itemsBefore)` after it. Smallest diff that satisfies the preflight correction, and it stays correct if further `continue` branches are added later.
- **`hasFrontmatterBlock()` is 6 lines** over `content.split('\n')` — first non-empty line is `---`, some later line is `---`, at least one line between matches `/^[A-Za-z_][\w-]*\s*:/`. No YAML parse, matching the plan's three-condition rule verbatim.
- **`NON_SPEC_FEATURES` is derived, not hand-listed twice**: the nine frontmatter keys are spread from one array via `.map()`, so key list and label list cannot drift. The detector reads `feature.id in frontmatter` as its fallback predicate, so adding a key to that array is the only edit needed to support it.
- **`@path` regex terminates the extension with a lookahead** (`\S+\.[A-Za-z0-9]{1,4}(?=[\s.,;:!?)\]]|$)`) rather than consuming trailing punctuation, so `@src/utils.js.` at end of sentence still matches.
- **Advisory label style is the literal syntax** (`argument-hint:`, `$ARGUMENTS`, `` !`cmd` bash injection ``) so the warning names what the user can grep for in their own file.

## Deviations from Plan
- **Claude-migrated command fixture placement.** Step 2 said "add to `cursor-command-mentions/` (or a sibling)". Put `pr.md` in `cursor-command-runtime-features/` instead, keeping `cursor-command-mentions/` a pure zero-warning #142 regression — a fixture that asserts `warnings).toHaveLength(0)` at whole-fixture granularity is a stronger statement than one scoped per source path.
- **One extra docs file.** Also updated `packages/docs/docs/plugin-claude/index.md`, which enumerates Claude discovery dispositions and would otherwise have been the only page not mentioning the new advisory. Step 9 listed four files; this is a fifth of the same kind.
- **Two issues filed, not one.** Step 10 called for the Category-B issue plus a separate `--delete-source` filing: [#143](https://github.com/Texarkanine/a16n/issues/143) (spec-compliant fields dropped by the IR) and [#144](https://github.com/Texarkanine/a16n/issues/144) (`--delete-source` safety rests entirely on `Skipped`).

## QA Phase Outcome
- **PASS.** Full pipeline re-run independently at QA time: 1042 tests green, `pnpm build` + `pnpm typecheck` clean, `pnpm lint` confirmed vacuous (Turbo runs zero tasks).
- **One fix applied:** positional-argument pattern `/\$[0-9]/` → `/\$[1-9]/` in `spec-compliance.ts`. `$0` is not a Claude positional; the feature's own label reads "$1 positional arguments" and the deleted gate used `[1-9]`.
- **`named-arguments` trimmed on operator decision.** Proven empirically that it never fires without `arguments:` also firing. Removed the feature, `declaredArgumentNames()`, its test case, and the README cell. Suite 1042 → 1041, warning counts unchanged on every input.
- **One observation left open:** `techContext.md`'s "Full validation" line lists `pnpm lint`, which runs nothing. Pre-existing, out of scope.
- **`positional-arguments` trimmed on the generalized rule.** I argued to keep its `argument-hint:`-gated path; operator overruled. Removed the feature, its gate, and `declaresArguments`.
- **Rule made self-enforcing:** per-feature test assertion tightened from `toContain(label)` to `toEqual([label])`, so a detector that cannot warn on its own now fails CI the day it is added.
- **Net:** `NON_SPEC_FEATURES` 15 → 13, suite 1042 → 1038, warning counts unchanged on every possible input.

## Operator Decisions (QA)
- **"Our job is not to lint people's files. Our job is to faithfully convert them and be honest about WHEN we cannot."** Resolved the `named-arguments` scope question and generalized past it.
- **"Detectors that can't fire alone get cut; we keep only the top-level detectors we need so that we DO emit a warning when something that should warn, happens."** The operational form of the above, and the one that decided `positional-arguments` against my recommendation to keep half of it. Recorded in the warn-and-continue section of `systemPatterns.md` and enforced by test.
- **Clean on every other axis:** no orphaned gate references in source/tests/fixtures/docs, no TODOs or debug artifacts, docs complete across five surfaces, `plugin-claude/README.md` feature table matches `NON_SPEC_FEATURES` exactly.

## Next Step
- QA **PASSED**. Reflection runs next (`/niko-reflect`).
