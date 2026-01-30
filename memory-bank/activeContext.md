# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Task:** TEST-FIXES-20260129 - Test failures and build optimization
**Status:** ✅ Complete (2026-01-29)
**Branch:** `docs`
**Reflection:** ✅ Complete - see `memory-bank/reflection/reflection-20260129-TEST-FIXES.md`

### Session Summary

Fixed test failures caused by rebase errors and optimized the build pipeline:

1. **ManualPrompt restoration** - Restored files incorrectly renamed to AgentCommand during rebase
2. **glob-hook tsx dependency** - Added missing devDependency for CLI tests
3. **docs#test optimization** - Decoupled docs tests from docs build in turbo.json

### Previous Task

**Task:** DOCS-PIVOT-STAGING - Versioned API documentation system
**Status:** ✅ All Phases Complete (2026-01-29)
**Reflection:** ✅ Complete - see `memory-bank/reflection/reflection-DOCS-PIVOT-STAGING.md`

## Task Summary

Refactor the existing Docusaurus documentation site from committed API docs to a staging area pattern:

| Aspect | Before | After |
| ------ | ------ | ----- |
| API docs | Committed (46 files) | Generated at CI time |
| Build source | `docs/` | `.generated/` (staging) |
| Versioning | None | Git tag-based |
| Version picker | None | Auto React dropdown |
| Search | None | Local search |

## Key Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Staging area at `.generated/` | Matches DOCS_2.md spec; keeps generated content out of repo |
| Standalone TypeDoc | Simpler than `docusaurus-plugin-typedoc`; direct control |
| Git tag-based versions | Tags exist (6 packages tagged); enables historical API docs |
| Latest-first dropdown | User requirement; better UX for most users |
| Local search with version exclusion | Prevents search pollution from old API versions |

## Feasibility Confirmed

✅ **Git tags exist:** 6 package tags available for version generation
✅ **Entry points exist:** All 6 `packages/*/src/index.ts` files present
✅ **Docusaurus supports custom docs path:** `path: '.generated'` option
✅ **TypeDoc standalone works:** `typedoc-plugin-markdown` CLI usage
✅ **Custom React components:** Docusaurus `src/components/` pattern

## Implementation Phases

1. **Cleanup** - Delete committed API docs from git
2. **Build Scripts** - Implement staging area flow
3. **Docusaurus Config** - Point to `.generated/`, add search
4. **Version Picker** - React dropdown component
5. **Versioned API** - Git tag iteration script
6. **CI Workflow** - Update for new build process
7. **Verification** - End-to-end testing

## Files to Modify

| File | Change |
| ---- | ------ |
| `apps/docs/api/` | DELETE (remove from git) |
| `.gitignore` | Fix paths, add `.generated/` |
| `apps/docs/package.json` | New build scripts |
| `apps/docs/docusaurus.config.js` | New docs path, search plugin |
| `apps/docs/sidebars.js` | API doc links |
| NEW: `apps/docs/src/components/VersionPicker/` | React dropdown |
| NEW: `apps/docs/scripts/generate-versioned-api.sh` | Build script |
| `.github/workflows/docs.yaml` | Updated build steps |

## Immediate Next Steps

1. User approval of plan
2. Begin Phase 1: Cleanup committed API docs
3. Iteratively implement phases 2-7

## Context from Previous Work

The `docs` branch has a working Docusaurus spike (reflection in `memory-bank/reflection/reflection-DOCS-PIVOT-STAGING.md`). This pivot builds on that foundation but changes the API docs architecture significantly.
