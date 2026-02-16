## Current Task: CodeRabbit PR #59 Fixes

**Status:** COMPLETE
**PR URL:** https://github.com/Texarkanine/a16n/pull/59
**Rate Limit Until:**
**Last Updated:** 2026-02-16T09:08:00Z

### Actionable Items
- [x] ID: null-guard - Remove non-null assertion on `engine!` in CLI index.ts convert/discover actions - FIXED
- [x] ID: convert-cleanup - Add afterEach temp directory cleanup in convert.test.ts - FIXED
- [x] ID: discover-cleanup - Add afterEach temp directory cleanup in discover.test.ts - FIXED
- [x] ID: pluralize - Fix "Found 1 items" → "Found 1 item" in discover.ts - FIXED
- [x] ID: typos-docs - Fix 3 typos in understanding-conversions/index.md (pacakge, posisble, combined together) - FIXED
- [x] ID: dedup-plugins - Deduplicate plugins by id in plugin-discovery.ts - FIXED
- [x] ID: orphaned-jsdoc - Move orphaned A16nPlugin JSDoc to correct location in plugin.ts - FIXED
- [x] ID: jsdoc-param-a16n-emit - Fix @param root → rootOrWorkspace in plugin-a16n/src/emit.ts - FIXED
- [x] ID: jsdoc-param-claude-emit - Fix @param root → rootOrWorkspace in plugin-claude/src/emit.ts - FIXED
- [x] ID: jsdoc-param-a16n-discover - Fix @param root → rootOrWorkspace in plugin-a16n/src/discover.ts - FIXED
- [x] ID: sourcepath-unique - Fix sourcePath to include filename for unique ID generation in plugin-a16n/src/discover.ts - FIXED in 46e5177

### Requires Human Decision
(none)

### Ignored
- ID: any-types - routeConflict/routeConflictSimple `any[]` params in convert.ts - Reason: Nitpick; typing improvement not critical
- ID: dir-validation-helper - Extract duplicate directory-validation logic in convert.ts - Reason: Nitpick; refactoring suggestion
- ID: gitignore-error-continue - Gitignore errors caught but execution continues in convert.ts - Reason: Nitpick; intentional behavior
- ID: path-traversal-guard - Guard against path traversal in Workspace.resolve() - Reason: Nitpick; internal API
- ID: empty-plugins-msg - Handle empty plugins list in plugins command - Reason: Nitpick; UX improvement
- ID: workspace-error-class - WorkspaceError class with structured error codes - Reason: Nitpick; future improvement
- ID: shared-mock-io - Extract createMockIO into shared test utility - Reason: Nitpick; test refactoring
- ID: cursor-emit-patterns - Extract repeated file-write-and-track patterns - Reason: Nitpick; refactoring
- ID: fragile-as-any-cast - Use toHaveProperty instead of (as any).id - Reason: Nitpick; minor test improvement
- ID: prefer-bundled-test-name - Rename test for clarity - Reason: Nitpick; naming suggestion
- ID: plugins-console-log - plugins command uses console.log instead of CommandIO - Reason: Nitpick; consistency
- ID: cursor-discover-workspace - Workspace abstraction reduced to string - Reason: Nitpick; transitional step
- ID: tmpdir-parallel - Use os.tmpdir() for test isolation - Reason: Nitpick; test improvement
- ID: registry-mutable-ref - get() returns mutable reference - Reason: Nitpick; internal class
- ID: default-case-switch - Add default case for switch - Reason: Nitpick; forward-compatibility
- ID: filter-directories - Filter readdir to directories only - Reason: Nitpick; safely caught by try/catch
- ID: namespace-strategy-doc - Design doc mentions NAMESPACE strategy - Reason: Nitpick; design doc
- ID: emission-warning-dups - Ensure no duplicate warnings - Reason: Nitpick; theoretical concern
- ID: skill-path-traversal - Resource filenames not validated against path traversal - Reason: Nitpick; pre-existing
- ID: discover-dir-validation-helper - Extract directory-validation helper shared with convert.ts - Reason: Nitpick; refactoring
- ID: plugins-console-log-2 - plugins command uses console.log instead of CommandIO (2nd review) - Reason: Nitpick; duplicate of prior
- ID: a16n-emit-workspace-io - Workspace resolution bypasses Workspace I/O methods - Reason: Nitpick; transitional step
