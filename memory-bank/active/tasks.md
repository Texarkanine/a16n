# Task: v1-release-rollout-m1

* Task ID: v1-release-rollout-m1
* Complexity: Level 2
* Type: bug fix / release repair

Republish `@a16njs/plugin-agentsmd` (new patch via automated `pnpm publish` so `workspace:*` → exact `@a16njs/models` pin) and republish the `a16n` CLI so `npx a16n@latest` resolves again. Optionally deprecate poisoned `@a16njs/plugin-agentsmd@1.0.1`/`1.0.2` and `a16n@0.15.2`.


## Test Plan (TDD)

### Behaviors to Verify

- **Pack rewrite (agentsmd)**: `pnpm --filter @a16njs/plugin-agentsmd pack` → unpack tarball → `package.json` `dependencies["@a16njs/models"]` is an exact semver, not `workspace:*`
- **Pack rewrite (cli)**: `pnpm --filter a16n pack` → unpack tarball → no dependency value contains the `workspace:` protocol
- **Source unchanged**: `packages/plugin-agentsmd/package.json` and `packages/cli/package.json` still declare `workspace:*` for internal siblings
- **Release config targets correct versions**: `release-please-config.json` forces `@a16njs/plugin-agentsmd` → `1.0.3` and `a16n` → `0.15.3` (patch-only repair; avoids `bump-minor-pre-major` bumping CLI to `0.16.0` on a `fix:` commit)
- **Post-release (operator)**: after merge + publish, `npx a16n@latest --version` exits 0 and `npm view @a16njs/plugin-agentsmd@latest dependencies` shows exact semver pin

### Test Infrastructure

- Framework: Vitest (existing monorepo standard)
- Test location: new root-level or `packages/plugin-agentsmd/test/` suite — prefer **`scripts/` + Vitest at repo root** only if no package-local home fits; use `packages/plugin-agentsmd/test/publish-pack.test.ts` to stay colocated with the broken package
- Conventions: flat `test/` per package; `suiteTempDir` / `fs.mkdtemp` for temp dirs; spawn `pnpm pack` via `child_process`
- New test files: `packages/plugin-agentsmd/test/publish-pack.test.ts` (agentsmd pack assertion); optionally extend with CLI pack assertion in `packages/cli/test/publish-pack.test.ts`

## Implementation Plan

1. **Stub test + pack helper**
   - Files: `packages/plugin-agentsmd/test/publish-pack.test.ts`, optional shared helper under `packages/plugin-agentsmd/test/test-support/`
   - Changes: empty `describe`; add `assertPackedDependenciesHaveNoWorkspaceProtocol(packageDir)` helper signature

2. **Implement failing pack test (agentsmd)**
   - Files: `packages/plugin-agentsmd/test/publish-pack.test.ts`
   - Changes: run `pnpm pack` in package dir, untar to temp, assert `@a16njs/models` is exact semver matching published `@a16njs/models` version from workspace manifest (`0.14.1`)

3. **Implement failing pack test (cli) — optional same PR**
   - Files: `packages/cli/test/publish-pack.test.ts`
   - Changes: same helper pattern for all `@a16njs/*` deps in CLI tarball

4. **Force Release-Please patch bumps**
   - Files: `release-please-config.json`
   - Changes: add per-package `"release-as": "1.0.3"` under `packages/plugin-agentsmd` and `"release-as": "0.15.3"` under `packages/cli`; add changelog-driving commit message (`fix(release): republish agentsmd and cli with rewritten workspace deps`)

5. **Document republish rationale in changelogs (Release-Please will generate on release PR)**
   - Files: none in source — RP generates `CHANGELOG.md` entries on the Release PR branch
   - Changes: ensure commit body explains poisoned-version context for RP changelog parser

6. **Remove `release-as` after release (follow-up — operator task post-merge)**
   - Files: `release-please-config.json`
   - Changes: note in PR description that operator removes temporary `release-as` keys in a follow-up commit after successful publish (or leave until next organic bump — document choice in PR)

7. **Optional deprecation script/instructions**
   - Files: `scripts/deprecate-poisoned-versions.sh` (new, executable) OR PR test-plan checklist only
   - Changes: `npm deprecate @a16njs/plugin-agentsmd@1.0.1 "..."` etc.; operator runs manually with npm credentials (not CI)

8. **Verify locally before PR**
   - Commands: `pnpm build && pnpm test && pnpm --filter @a16njs/plugin-agentsmd exec pnpm pack` (manual spot-check)
   - Operator post-merge: `npx a16n@latest --version`

## Technology Validation

No new technology — validation not required. Uses existing pnpm pack/publish, Vitest, Release-Please.

## Dependencies

- `@a16njs/models@0.14.1` must remain on npm registry (already published)
- Release-Please bot + existing `release.yaml` publish job (pnpm OIDC trusted publishing)
- Operator merge + npmjs.org environment approval for publish job

## Challenges & Mitigations

- **Single Release PR must publish agentsmd before cli resolves it**: Release-Please includes both paths in one release; publish loop iterates `paths_released` — verify order doesn't matter because CLI pack test uses workspace resolution at pack time, not registry fetch. Mitigation: both publish in same job after build; pnpm rewrite uses workspace versions present locally.
- **`bump-minor-pre-major` would bump CLI to 0.16.0 on fix commits**: Mitigation: temporary `release-as: "0.15.3"`.
- **Manual deprecations require operator npm login**: Mitigation: provide script + document as post-publish operator step; not blocking for code merge.
- **M2 guards not in scope**: Mitigation: pack tests give pre-merge signal; full CI guard deferred to M2 per milestone plan.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
