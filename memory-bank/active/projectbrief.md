# Project Brief

## User Story

As a developer converting agent customizations between harnesses with `a16n`, I want conversion gates to reflect what the AgentSkills.io spec and each harness actually support today, so that my valid Cursor commands are not silently dropped and my Claude-specific skill features are not silently degraded without warning.

## Use-Case(s)

### Use-Case 1: Cursor commands containing ordinary `@mentions` convert cleanly

A user has `.cursor/commands/pr-feedback-judge.md` containing GitHub-style prose mentions (`by @author`, table cells `@reviewer`) and `.cursor/commands/wiggum-niko-coderabbit-pr.md` containing `gh pr comment <n> --body "@coderabbitai review"`. Running `a16n convert` discovers both as ManualPrompts instead of hard-skipping them as "not convertible to Claude" ([issue #142](https://github.com/Texarkanine/a16n/issues/142)).

### Use-Case 2: Claude skills using non-spec features warn on ingest

A user converts a `.claude/skills/deploy/SKILL.md` that uses `$ARGUMENTS`, `` !`gh pr diff` ``, `argument-hint:`, and `context: fork`. Discovery surfaces a single advisory warning naming the non-spec features, because a16n's IR is AgentSkills.io-shaped and those features do not survive to spec-only consumers.

## Requirements

1. Remove the obsolete complexity gate from `plugin-cursor` command discovery: delete `COMPLEX_COMMAND_PATTERNS` and `isComplexCommand()`; discover all `.cursor/commands/**/*.md` as ManualPrompts.
2. Add AgentSkills.io spec-compliance detection to `plugin-claude` skill discovery covering **all** non-spec Claude features — both body-level substitutions and frontmatter keys.
3. Report detection results as **one warning per skill**, listing all detected features, worded against the AgentSkills.io spec (matching the existing `hooks:` message style) rather than against any emit target.
4. Use `WarningCode.Approximated` for features whose content survives ingest but whose runtime behavior is lost; reserve `WarningCode.Skipped` for genuinely unrepresentable items.
5. Re-evaluate whether `hooks:` should remain a hard `Skipped`, and implement the outcome of that evaluation.
6. Add regression fixtures covering the `@reviewer` / `@coderabbitai` false-positive class from issue #142.
7. Update affected documentation: `packages/plugin-cursor/README.md` "Complex commands" table, `packages/plugin-claude/README.md`, and the Claude classification priority order in `memory-bank/systemPatterns.md`.
8. Post the spec research findings as a comment on issue #142.

## Constraints

1. **Detection must not recreate the #142 bug class.** Every new pattern must be validated against realistic false-positive content (prose `@mentions`, shell snippets, fenced examples that merely *discuss* Claude syntax). Over-broad patterns are the defect under repair.
2. Follow TDD per `.cursor/rules/shared/always-tdd.mdc` — tests written and failing before implementation.
3. Preserve the intentional discover/emit asymmetry documented in `systemPatterns.md`; Cursor commands remain legacy-support discovery that emits as skills.
4. No target-awareness may be threaded into `discover()` — the `A16nPlugin` contract stays `discover` + `emit` with spec-shaped IR between them.
5. Warning wording must reference the AgentSkills.io spec, never a specific destination harness.

## Acceptance Criteria

1. The two commands from issue #142 discover as ManualPrompts with zero warnings.
2. No `COMPLEX_COMMAND_PATTERNS` / `isComplexCommand` remain in `plugin-cursor`.
3. A Claude skill using non-spec features yields exactly one `Approximated` warning naming those features; a fully spec-compliant skill yields none.
4. False-positive fixtures (prose `@mentions`, `@` inside shell strings) produce no warnings.
5. The `hooks:` disposition decision is recorded with rationale in the creative-phase doc and reflected in code.
6. `pnpm build && pnpm test && pnpm typecheck` all pass. (`pnpm lint` was listed here originally, but it executes zero tasks — no package in this repo defines a `lint` script — so it verifies nothing and cannot be counted as coverage.)
7. Issue #142 carries a comment with the spec research.
