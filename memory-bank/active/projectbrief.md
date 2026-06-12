# Project Brief

## User Story

As a maintainer, I want to resolve the failing and unsafe Dependabot pull requests so that all open dependency updates become mergeable with passing checks and aligned runtime/tooling constraints.

## Use-Case(s)

### Use-Case 1

Triage each problematic open Dependabot PR and identify the concrete blocker preventing safe merge (CI failure, compatibility mismatch, configuration drift, or policy mismatch).

### Use-Case 2

Implement minimal, correct fixes in the repository so Dependabot PRs can be rebased/re-run and merged without introducing regressions.

## Requirements

1. Re-validate all open Dependabot PRs currently in bucket B (unsafe now, small fix needed).
2. Address each blocker with targeted code/config updates and test coverage where applicable.
3. Re-run relevant verification and ensure CI passes for the remediated PRs.
4. Keep fixes minimal and explicit; avoid broad unrelated refactors.
5. Preserve documented repository merge and CI conventions.

## Constraints

1. Changes must remain safe and reversible through normal git history.
2. No destructive repository operations.
3. Fixes must be compatible with the repository's existing Node, TypeScript, Docusaurus, and workflow conventions.
4. Prioritize correctness over speed; do not mark PRs safe without evidence.

## Acceptance Criteria

1. Each previously problematic open Dependabot PR has a resolved blocker or a clearly documented external blocker.
2. PRs that are fixable from this repository are brought to a mergeable state with passing checks.
3. A final categorized status (A/B/C/D) reflects the post-fix reality and any remaining risks.
