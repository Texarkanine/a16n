# Task: v1-release-rollout-m1

* Task ID: v1-release-rollout-m1
* Complexity: Level 2
* Type: bug fix / release repair

Republish `@a16njs/plugin-agentsmd` (new patch via automated `pnpm publish` so `workspace:*` → exact `@a16njs/models` pin) and republish the `a16n` CLI so `npx a16n@latest` resolves again. Optionally deprecate poisoned `@a16njs/plugin-agentsmd@1.0.1`/`1.0.2` and `a16n@0.15.2`.


## Test Plan (TDD)

> **Revised after operator review.** The original plan added per-package `pnpm pack` tests asserting the tarball rewrites `workspace:*`. That assertion is near-tautological (pnpm always rewrites) and cannot reproduce the actual cause — an operator running `npm publish` instead of `pnpm publish`. Replaced with a single repo-level **source-invariant** test; the artifact-inspection guard that matches the failure mode is deferred to M2.

### Behaviors to Verify

- **Source uses workspace protocol (all packages)**: for every workspace package, any dependency (in any bucket) that names another workspace package must use the `workspace:` protocol — guards invariant #3 (no hand-pinned siblings in source) repo-wide, covering current and future packages
- **Release config targets correct versions**: `release-please-config.json` forces `@a16njs/plugin-agentsmd` → `1.0.3` and `a16n` → `0.15.3` (patch-only repair; avoids `bump-minor-pre-major` bumping CLI to `0.16.0` on a `fix:` commit)
- **Post-release (operator)**: after merge + publish, `npx a16n@latest --version` exits 0 and `npm view @a16njs/plugin-agentsmd@latest dependencies` shows exact semver pin

### Out of Scope (deferred to M2)

- **Published-artifact `workspace:` guard**: inspecting the real to-be-published tarball regardless of which tool produced it. This is the protection that actually matches the npm-vs-pnpm operator error; it belongs in the release pipeline (M2), not a unit test.

### Test Infrastructure

- Framework: Vitest (existing monorepo standard)
- Test location: `packages/cli/test/workspace-publish-invariant.test.ts` — hosted in the CLI package (the top-level consumer) because `pnpm test` runs `turbo run test` per-package; a true repo-root test file would not execute in CI. The test discovers all workspace packages from disk (`packages/*/package.json`).
- Conventions: flat `test/` per package; pure FS reads (no temp dirs / no subprocess)
- New test files: `packages/cli/test/workspace-publish-invariant.test.ts`

## Implementation Plan

1. **Repo-level source-invariant test**
   - Files: `packages/cli/test/workspace-publish-invariant.test.ts`
   - Changes: discover all `packages/*/package.json`; for each package, assert every dependency (any bucket) naming another workspace package uses the `workspace:` protocol. Documents in-file that the npm-vs-pnpm cause is M2 scope.

2. *(removed — per-package pack test; see Test Plan revision note)*

3. *(removed — CLI pack test; see Test Plan revision note)*

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
- [x] Preflight
- [x] Build
- [ ] QA
