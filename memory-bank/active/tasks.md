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

> **REWORK.** The first release (PR #119/#120) failed: agentsmd was never released (no path-touching commit) and the CLI re-pinned the poisoned `1.0.2`. The plan below makes both packages release together, with the CLI moving to `0.15.4`.

1. **Repo-level source-invariant test** *(already landed in first release; keep)*
   - Files: `packages/cli/test/workspace-publish-invariant.test.ts`
   - Status: present and passing. Its scope-note comment is corrected in step 3 (it wrongly attributed the breakage to `npm publish`).

2. **agentsmd path-touching trigger + guard**
   - Files: `packages/plugin-agentsmd/test/publish-shape.test.ts` (new)
   - Changes: assert agentsmd's `package.json` declares `publishConfig.access === "public"` and uses the `workspace:` protocol for every sibling dep. This is a real regression guard for the two failure modes that have hit this package (missing public access on first publish; leaked `workspace:`), AND it touches the agentsmd path so Release-Please includes agentsmd in the release.
   - Commit: `fix(plugin-agentsmd): guard published package shape (public access + workspace protocol)`

3. **CLI path-touching trigger + comment correction**
   - Files: `packages/cli/test/workspace-publish-invariant.test.ts`
   - Changes: rewrite the inaccurate scope-note (the pipeline uses `pnpm --filter publish`, not `npm publish`; the real M1 failure was a package being absent from the release set). Touches the CLI path so Release-Please includes `a16n` in the release.
   - Commit: `fix(a16n): correct workspace-invariant test scope note and re-pin agentsmd`

4. **Set forced release versions**
   - Files: `release-please-config.json`
   - Changes: change `packages/cli` `release-as` `"0.15.3"` → `"0.15.4"` (0.15.3 is burned). Keep `packages/plugin-agentsmd` `release-as: "1.0.3"` (never published).

5. **Operator merge-gate (PR description / checklist)**
   - Files: none (PR description)
   - Changes: document that the generated release PR MUST bump BOTH `@a16njs/plugin-agentsmd → 1.0.3` AND `a16n → 0.15.4`. If either package is missing from the release PR, do NOT merge — investigate the path-touch.

6. **Remove `release-as` after successful publish (operator follow-up)**
   - Files: `release-please-config.json`
   - Changes: note in PR that operator removes the temporary `release-as` keys post-publish.

7. **Optional deprecation (now includes a16n@0.15.3)**
   - Files: `scripts/deprecate-poisoned-versions.sh` (optional) OR PR checklist
   - Changes: `npm deprecate` for `@a16njs/plugin-agentsmd@1.0.1`, `1.0.2`, `a16n@0.15.2`, and now `a16n@0.15.3` (poisoned-by-pin).

8. **Verify locally before PR**
   - Commands: `pnpm build && pnpm test`
   - Operator post-merge: `npm view @a16njs/plugin-agentsmd@latest dependencies` (exact models pin) and `npx a16n@latest --version` (exit 0).

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
- [x] Build (first attempt — released but did not fix the bug)
- [x] Rework build (agentsmd + CLI path-touching triggers; CLI → 0.15.4)
- [x] QA — PASS (semantic review clean; full suite green)

## QA Result (2026-06-13)

✅ **PASS** — the rework implementation matches the plan and all code requirements are satisfied.

- **Completeness**: Plan steps 2–4 (the code-bearing steps) are all implemented:
  - Step 2: `packages/plugin-agentsmd/test/publish-shape.test.ts` exists, asserts `publishConfig.access === "public"` + workspace protocol on every sibling, and touches the agentsmd path (the path-touch is the load-bearing fix for RP inclusion).
  - Step 3: CLI `workspace-publish-invariant.test.ts` scope-note rewritten to reflect the real cause (package absent from release set + `pnpm --filter publish`), replacing the inaccurate `npm publish` theory.
  - Step 4: `release-please-config.json` → CLI `release-as: "0.15.4"`, agentsmd `release-as: "1.0.3"` retained.
  - Steps 5–8 are operator follow-ups (PR description, deprecations, post-publish verification) — out of scope for code QA.
- **Regression**: New test mirrors existing conventions (flat `test/`, pure FS reads, Vitest, `PackageManifest`/`DEPENDENCY_BUCKETS` shape from the sibling CLI test). Source `package.json` files still use `workspace:*` — invariant #3 preserved.
- **Integrity**: No debug artifacts, magic numbers, or placeholder values introduced.
- **Tests**: `publish-shape.test.ts` (2) and `workspace-publish-invariant.test.ts` (10) pass; full `pnpm test` green (17 packages, 190 CLI tests).
- **Observations (non-blocking, by design)**:
  - The agentsmd test's workspace-protocol assertion overlaps the repo-wide CLI test. This duplication is intentional and load-bearing: the assertion must live in the agentsmd package path to trigger a Release-Please release. Its unique value is the `publishConfig.access` check the repo-wide test lacks.
  - The agentsmd test iterates all four dependency buckets though agentsmd only populates two; this is defensive future-proofing consistent with the sibling test's style.
  - Plan step 3's commit message says "re-pin agentsmd", but the CLI source change is comment-only (the re-pin happens at publish time via pnpm rewrite). Cosmetic wording note for the not-yet-made commit.
