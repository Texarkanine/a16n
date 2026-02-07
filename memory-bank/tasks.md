# Memory Bank: Tasks

## Current Task: CodeRabbit PR #38 Fixes

**Status:** In Progress
**PR URL:** https://github.com/Texarkanine/a16n/pull/38
**Rate Limit Until:**
**Last Updated:** 2026-02-06T23:30:00Z

### Actionable Items
- [x] ID: readme-status - Update README.md development status: M3-M6 marked complete (✅) - FIXED in 3c30132
- [x] ID: findmd-catch - discover.ts:278 silent catch swallows all readdir errors — surfaced via warnings accumulator - FIXED in 3c30132
- [x] ID: path-sep-windows - discover.ts:144 path.relative returns OS-specific separators on Windows — normalized with .split(path.sep).join('/') - FIXED in 66ae9e7
- [x] ID: agentskill-catch - discover.ts:196-201 silent readdir catch in discoverAgentSkillIO — surfaced via warnings accumulator for consistency - FIXED in 66ae9e7
- [x] ID: agentskill-abs-path - discover.ts:204 warning sources leaks absolute path — changed to relative `.a16n/agent-skill-io` - FIXED in (pending commit)
- [x] ID: discover-readdir-warn - discover.ts:71-77 silent readdir catch in discover() — added warning for consistency - FIXED in (pending commit)
- [x] ID: findmd-abs-path - discover.ts:295 findMdFiles warning sources uses absolute targetDir — changed to relative `.a16n/<type>/...` path - FIXED in (pending commit)

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
