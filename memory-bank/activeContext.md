# Memory Bank: Active Context

<!-- This file tracks current session focus, recent decisions, and immediate next steps. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Focus

**Task:** Migrate from Changesets to Release-Please

**Phase:** BUILD COMPLETE → Ready for PR/Merge

## Key Decisions Made

1. **Tool Selection:** Release-Please v4 (googleapis/release-please-action@v4)
   - Native conventional commit support
   - Maintained by Google
   - No manual changeset creation required

2. **Tag Format:** `@a16njs/package-name@version`
   - `include-component-in-tag: true`
   - `include-v-in-tag: false`
   - `tag-separator: "@"`

3. **Versioning Strategy:** 
   - `bump-minor-pre-major: true` (0.x versions bump minor for features)
   - Independent versioning per package

4. **Workflow Name:** Keep `release.yaml` for npm trusted publishing compatibility

## Open Questions

None - all creative phases resolved.

### Resolved: Publishing Strategy
Use release-please `paths_released` output (JSON array) to iterate and publish only released packages with `pnpm --filter "./$path" publish --no-git-checks`.

## Recent Completed Work

| Phase | Completion Date | Archive |
|-------|-----------------|---------|
| Phase 6 | 2026-01-28 | [CLI Polish](archive/enhancements/20260128-PHASE6-CLI-POLISH.md) |
| Phase 5 | 2026-01-28 | [Git Ignore + Conflict Flag](archive/features/20260128-PHASE5-CONFLICT-FLAG.md) |

## Session State

- Branch: `release-please` (already exists)
- Memory Bank: tasks.md updated with full implementation plan
- QA Validation: PASSED (2026-01-28)
- Blockers: None

## Immediate Next Steps

1. ~~**Create branch:**~~ Already on `release-please` branch
2. ~~**Implement Phase 1:**~~ Changesets infrastructure removed
3. ~~**Implement Phase 2:**~~ Release-please config files created
4. ~~**Implement Phase 3:**~~ GitHub workflow updated
5. ~~**Implement Phase 4:**~~ package.json updated, lockfile refreshed
6. **Commit changes:** Stage and commit all migration changes
7. **Push and create PR:** Push to branch, create PR for review
8. **Test:** Merge to main, verify Release-Please creates first release PR
