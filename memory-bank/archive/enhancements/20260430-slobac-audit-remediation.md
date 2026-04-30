---
task_id: slobac-audit-remediation
complexity_level: 2
date: 2026-04-30
status: completed
---

# TASK ARCHIVE: SLOBAC Audit Remediation

## SUMMARY

Remediated all 19 SLOBAC audit findings (deliverable fossils and naming lies) across 10 test files in five packages. Work included 68+ mechanical renames of `describe`/`it` titles, strengthening seven previously empty-body tests in `plugin-a16n` with real round-trip assertions, and four title/assertion alignment fixes. Production code was not changed; tests were aligned to existing behavior. QA additionally removed nine residual inline `// AC` comments in `cli.test.ts`.

## REQUIREMENTS

- Validate each audit claim against the codebase before fixing; production code remains the oracle.
- Strip phase labels, ticket IDs, date-task IDs, and AC/B-style prefixes from test block names where flagged (rename-only where specified).
- Replace naming lies: real assertions or `it.todo` for empty bodies; titles matched to assertions or vice versa.
- Test-only changes; no production edits.

## IMPLEMENTATION

- **Phase A:** Fossil renames in `packages/plugin-cursor/test/discover.test.ts`, `emit.test.ts`; `packages/plugin-claude/test/discover.test.ts`, `emit.test.ts`; `packages/cli/test/cli.test.ts`, `commands/convert.test.ts`, `integration/integration.test.ts`; `packages/glob-hook/test/cli.test.ts`.
- **Phase B:** `packages/plugin-a16n/test/format.test.ts` — AgentSkillIO formatting checks and format→parse→format round-trips with mock workspace; `packages/cli` and `packages/docs` tests updated per findings 16–19.
- **QA:** Stripped `// AC1:`–`// AC9:` adjacent comments in `cli.test.ts` where titles were already self-descriptive.

## TESTING

- Full build and lint passed; 703/703 tests passed in the validating environment.
- Two WSL-local failures (engine/plugin-discovery, glob-hook/cli) confirmed identical on `main`, treated as environment noise rather than regressions.

## LESSONS LEARNED

- The audit’s “tests considered but not flagged” section prevented scope creep (e.g. intentional non-renames elsewhere).
- Round-trip tests against `formatIRFile`/`parseIRFile` succeeded without needing the planned `it.todo` fallback.
- Finding 17: production did not emit “Would delete”; title was renamed per fallback, not assertions forced to match a misleading title.

## PROCESS IMPROVEMENTS

- Treat “lower-priority” checklist items as in-scope during build when they are the same class of fix (e.g. all `// AC` comments in a file), so QA does not repeatedly catch deferred cosmetics.

## TECHNICAL IMPROVEMENTS

- Prefer stable product-capability vocabulary in test names from the start to avoid deliverable-fossil churn.

## NEXT STEPS

None.

---

## Inlined reflection (ephemeral source: `reflection-slobac-audit-remediation.md`)

### Reflection summary

Every requirement delivered as planned. No findings dropped. The `it.todo` fallback for round-trips was never needed. Finding 17 used the title-rename fallback correctly. QA removed nine inline `// AC` comments beyond the two addressed during build.

### Plan accuracy

The 13-step plan matched sequence, files, and scope. The gap: build treated inline `// AC` comments as partially optional; QA closed it.

### Insights (technical)

Future SLOBAC-style audits should keep an explicit cleared-items section so adjacent smells are not “fixed” by mistake.

### Insights (process)

Deferring “lower-priority” items that belong to the same remediation class causes avoidable QA rework.

### Million-dollar question

Remediation was mechanical by nature; foundational naming discipline would have prevented fossil vocabulary in tests.
