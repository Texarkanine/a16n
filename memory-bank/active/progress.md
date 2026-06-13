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
