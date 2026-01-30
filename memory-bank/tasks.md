# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task: CodeRabbit PR #20 Fixes

**Status:** COMPLETE
**PR URL:** <https://github.com/Texarkanine/a16n/pull/20>
**Rate Limit Until:**

### Actionable Items
- [x] ID: CR-DOCS-NULL-SHA - Add guard for null SHA in docs.yaml when `github.event.before` is all zeros - REMOVED (user decision: YAGNI)
- [x] ID: CR-TASKS-MD034 - Wrap bare PR URL in angle brackets in tasks.md (line 167) - FIXED
- [x] ID: CR-NULL-SHA-SIMPLIFY - Remove null SHA guard per user's YAGNI decision - FIXED

### Requires Human Decision
(none)

### Ignored
- ID: CR-RELEASE-NEEDS - docs job missing release-please in needs - ALREADY FIXED (needs includes both release-please and publish)
- ID: CR-MULTI-COMMIT - Multi-commit push bypass - ALREADY FIXED (now uses fetch-depth: 0 and event.before..sha range)
- ID: CR-NULL-SHA-MULTICOMMIT - CodeRabbit's further hardening suggestion - IGNORED per user: "YAGNI. This one is absolutely over-engineering. The repo already exists!"
