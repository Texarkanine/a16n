# Progress

Restore `a16n@latest` installability by republishing `@a16njs/plugin-agentsmd` and the `a16n` CLI through the automated pnpm publish path, replacing poisoned tarballs that leaked literal `workspace:*` dependencies.

**Complexity:** Level 2

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified L4 milestone M1 as **Level 2** (bug fix spanning two packages + Release-Please forced versions; multiple components but contained, no architectural redesign).
* Decisions made
    - Scoped `projectbrief.md` to M1 deliverable; L4 capstone brief preserved in archive history and `milestones.md`.
    - Deferred CI tarball guards and repo-wide `publishConfig` to M2 per milestone boundaries.

## 2026-06-13 - PLAN - COMPLETE

* Work completed
    - Authored L2 plan in `tasks.md`: Vitest pack tests, `release-as` forced patches, optional deprecation script, operator post-publish verification.
* Decisions made
    - Use `release-as: "0.15.3"` for CLI to avoid `bump-minor-pre-major` jumping to `0.16.0`.
    - Pack tests live in package `test/` dirs; CI tarball guard explicitly deferred to M2.

## 2026-06-13 - PREFLIGHT - COMPLETE

* Work completed
    - Validated M1 plan: TDD order, test conventions, release.yaml touchpoints, requirement coverage. Wrote `.preflight-status` (PASS with advisory).
* Decisions made
    - No plan amendments required; advisories documented for build phase.

## 2026-06-13 - BUILD - COMPLETE

* Work completed
    - Pack tests for agentsmd and CLI; `release-as` forced patches in `release-please-config.json`.
* Decisions made
    - Skipped optional deprecation script; document as operator post-publish step.
    - **Operator-reviewed test scope:** dropped the per-package `pnpm pack` tests — they assert pnpm's own rewrite (near-tautological) and cannot reproduce the real cause (operator ran `npm publish`). Replaced with one repo-level source-invariant test in the CLI package covering all workspace packages. The artifact-inspection guard that actually matches the failure mode is deferred to M2 (release-pipeline hardening).
* Insights
    - Local `pnpm pack` already rewrites correctly; the breakage was a wrong-tool (`npm publish`) bypass — a property of the publish *command*, not the source tree, so it can only be guarded in the pipeline (M2), not a unit test.
    - A repo-level test must be hosted inside a workspace package (CLI) because `pnpm test` runs `turbo run test` per-package; a root-level test file would not run in CI.

## 2026-06-13 - REWORK INITIATED (post-release failure) - IN-PROGRESS

* Trigger
    - First M1 release shipped but did not fix the bug. `a16n@0.15.3` is `latest` yet pins poisoned `@a16njs/plugin-agentsmd@1.0.2`; `agentsmd@1.0.3` was never published (`latest` still `1.0.2` with `@a16njs/models: "workspace:*"`). `npx a16n@latest` still throws `EUNSUPPORTEDPROTOCOL`.
* Corrected root cause
    - Pipeline publishes via `pnpm --filter publish` (release.yaml:89), not `npm publish` — the prior "wrong tool" insight was incorrect.
    - Release-Please only releases a package when a commit touches that package's path. PR #119 changed nothing under `packages/plugin-agentsmd/`, so RP excluded agentsmd entirely and `release-as: "1.0.3"` never applied. The CLI released alone and pnpm rewrote its `workspace:*` to the local agentsmd `1.0.2`.
* Decisions made (operator-approved)
    - Rework M1 in place rather than spinning a separate M1.1 milestone.
    - CLI target moves `0.15.3` → `0.15.4` (0.15.3 is immutable and poisoned-by-pin).
    - Both packages get a real path-touching `fix:` commit so RP includes both in one release PR.
    - Add an operator merge-gate: the release PR must bump BOTH `agentsmd → 1.0.3` and `a16n → 0.15.4` before merge.

## 2026-06-13 - QA - COMPLETE

* Work completed
    - Semantic review of the rework against the revised plan (KISS/DRY/YAGNI/completeness/regression/integrity/docs).
    - Verified the three code-bearing steps: agentsmd `publish-shape.test.ts` (path-touch + public-access + workspace guard), CLI scope-note correction, `release-as` 0.15.4 (cli) / 1.0.3 (agentsmd).
    - Ran affected suites and full `pnpm test`: all green (17 packages; agentsmd 2/2, CLI invariant 10/10, 190 CLI tests).
* Result
    - ✅ PASS. No blocking findings. Cleared to proceed with the operator action plan (PR, merge-gate, publish, optional deprecations).
* Insights
    - The agentsmd test's workspace-protocol check duplicates the repo-wide CLI test, but the duplication is load-bearing: only a test under `packages/plugin-agentsmd/` can trigger that package's Release-Please inclusion. Its non-redundant value is the `publishConfig.access` assertion.

## 2026-06-13 - REFLECT - COMPLETE

* Work completed
    - Authored `memory-bank/active/reflection/reflection-v1-release-rollout-m1.md`.
    - Reconciled persistent files: surgical `techContext.md` addition documenting Release-Please path-inclusion and `pnpm --filter publish` behavior.
* Decisions made
    - M1 sub-run code work is complete; operator merge/publish/verification remains before milestone can be checked off.
* Insights
    - A green first release that fails the user story is worse than no release — merge-gate on release PR package inclusion should be standard for multi-package repairs.
    - Tests placed for CI convenience (repo-wide in CLI) cannot substitute for path-local commits when Release-Please governs what gets published.
