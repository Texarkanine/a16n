# Project Brief: SLOBAC Audit Remediation

## User Story

Remediate all 19 findings from the SLOBAC audit (`slobac-audit.md`), covering two smell categories across 10 test files in 5 packages.

## Requirements

1. **Validate before remediating**: Each finding makes claims about test names and/or assertion bodies. Verify each claim against the actual code before applying any fix. If a claim is false, do not remediate — flag it instead.

2. **Deliverable fossils** (findings 1–5, 13–15): Strip phase labels, ticket IDs, date-task IDs, and acceptance-criteria prefixes from `describe`/`it` block names. Rename-only; no assertion changes.

3. **Naming lies** (findings 6–12, 16–19): For empty-body tests (`expect(true).toBe(true)`), either implement real assertions or convert to `it.todo(...)`. For title/assertion mismatches, either strengthen assertions to match titles or rename titles to match actual assertions.

4. **Production code is untouched**: All changes are test-only. The existing production code is the oracle — tests must be updated to correctly describe what the production code does.

## Scope

- `packages/plugin-cursor/test/discover.test.ts`
- `packages/plugin-cursor/test/emit.test.ts`
- `packages/plugin-claude/test/discover.test.ts`
- `packages/plugin-claude/test/emit.test.ts`
- `packages/cli/test/cli.test.ts`
- `packages/cli/test/commands/convert.test.ts`
- `packages/cli/test/integration/integration.test.ts`
- `packages/plugin-a16n/test/format.test.ts`
- `packages/glob-hook/test/cli.test.ts`
- `packages/docs/test/generate-versioned-api.test.ts`
