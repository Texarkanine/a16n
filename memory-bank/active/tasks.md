# Task: dependabot-pr-remediation

* Task ID: 20260612-dependabot-pr-remediation
* Complexity: Level 3
* Type: bugfix/remediation

Remediate all currently problematic open Dependabot PRs by applying targeted, minimal fixes on the affected PR branches so each one can pass CI and become safely mergeable.

## Pinned Info

### PR Remediation Flow

This flow is pinned because all implementation steps follow the same branch-level TDD loop and then converge on CI validation/reclassification.

```mermaid
flowchart TD
    A["Identify failing PR + root cause"] --> B["Create isolated PR worktree"]
    B --> C["Write/define failing verification first"]
    C --> D["Implement minimal fix in PR worktree"]
    D --> E["Run targeted local validation"]
    E --> F["Commit + push to PR branch"]
    F --> G["Observe GitHub CI"]
    G --> H{"CI green + risk addressed?"}
    H -- Yes --> I["Update memory bank on orchestration branch"]
    H -- No --> A
```

### Branch & Memory Bank Protocol

This protocol is pinned because branch management is the highest operational risk in this task.

1. Keep `init-dependabot` as the orchestration branch in the primary worktree and treat it as the only place where `memory-bank/active/*` is edited.
2. For each PR fix cycle, create/use a dedicated linked worktree (for example `.worktrees/pr-107`) checked out to that PR branch.
3. Run red -> green validation and apply code fixes only inside the PR worktree; do not touch memory-bank files there.
4. Commit and push only PR-relevant code/config changes from the PR worktree.
5. Return to the primary orchestration worktree, then update `memory-bank/active/tasks.md`, `memory-bank/active/progress.md`, and `memory-bank/active/activeContext.md` with outcome and next action.
6. Keep both worktrees clean before switching context; no stashing as normal flow.
7. Remove PR worktree after the PR is green/mergeable to reduce state drift.

## Component Analysis

### Affected Components
- GitHub PR branches (`#114`, `#112`, `#111`, `#109`, `#108`, `#107`): each branch contains a dependency bump plus a specific failure mode to remediate.
- `packages/docs/package.json`: dependency alignment for React/ReactDOM and Docusaurus-family compatibility.
- `packages/docs/docusaurus.config.js`: Docusaurus `future` config compatibility (`experimental_faster` -> `faster` where required).
- `packages/glob-hook/tsconfig.json`: TypeScript 6 compatibility via explicit Node type inclusion.
- `packages/cli/package.json` and `packages/docs/package.json`: Node engine floor alignment with Commander 15 requirements.
- CI workflow behavior (`.github/workflows/ci.yaml`): authoritative check gate used to confirm remediation success.

### Cross-Module Dependencies
- Docs build validity depends on tight version/config coupling across `@docusaurus/*`, `react`, `react-dom`, and `docusaurus.config.js`.
- `@a16njs/glob-hook` compilation under TS6 depends on root tsconfig baseline plus package-level Node typings opt-in.
- Commander runtime safety depends on package `engines.node` declarations matching Commander 15's supported Node range.
- PR mergeability depends on both local targeted validation and remote GitHub `Build & Test` check completion.

### Boundary Changes
- Public runtime contract change: `engines.node` minimum version in package manifests (for commander 15 safety).
- No IR schema/API interface changes are planned.
- Dependency version boundaries will be adjusted only where needed for compatibility.

### Invariants & Constraints
- Keep changes minimal and scoped to each PR's concrete blocker.
- Preserve existing plugin architecture and conversion behaviors (no engine/model refactors).
- Maintain passing `Build & Test` CI checks, including docs build verification.
- Avoid destructive git operations; do not modify unrelated open PRs.

## Open Questions

None - implementation approach is clear.

## Test Plan (TDD)

### Behaviors to Verify
- `PR #107` docs config with Docusaurus 3.10.x deps: `docs:build:current` succeeds after config-key fix.
- `PR #108` dev-deps bundle with current docs stack: docs build succeeds after Docusaurus compatibility alignment.
- `PR #112` TypeScript 6 branch: `@a16njs/glob-hook` build/typecheck resolves Node globals (`process`, `Buffer`, `node:fs`) without TS2591/TS2584 errors.
- `PR #109` commander 15 branch: package engine declarations match commander requirement (`>=22.12.0`) and build remains green.
- `PR #111` and `PR #114` React bumps: `react`/`react-dom` versions are aligned and docs build no longer fails on version mismatch/dispatcher runtime errors.
- Edge case: branch-level fixes remain isolated (no accidental cross-PR contamination).

### Test Infrastructure
- Framework: Vitest + TypeScript compiler + Docusaurus build + GitHub Actions CI.
- Test locations: package-local test/build scripts and CI workflow gate in `.github/workflows/ci.yaml`.
- Conventions: targeted package command first, then full/CI-equivalent verification as needed.
- New test files: none expected (configuration/remediation task; validation through existing command/test infrastructure).

### Integration Tests
- For each remediated PR: local targeted command(s) pass, then remote `Build & Test` check passes on pushed branch.
- Final integration confirmation: open Dependabot PR list shows remediated PRs in mergeable/clean state.

## Implementation Plan

1. Establish remediation workspace and verify open problematic PR set.
    - Files: GitHub PR metadata and local worktree layout (no repo file edits yet).
    - Changes: lock final target list/blocker mapping and set up isolated per-PR worktrees.
    - TDD cycle: capture current failing checks first as baseline assertions.
2. Remediate `#107` (Docusaurus deps group) by updating docs future config key.
    - Files: `packages/docs/docusaurus.config.js` (on PR branch `#107`).
    - Changes: replace `future.experimental_faster` usage with compatible `future.faster` structure.
    - TDD substeps:
        1. Run `pnpm --filter docs run docs:build:current` on the PR branch and confirm it fails with the `future.experimental_faster` rename error.
        2. Apply the config-key fix in `docusaurus.config.js`.
        3. Re-run `pnpm --filter docs run docs:build:current` and confirm success before pushing.
    - Validation: verify branch CI `Build & Test` transitions to green.
3. Remediate `#108` (dev-deps group) by aligning docs compatibility surface.
    - Files: `packages/docs/package.json` (primary) and `packages/docs/docusaurus.config.js` (only if needed) on PR branch `#108`.
    - Changes: align `@docusaurus/types` and `@docusaurus/module-type-aliases` with the branch's runtime Docusaurus line to eliminate mixed-version docs build breakage.
    - TDD substeps:
        1. Run `pnpm --filter docs run docs:build:current` and confirm current ProgressPlugin validation failure.
        2. Apply version-alignment fix in `packages/docs/package.json` (and config tweak only if still required).
        3. Re-run `pnpm --filter docs run docs:build:current` and confirm success before pushing.
    - Validation: verify branch CI `Build & Test` passes.
4. Remediate `#109` (commander 15) by aligning engine constraints.
    - Files: `packages/cli/package.json`, `packages/docs/package.json` (on PR branch `#109`).
    - Changes: update `engines.node` minimum to satisfy commander 15 runtime requirement.
    - TDD substeps:
        1. Confirm pre-fix mismatch (`commander@15` requires Node `>=22.12.0` while package engines are `>=22.0.0`).
        2. Update package engine declarations to `>=22.12.0`.
        3. Run targeted package builds and ensure no regressions before pushing.
    - Validation: package builds pass and CI remains green.
5. Remediate `#112` (TypeScript 6) by adding explicit Node typings in glob-hook compiler config.
    - Files: `packages/glob-hook/tsconfig.json` (on PR branch `#112`).
    - Changes: add `compilerOptions.types` (Node) and keep existing output/root settings intact.
    - TDD substeps:
        1. Run `pnpm --filter @a16njs/glob-hook run build` and confirm TS2591/TS2584 failures for Node globals.
        2. Add explicit Node typings in `packages/glob-hook/tsconfig.json`.
        3. Re-run `pnpm --filter @a16njs/glob-hook run build` and confirm success before pushing.
    - Validation: targeted glob-hook build/typecheck and branch CI green.
6. Remediate `#111` (react-only bump) by pairing react-dom upgrade in same branch.
    - Files: `packages/docs/package.json` (on PR branch `#111`).
    - Changes: ensure `react` and `react-dom` majors/versions are aligned.
    - TDD substeps:
        1. Run `pnpm --filter docs run docs:build:current` and confirm React dispatcher/version-mismatch failure.
        2. Align `react` and `react-dom` versions in `packages/docs/package.json`.
        3. Re-run docs build and confirm success before pushing.
    - Validation: docs build and CI pass.
7. Remediate `#114` (react-dom-only bump) by pairing react upgrade in same branch.
    - Files: `packages/docs/package.json` (on PR branch `#114`).
    - Changes: ensure `react` and `react-dom` majors/versions are aligned.
    - TDD substeps:
        1. Run `pnpm --filter docs run docs:build:current` and confirm incompatible React versions failure.
        2. Align `react` and `react-dom` versions in `packages/docs/package.json`.
        3. Re-run docs build and confirm success before pushing.
    - Validation: docs build and CI pass.
8. Reclassify PR health and complete merge-readiness actions.
    - Files: none (operational state).
    - Changes: refresh A/B/C/D classification; approve/enable auto-merge where policy allows.
    - Validation: all previously problematic PRs are either mergeable or have explicit external blockers.

## Technology Validation

No new technology - validation not required.

## Challenges & Mitigations

- Branch drift while fixing multiple PRs: use isolated per-PR linked worktrees and keep memory-bank writes in the orchestration worktree only.
- Duplicate React PRs (`#111`, `#114`) with overlapping outcome: apply branch-local pair fix to make each independently mergeable.
- Docusaurus compatibility nuances across grouped dependency updates: validate with real docs build, not only install/build heuristics.
- Token/policy limitations (workflow-scope restrictions): treat as external blocker if encountered; document separately from code-safety status.

## Build Execution Results

- `#107`: Fixed Docusaurus `future.experimental_faster` -> `future.faster` and aligned docs compatibility deps; local docs build passed and remote `Build & Test` passed.
- `#108`: Aligned docs compatibility surface (runtime/dev Docusaurus line + SWC typing support); local docs build passed and remote `Build & Test` passed.
- `#109`: Already remediated before this run; remained green throughout this build phase.
- `#112`: Initial `glob-hook` Node typings fix was insufficient for full TS6 workspace build; added explicit Node typings in `tsconfig.base.json` and `packages/models/tsconfig.json`; local full build passed and remote `Build & Test` passed.
- `#111`: Paired `react-dom` with the React bump; local docs build passed and remote `Build & Test` passed.
- `#114`: Paired `react` with the ReactDOM bump; local docs build passed and remote `Build & Test` passed.
- Operational: cleaned up all temporary linked PR worktrees after checks were green.

## QA Findings

- PASS: All targeted Dependabot PRs in scope (`#107`, `#108`, `#109`, `#111`, `#112`, `#114`) are now `CLEAN` with successful `Build & Test` checks.
- PASS: Implemented fixes stayed within required remediation scope (dependency/config and TS typing compatibility); no unrelated architecture changes were introduced.
- PASS: One meaningful plan deviation was required on `#112` - TS6 regressions extended beyond `glob-hook`, so shared/base and `models` typing fixes were added to restore workspace build integrity.

## Status

- [x] Component analysis complete
- [x] Open questions resolved
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA
