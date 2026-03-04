# Progress

Fix GitHub issue #71: emit ManualPrompts to `.cursor/commands/` (Cursor's native slash-command format) instead of writing them as skills with `disable-model-invocation: true` which Cursor doesn't support.

**Complexity:** Level 1

## 2026-03-04 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified task as Level 1 (bug fix, single component — emit.ts in plugin-cursor)
    - Created ephemeral files: projectbrief.md, activeContext.md, tasks.md, progress.md
* Decisions made
    - Emit ManualPrompts as `.cursor/commands/<name>.md` instead of skills with unsupported frontmatter flag
