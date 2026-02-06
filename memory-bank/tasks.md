# Memory Bank: Tasks

## Current Task: CodeRabbit PR #38 Fixes

**Status:** In Progress
**PR URL:** https://github.com/Texarkanine/a16n/pull/38
**Rate Limit Until:**
**Last Updated:** 2026-02-06T16:00:00Z

### Actionable Items
- [ ] ID: readme-status - Update README.md development status: M3-M6 should be marked complete (✅), not upcoming (🚧)
- [ ] ID: findmd-catch - discover.ts:278 silent catch swallows all readdir errors — surface via warnings accumulator

### Requires Human Decision
- (none)

### Ignored
- ID: type-dir-mismatch - discover.ts:126-179 "No validation that frontmatter type matches directory name" — This is by design: frontmatter type is authoritative, directory is organizational. Documented in architecture decisions.
- ID: test-hooks-scope - discover.test.ts:417-424 "beforeEach/afterEach scope too broad" — Pure efficiency nit, no correctness impact. Temp dir creation is cheap.
- ID: consolidate-discovery-tests - integration.test.ts:728-770 "Consolidate discovery tests" — Both tests serve distinct purposes (smoke check vs type enumeration). Keeping separate for clarity.
- ID: broaden-assertions - integration.test.ts:773-800 "Broaden content assertions" — Test already validates pipeline works. Additional assertions would be testing the cursor plugin, not the a16n plugin.
- ID: frontmatter-roundtrip - integration.test.ts:833-884 "Assert frontmatter preservation in round-trip" — Valid suggestion but low-risk: frontmatter is tested extensively in unit tests. This is a nit.

---

## Prior Task: Phase 9 Milestones 5 & 6 (IR Discovery + E2E Testing)

**Status:** COMPLETE (Reflection documented)
**Branch:** `p9-m5`
**Last Updated:** 2026-02-06
**Complexity:** Level 4
