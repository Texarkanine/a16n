## Current Task: CodeRabbit PR #44 Fixes

**Status:** COMPLETE
**PR URL:** https://github.com/Texarkanine/a16n/pull/44
**Rate Limit Until:**
**Last Updated:** 2026-02-09T04:15:00Z

### Actionable Items
- [x] ID: claude-path-traversal - Add path traversal validation for relativeDir in Claude plugin emit.ts (GlobalPrompt + FileRule blocks) - FIXED
- [x] ID: cursor-path-traversal - Add path traversal validation for relativeDir in Cursor plugin emit.ts (GlobalPrompt + FileRule blocks) - FIXED
- [x] ID: cursor-collision-qualified - Fix filename collision tracking to use relativeDir-qualified keys in Cursor plugin emit.ts - FIXED
- [x] ID: claude-collision-qualified - Fix filename collision tracking to use relativeDir-qualified keys in Claude plugin emit.ts - FIXED
- [x] ID: cursor-gp-dot-traversal - Fix path traversal guard rejecting relativeDir="." in Cursor GlobalPrompt block - FIXED
- [x] ID: cursor-fr-dot-traversal - Fix path traversal guard rejecting relativeDir="." in Cursor FileRule block - FIXED
- [x] ID: claude-gp-dot-traversal - Fix path traversal guard rejecting relativeDir="." in Claude GlobalPrompt block - FIXED
- [x] ID: claude-fr-dot-traversal - Fix path traversal guard rejecting relativeDir="." in Claude FileRule block - FIXED

### Requires Human Decision
(none)

### Ignored
- ID: planning-typo - Typo "In  a repo:" in planning/path-rewrite-issue.md - Reason: Repo owner stated "/planning/ is only even committed so we dont lose it. it won't stick around."
- ID: test-describe-nesting - Tests placed inside wrong describe block - Reason: Nitpick only, tests are correct and provide good coverage. Reorganization is cosmetic.
- ID: planning-before-note - Planning doc should note "before" state - Reason: Planning doc is temporary per owner.
- ID: extract-helper-cursor - Consider extracting shared relativeDir→targetDir logic into helper in Cursor emit.ts - Reason: Nitpick/refactor suggestion, not a bug. Both blocks are already consistent.
- ID: extract-helper-claude - Consider extracting shared relativeDir→targetDir logic into helper in Claude emit.ts - Reason: Nitpick/refactor suggestion, not a bug. Both blocks are already consistent.
