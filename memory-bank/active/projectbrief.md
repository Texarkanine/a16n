# Project Brief: Cursor Commands Deprecation Migration

**User Story / Intent (validated):**
Cursor has deprecated Commands in favor of Agent Skills using `disable-model-invocation: true` (matching Claude Code). Update the Cursor plugin so that it no longer emits Commands — only Agent Skills in the prescribed format. Continue to ingest Cursor Commands (for legacy support), but note that they do not round-trip. Use the Claude Code plugin as the reference implementation.

**Requirements:**
- Remove all emission logic that writes to `.cursor/commands/`.
- Map `ManualPrompt` items to `.cursor/skills/<name>/SKILL.md` with YAML frontmatter including `disable-model-invocation: true`.
- Preserve discover/ingest of legacy `.cursor/commands/` files.
- Document the non-roundtrip behavior for Commands (somewhere appropriate: code, tests, or docs).
- Ensure compatibility with existing test fixtures and add/update tests as needed.
- Follow TDD strictly for any code changes.

**Success Criteria:**
- `emit` for ManualPrompts produces Skills (not Commands).
- Discover still works for Commands.
- All tests pass; no regressions.
- Non-roundtrip behavior is noted.