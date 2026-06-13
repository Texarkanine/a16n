# Task: Wave B — middle-layer 1.0.0 promotion + agentsmd pin-refresh

* Task ID: v1-release-rollout-m4
* Complexity: Level 2
* Type: Release-orchestration config change (no runtime code change)

Promote `@a16njs/engine`, `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, and `@a16njs/plugin-a16n` from `0.x` to `1.0.0` via per-package `release-as` in `release-please-config.json`, and re-release `@a16njs/plugin-agentsmd` as a **patch** bump (`1.0.3 → 1.0.4`, NO `release-as`) so pnpm's publish rewrite re-pins its `@a16njs/models` dependency from `0.14.1` to `1.0.0`. Each package that must cut a release gets a path-touching README stability note. Remove the spent M3 `release-as` keys (`models`, `glob-hook`).

## Test Plan (TDD)

### Behaviors to Verify

This is a release-orchestration config + docs change with **no new runtime behavior**, so per the M3 (Wave A, also L2/L1) precedent no new unit test is written — the relevant behaviors are guarded by existing invariant tests, and the one behavior that cannot be unit-tested (does Release-Please cut the right versions) is only observable at merge time and is covered by the operator merge-gate.

- Source stays `workspace:*` (invariant #3): every internal `@a16njs/*` reference remains `workspace:` after the edits → guarded by `packages/cli/test/workspace-publish-invariant.test.ts` (must stay green).
- agentsmd keeps `workspace:*` + `publishConfig.access: "public"` → guarded by `packages/plugin-agentsmd/test/publish-shape.test.ts` (must stay green).
- No behavioral regression across the suite → full `pnpm test` green (17 packages).
- (Merge-gate, not unit-testable) Generated RP PR bumps `engine`, `plugin-cursor`, `plugin-claude`, `plugin-a16n` → `1.0.0` and `plugin-agentsmd` → `1.0.4`.
- (Post-publish, not unit-testable) Each published tarball's `@a16njs/models` dep resolves to `1.0.0` with no `workspace:` specifier.

### Test Infrastructure

- Framework: Vitest (per-package `vitest.config.ts`; canonical run is `pnpm test` via Turbo).
- Test location: package-local `test/` dirs.
- Conventions: invariant guards already exist; no parallel infra introduced.
- New test files: none (rationale above; a config-asserting test would be tautological/brittle — the config IS the artifact).

## Implementation Plan

1. Edit `release-please-config.json`
   - Files: `release-please-config.json`
   - Changes:
     - Add `"release-as": "1.0.0"` to `packages/engine`, `packages/plugin-cursor`, `packages/plugin-claude`, `packages/plugin-a16n`.
     - Remove the spent `"release-as": "1.0.0"` from `packages/models` and `packages/glob-hook` (already published at 1.0.0 in M3).
     - Leave `packages/plugin-agentsmd` with **no** `release-as` (patch bump comes from the path-touching `fix:` commit).
2. Add path-touching README stability notes (the Release-Please trigger — `release-as` does not force inclusion)
   - Files: `packages/engine/README.md`, `packages/plugin-cursor/README.md`, `packages/plugin-claude/README.md`, `packages/plugin-a16n/README.md`, `packages/plugin-agentsmd/README.md`
   - Changes: add a short, honest `## Stability` note to each (replicating the M3 model/glob-hook recipe). The four promoted packages: "As of `1.0.0`, the public API is stable and follows semver." agentsmd: an honest stability note consistent with its already-`1.x` status (it is the trigger for the pin-refresh release).
3. Verify + full validation
   - Run `pnpm build && pnpm test && pnpm lint && pnpm typecheck` (whole suite per test-running-practices).
   - Confirm `workspace-publish-invariant` and agentsmd `publish-shape` are green; source still `workspace:*`.
4. Commit (single path-touching commit covering all five package paths + the config)
   - `fix(release): Wave B — promote engine + plugins to 1.0.0, re-pin agentsmd to models@1.0.0`
5. Operator merge-gate (post-build, not agent-executed)
   - Verify the generated RP PR bumps all four `0.x` packages to `1.0.0` and `plugin-agentsmd` to `1.0.4` before merging.
   - After merge + publish: `npm view @a16njs/{engine,plugin-cursor,plugin-claude,plugin-a16n}@1.0.0 dependencies` and `npm view @a16njs/plugin-agentsmd@1.0.4 dependencies` all show `@a16njs/models@1.0.0`, no `workspace:`.

## Technology Validation

No new technology - validation not required. (Verified: `packages/models` is `1.0.0` in the workspace, so pnpm's publish-time `workspace:*` rewrite resolves all dependents to `models@1.0.0`.)

## Dependencies

- Wave A live: `@a16njs/models@1.0.0` and `@a16njs/glob-hook@1.0.0` published (confirmed on npm).
- Release-Please + `pnpm --filter publish` (OIDC) pipeline as configured in `.github/workflows/release.yaml`.

## Challenges & Mitigations

- `release-as` does not force a release (the bug that thrashed M1 twice): a release is cut only when a commit touches the package path → **one** `fix(release):` commit touching all five package READMEs.
- Forcing `release-as: "1.0.0"` on agentsmd would be a **downgrade** (1.0.3 → 1.0.0) and violate invariant #7 → agentsmd gets NO `release-as`; the patch bump comes from the path-touch under a `fix:` commit.
- Spent M3 `release-as` keys (`models`/`glob-hook` = 1.0.0, already published) left in the config could re-trigger or conflict → remove them in step 1.
- `engine` carries `plugin-cursor`/`plugin-claude` as **devDependencies** (`workspace:*`): these are dev-only, stripped from the published tarball, so they create no runtime edge and no release-ordering edge among Wave B packages — the milestone's "no edges among themselves" holds. They must stay `workspace:*` (invariant guard covers this).
- pnpm rewrite must resolve `models@1.0.0`: depends on the workspace `models` version field → verified `1.0.0`.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
