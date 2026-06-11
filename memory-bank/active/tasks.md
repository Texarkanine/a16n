# Tasks: agentsmd-plugin

Add included plugin `@a16njs/plugin-agentsmd` for AGENTS.md discovery & emission (Issue #50).

> Plan in progress. Open questions below are being resolved via creative phases; the full plan will replace this file's contents when planning completes.

## Open Questions

### OQ1: IR mapping for nested AGENTS.md (and the converse emission placement)

**Problem statement:** When discovery finds `packages/foo/AGENTS.md`, what IR type should it produce? And symmetrically: when emitting to AGENTS.md format, what signal places an item at `packages/foo/AGENTS.md` vs root `AGENTS.md`?

**Why it's ambiguous:**
- The operator described nested AGENTS.md as "path-scoped global prompts" — but the IR has no path-scoped GlobalPrompt concept. `GlobalPrompt.relativeDir` is *file-organization* metadata (where the rule file sits under a rules dir), not *scoping semantics*.
- The operator's stated expectation for the Claude escape path (`.claude/rules/*.md` with `paths:` frontmatter) is produced today only by `FileRule` (globs → paths). Mapping nested AGENTS.md → `FileRule(globs: ['<dir>/**'])` achieves the desired Cursor (`globs:`) and Claude (`paths:`) outputs with zero changes to existing plugins.
- But `GlobalPrompt + relativeDir` matches the operator's literal phrasing and the issue text ("a GlobalPrompt in packages/foo/src/CLAUDE.md will emit back to packages/foo/src/AGENTS.md").
- On the emission side, the candidate signals conflict: `relativeDir` on a GlobalPrompt from `.cursor/rules/shared/x.mdc` means rules-dir organization (always-apply semantics; belongs in root AGENTS.md), while dirname(sourcePath) on a nested `CLAUDE.md` means directory scoping (belongs in `<dir>/AGENTS.md`). `sourcePath` and `metadata` do not survive IR (`.a16n/`) round-trips; `relativeDir` and `globs` do.

**Constraints:**
- Must enable the escape hatch: nested AGENTS.md → Cursor/Claude path-scoped rules at corresponding directory levels.
- Must preserve the issue's directory-structure mapping for emission: dir-scoped global prompts land at `<dir>/AGENTS.md`.
- Should avoid changes to plugin-claude/plugin-cursor unless clearly justified (scope discipline).
- Mapping must degrade gracefully (standard warnings) for items that can't be represented.

### OQ2: Emission idempotency & overwrite behavior for AGENTS.md files

**Problem statement:** Multiple IR items can target the same AGENTS.md file (concatenation), and AGENTS.md is a user-authored file at repo root (unlike `.cursor/rules/`/`.claude/rules/` which are tool-managed trees). What are the write semantics: overwrite, merge, or append? What is the concatenation format? What warnings fire?

**Why it's ambiguous:**
- Issue #50 itself flags "text concatenation is an idempotency nightmare."
- Precedent conflicts: plugin-cursor *overwrites* `.cursorignore` with converted patterns; plugin-claude *merges* into existing `settings.json` permissions.deny.
- Overwriting a hand-written AGENTS.md destroys content silently; merging/appending breaks idempotency on repeated emission.
- `WarningCode.Overwritten` exists but is currently unused by any plugin — possibly intended for exactly this case.

**Constraints:**
- Repeated emission of the same IR must be idempotent (no unbounded growth).
- Data-loss risk must surface through standard warning channels (no editorial warnings).
- Concatenation of multiple GlobalPrompts into one file must produce a `Merged` warning (existing semantics: "Converting back will produce 1 file, not the original count").

## Status

- [x] Component analysis complete
- [ ] Open questions resolved (creative phases in progress)
- [ ] Test planning (TDD)
- [ ] Implementation plan
- [ ] Technology validation
- [ ] Preflight
- [ ] Build
- [ ] QA
