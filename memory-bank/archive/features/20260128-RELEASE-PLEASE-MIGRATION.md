# TASK ARCHIVE: Migrate from Changesets to Release-Please

## METADATA

- **Task ID:** release-please-migration
- **Completed:** 2026-01-28
- **Complexity:** Level 3 (Intermediate Feature – CI/CD Infrastructure Migration)
- **Outcome:** Merged to main; first release verified

## SUMMARY

Replaced the Changesets-based release workflow with Google Release-Please. Release-Please parses conventional commits on `main`, creates/updates a Release PR with version bumps and changelogs, and publishes to npm when that PR is merged. Added a separate workflow to sync `pnpm-lock.yaml` on release-please branches so CI runs with an up-to-date lockfile.

## REQUIREMENTS

- Parse conventional commits (`feat:`, `fix:`, etc.) automatically
- Create/update a Release PR with version bumps and changelog entries
- Publish to npm when the Release PR is merged
- Support monorepo with independent package versioning
- Keep lockfile in sync on Release PRs so CI (e.g. `pnpm install --frozen-lockfile`) passes

## IMPLEMENTATION

### Phase 1: Remove Changesets

- Deleted `.changeset/config.json` and `.changeset/README.md`
- Removed `@changesets/cli` from root `package.json` devDependencies
- Removed scripts: `changeset`, `version-packages`, `release` (no longer `changeset publish`)

### Phase 2: Release-Please Configuration

- **`release-please-config.json`**: `release-type: node`, `bump-minor-pre-major: true`, `include-component-in-tag: true`, `tag-separator: "@"`, six packages (cli, engine, models, plugin-cursor, plugin-claude, glob-hook)
- **`.release-please-manifest.json`**: Bootstrap versions for all packages

### Phase 3: Release Workflow

- **`.github/workflows/release.yaml`**: Trigger on `push` to `main`
  - Job `release-please`: Uses `googleapis/release-please-action@v4` with Texarkanine's Little Helper (DOGGO_BOT vars). Outputs `releases_created`, `paths_released`
  - Job `publish`: Runs when `releases_created == 'true'`; uses `paths_released` with `pnpm --filter "./$path" publish --no-git-checks`; `pnpm install --frozen-lockfile` so publish fails if lockfile is stale

### Phase 4: Lockfile Sync Workflow

- **`.github/workflows/release-lockfile-sync.yaml`**: Trigger on `push` to `release-please--branches--main` and `release-please--branches--main--*`
  - Check if lockfile is in sync via `pnpm install --frozen-lockfile` (state-based; no actor checks)
  - If out of sync: configure git as `texarkanine-s-little-helper[bot]`, then use `nick-fields/retry@v3` (3 attempts, 10s wait) to: `git pull --rebase`, `pnpm install --no-frozen-lockfile`, commit lockfile only if changed, push
  - Concurrency: `cancel-in-progress: false` so syncs are not cancelled

### Key Decisions

- **Publishing:** Use `paths_released` to publish only packages that were released
- **Lockfile sync:** State check (`--frozen-lockfile`) instead of actor check so both release-please’s initial push and our sync push are handled correctly
- **Bot:** Texarkanine's Little Helper (https://github.com/apps/texarkanine-s-little-helper); vars `DOGGO_BOT_APP_ID`, `DOGGO_BOT_PRIVATE_KEY`

## TESTING

- Config-only change: no new unit tests
- QA: dependencies, config, environment, build/test validated before build
- Build: 6/6 packages; tests: 339/339 passed
- Post-merge: Release PR created by Release-Please; lockfile sync ran on RP branch; merge and publish flow verified

## LESSONS LEARNED

- Actor-based skip for “our own” pushes fails because the same bot opens the Release PR; use state (frozen-lockfile) instead
- Retry with pull-rebase handles races when the RP branch is updated while the workflow runs
- Two workflows (release on main, lockfile-sync on RP branches) keep triggers and responsibilities clear

## REFERENCES

- Memory Bank: tasks.md, progress.md, activeContext.md (cleared at archive)
- QA: memory-bank/.qa_validation_status (removed at archive)
