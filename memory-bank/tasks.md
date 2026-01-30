# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task: CodeRabbit PR #18 Fixes

**Status:** In Progress
**PR URL:** [PR #18](https://github.com/Texarkanine/a16n/pull/18)
**Rate Limit Until:** 

### Actionable Items
- [x] ID: MD060-activeContext - Normalize table pipe spacing in activeContext.md - FIXED
- [x] ID: MD060-progress - Normalize table pipe spacing in progress.md phase table - FIXED
- [x] ID: SED-PORTABLE-TS - Fix sed -i for macOS portability in generate-versioned-api.ts - FIXED
- [x] ID: SED-PORTABLE-PKG - Fix sed -i for macOS portability in package.json postprocess - FIXED
- [x] ID: TYPO-DOCS2 - Fix @easyops-dev → @easyops-cn typo in DOCS_2.md (3 occurrences) - FIXED
- [x] ID: APIDOC-WAIT - Fix apidoc:current script to run sequentially for reliable error detection - FIXED
- [x] ID: LATEST-SYMLINK - Call createLatestSymlink function in generate-versioned-api.ts - FIXED

### Requires Human Decision
(none)

### Ignored
- ID: ABS-PATH - Absolute path in troubleshooting doc - Already correct (uses repo-relative path)
- ID: MD040-tasks - Language tag in tasks.md - Ephemeral file, will be cleared

### Summary of Changes
1. Fixed malformed markdown tables in activeContext.md (3 tables with `||` row starts → proper `|` starts)
2. Fixed malformed markdown tables in progress.md (3 tables with `||` row starts → proper `|` starts)
3. Made sed -i portable in generate-versioned-api.ts (added .bak suffix + cleanup)
4. Made sed -i portable in package.json postprocess script (added .bak suffix + cleanup)
5. Fixed 3 typos: @easyops-dev → @easyops-cn in planning/DOCS_2.md
