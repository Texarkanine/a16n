# Project Brief: AGENTS.md Plugin (`@a16njs/plugin-agentsmd`)

## User Story

As a developer working in repositories that use the AGENTS.md standard (or considering it), I want a16n to translate between AGENTS.md files and other agent customization formats, so that I can programmatically enter or — more importantly — exit the AGENTS.md standard.

Reference: [Issue #50 — Translation Target: AGENTS.md Standard](https://github.com/Texarkanine/a16n/issues/50)

## Requirements

### Discovery (primary case)

- Discover `AGENTS.md` files at **any** directory depth in a repository.
- Each discovered `AGENTS.md` is loaded as a path-scoped `GlobalPrompt` (a `GlobalPrompt` carrying its `relativeDir`).
- This enables the "escape hatch": nested AGENTS.md files can be re-emitted as Cursor rules or Claude path-scoped rules at the corresponding directory levels.
  - Note: Claude supports path-based rules (`.claude/rules/*.md` with `paths` frontmatter) — believed already implemented in `plugin-claude`. The escape from AGENTS.md into Claude should produce these.

### Emission (lossy case)

- `GlobalPrompt`s emit to `AGENTS.md`, preserving directory structure: a GlobalPrompt from `packages/foo/src/` emits to `packages/foo/src/AGENTS.md`.
- Multiple GlobalPrompts targeting the same directory are concatenated into one `AGENTS.md`.
- Emission in this direction is **lossy** — convey this via a16n's standard warning mechanisms only:
  - Non-GlobalPrompt types (FileRule, skills, AgentIgnore, ManualPrompt) cannot be represented in AGENTS.md → standard per-item "couldn't convert" / skip warnings.
  - **No editorial warnings** about AGENTS.md as a standard. The volume of normal a16n warnings suffices. No `--force` gating — emit, warn loudly through existing channels.

### Integration

- Plugin is **included** (ships with a16n), like `plugin-claude` and `plugin-cursor`.
- Registered with the CLI alongside the other included plugins.
- Documented consistently with other included plugins; documentation notes the lossiness of emission factually.

## Rationale

For public/open-source repos, the author cannot know what tool or harness a visitor brings. AGENTS.md is the only near-universal context mechanism, and placing one in a subdirectory approximates a directory-scoped rule — limited, but a fair defensive technique. The plugin serves people using AGENTS.md correctly that way, and gives everyone else a programmatic way out.

## Operating Mode (operator directive)

The operator has **explicitly preauthorized fully autonomous execution through the REFLECT phase** for this task. Do not pause for plan review or design approval; resolve issues autonomously (use the niko-creative skill for hard design problems and nk-refresh if stuck). Only stop for genuinely anomalous hard blockers (e.g., shell failure, loss of GitHub access).
