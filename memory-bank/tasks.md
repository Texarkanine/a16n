# Memory Bank: Tasks

<!-- This file tracks current task details, checklists, and implementation plans. -->
<!-- It is ephemeral and cleared by /archive when a task is completed. -->

## Current Task

**Task:** Migrate from Changesets to Release-Please for automated versioning

**Rationale:** Changesets requires manual `pnpm changeset` before each PR merge. The community tools for auto-generating changesets from conventional commits are abandoned (2+ years old). Release-Please natively supports conventional commits, automatically generating version bumps and changelogs from commit messages.

## Description

Replace the current Changesets-based release workflow with Google's Release-Please, which:
1. Parses conventional commits (`feat:`, `fix:`, etc.) automatically
2. Creates/updates a Release PR with version bumps and changelog entries
3. Publishes to npm when the Release PR is merged
4. Supports monorepos with independent package versioning

## Complexity

Level: 3 (Intermediate Feature)
Type: CI/CD Infrastructure Migration

**Justification:**
- Multiple configuration files across repo
- Workflow changes affecting release pipeline
- Monorepo-specific configuration required
- No code changes to application logic
- Well-documented migration path exists

## Test Planning (TDD)

### Behaviors to Test

This is a CI/CD infrastructure change - testing happens via:
1. **Dry-run validation**: Verify config files are syntactically correct
2. **Integration test**: First PR after migration triggers Release-Please correctly
3. **Publish test**: Release PR merge successfully publishes to npm

### Test Infrastructure

- No unit tests needed (configuration-only change)
- Manual validation via GitHub Actions logs
- Rollback plan if issues occur

## Technology Stack

- **Tool:** Release-Please v4 (`googleapis/release-please-action@v4`)
- **Release Type:** `node` (for all packages)
- **Monorepo Strategy:** Independent versioning per package
- **Tag Format:** `@a16njs/package-name@version` (e.g., `@a16njs/cli@0.3.0`)

## Current Package Versions (Bootstrap Manifest)

| Package | Current Version |
|---------|-----------------|
| `packages/cli` (a16n) | 0.2.0 |
| `packages/engine` (@a16njs/engine) | 0.0.2 |
| `packages/models` (@a16njs/models) | 0.1.0 |
| `packages/plugin-cursor` (@a16njs/plugin-cursor) | 0.2.0 |
| `packages/plugin-claude` (@a16njs/plugin-claude) | 0.2.0 |
| `packages/glob-hook` (@a16njs/glob-hook) | 0.0.1 |

## Technology Validation Checkpoints

- [x] Release-Please action identified (`googleapis/release-please-action@v4`)
- [x] Monorepo config format understood (packages object with paths)
- [x] Reference implementation reviewed (inquirerjs-checkbox-search)
- [x] Tag format decided (`include-component-in-tag: true`)
- [ ] Config files created and validated
- [ ] First test run on main branch

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD - N/A for config-only change)
- [x] Planning complete
- [x] QA Validation complete (2026-01-28)
- [ ] Implementation complete
- [ ] First release verified

## Implementation Plan

### Phase 1: Remove Changesets Infrastructure

1. **Delete `.changeset/` directory**
   - Remove `.changeset/config.json`
   - Remove `.changeset/README.md`

2. **Update root `package.json`**
   - Remove `@changesets/cli` from devDependencies
   - Remove scripts: `changeset`, `version-packages`
   - Update `release` script for pnpm publish

### Phase 2: Create Release-Please Configuration

3. **Create `release-please-config.json`**
   ```json
   {
     "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
     "release-type": "node",
     "bump-minor-pre-major": true,
     "bump-patch-for-minor-pre-major": false,
     "include-component-in-tag": true,
     "include-v-in-tag": false,
     "tag-separator": "@",
     "packages": {
       "packages/cli": {
         "component": "a16n",
         "changelog-path": "CHANGELOG.md"
       },
       "packages/engine": {
         "component": "@a16njs/engine",
         "changelog-path": "CHANGELOG.md"
       },
       "packages/models": {
         "component": "@a16njs/models",
         "changelog-path": "CHANGELOG.md"
       },
       "packages/plugin-cursor": {
         "component": "@a16njs/plugin-cursor",
         "changelog-path": "CHANGELOG.md"
       },
       "packages/plugin-claude": {
         "component": "@a16njs/plugin-claude",
         "changelog-path": "CHANGELOG.md"
       },
       "packages/glob-hook": {
         "component": "@a16njs/glob-hook",
         "changelog-path": "CHANGELOG.md"
       }
     },
     "pull-request-header": ":service_dog: I have created a release \\*bark\\* \\*woof\\*"
   }
   ```

4. **Create `.release-please-manifest.json`** (bootstrap with current versions)
   ```json
   {
     "packages/cli": "0.2.0",
     "packages/engine": "0.0.2",
     "packages/models": "0.1.0",
     "packages/plugin-cursor": "0.2.0",
     "packages/plugin-claude": "0.2.0",
     "packages/glob-hook": "0.0.1"
   }
   ```

### Phase 3: Update GitHub Workflow

5. **Replace `.github/workflows/release.yaml`**
   - Keep filename for npm trusted publishing compatibility
   - Replace changesets/action with googleapis/release-please-action@v4
   - Use DOGGO_BOT token for Release PR creation
   - Maintain separate publish job with `npmjs.org` environment
   - Keep OIDC trusted publishing setup

   **Key workflow structure:**
   ```yaml
   jobs:
     release-please:
       # Creates/updates Release PR
       # Outputs: releases_created, paths_released
       
     publish:
       needs: release-please
       if: needs.release-please.outputs.releases_created == 'true'
       environment: npmjs.org
       # Publish each released package
   ```

### Phase 4: Handle Monorepo Publishing

6. **Update publish strategy**
   - Release-Please creates GitHub releases per package
   - Need to publish only packages that were released
   - Use release-please outputs to determine which packages to publish
   - Consider: `pnpm --filter` to publish specific packages

### Phase 5: Cleanup and Documentation

7. **Remove changeset artifacts**
   - Delete any remaining `.changeset` references
   
8. **Update documentation**
   - Update contributing guidelines (no more `pnpm changeset`)
   - Document conventional commit requirements

## Creative Phases Required

- [x] **Publishing Strategy**: RESOLVED

### Decision: Use release-please path-specific outputs

Release-please provides per-package outputs in the format:
```
steps.release.outputs['packages/cli--release_created']
steps.release.outputs['packages/engine--release_created']
```

**Strategy:** Use `paths_released` output (JSON array) to selectively publish only released packages:

```yaml
publish:
  if: needs.release-please.outputs.releases_created == 'true'
  steps:
    - name: Publish released packages
      run: |
        PATHS='${{ needs.release-please.outputs.paths_released }}'
        for path in $(echo "$PATHS" | jq -r '.[]'); do
          echo "Publishing $path..."
          pnpm --filter "./$path" publish --no-git-checks
        done
```

**Alternative (simpler):** Just run `pnpm publish -r --no-git-checks` - npm will reject already-published versions gracefully. But selective is cleaner.

## Dependencies

- `googleapis/release-please-action@v4` - GitHub Action
- `actions/create-github-app-token@v2` - For DOGGO_BOT token
- Existing `npmjs.org` environment with OIDC trusted publishing

## Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| Monorepo package detection | Use explicit `packages` config, not auto-detection |
| Workspace protocol (`workspace:*`) in deps | Release-Please handles this; pnpm converts on publish |
| First run won't detect prior commits | Bootstrap manifest with current versions |
| Tag format consistency | Set `include-component-in-tag: true`, `tag-separator: "@"` |
| Publishing subset of packages | Use release-please outputs + conditional publish |

## Files to Create/Modify

| File | Action |
|------|--------|
| `.changeset/config.json` | DELETE |
| `.changeset/README.md` | DELETE |
| `release-please-config.json` | CREATE |
| `.release-please-manifest.json` | CREATE |
| `.github/workflows/release.yaml` | REPLACE |
| `package.json` | MODIFY (remove changeset deps/scripts) |

## Rollback Plan

If migration fails:
1. Revert commit with release-please changes
2. Re-add `.changeset/` directory from git history
3. Re-add `@changesets/cli` dependency
4. Original workflow restored

## Next Steps

1. Resolve creative phase: Publishing strategy for monorepo
2. Proceed to `/build` to implement the changes
