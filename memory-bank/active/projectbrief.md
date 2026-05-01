# Project Brief: SLOBAC Audit Remediation

## User Story

Remediate all 20 findings from the SLOBAC test-suite audit (`slobac-audit.md`). The audit identified 5 smell types across 9 test files in 5 packages:

- **deliverable-fossils** (10 findings) — Test names/comments containing work vocabulary (AC-ID prefixes, task IDs, refactor references)
- **naming-lies** (3 findings) — Test titles that contradict what the body actually verifies
- **shared-state** (1 finding) — Module-level mutable engine shared across tests without per-test factory
- **monolithic-test-file** (6 findings) — Large test files covering multiple behavior domains that should be split

## Requirements

1. All deliverable-fossils and naming-lies remediated via rename-only changes (no body changes)
2. Shared-state fix folded into the integration.test.ts monolithic split
3. Each monolithic test file split along behavior-domain boundaries per audit prescriptions
4. Shared test helpers extracted into `test-support/` directories where prescribed
5. All tests must pass after each milestone
6. No behavioral changes — only structural reorganization and naming corrections

## Reference

- Audit report: `slobac-audit.md` (root)
- Audit taxonomy: `~/.cursor/skills/slobac-audit/references/docs/taxonomy/`
