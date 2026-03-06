# Project Brief: Launch Readiness Polish

## User Story

As the maintainer of a16n preparing for a public announcement (Show HN / LinkedIn / blog), I want to fix critical issues, clean up garbage tests, and polish the first-impression experience so the tool holds up when strangers try it for the first time.

## Requirements

### Must-Fix (from creative phase)

1. **Security: Path traversal in plugin-claude emit** — `emitAgentSkillIO` lacks filename validation that plugin-cursor already has
2. **Missing CONTRIBUTING.md** — README links to it, it doesn't exist
3. **Broken docs links** — `/plugin-cursorrules` 404, CLI reference mismatch, intro link mismatch
4. **Improve invalid --from/--to error messages** — Add suggestion text when engine throws "Unknown source/target"
5. **Add `engines` to CLI package.json** — `"node": ">=20.0.0"`, ensure all packages are updated to match and .nvmrc & CI (should defer to .nvmrc for Node version); Node 20 is the oldest version we'll attempt to support.

### Added by operator

6. **Stubbed/garbage tests must be rectified** — 11 empty test bodies in `cli.test.ts` with `// TODO: Implement test`. Each must be either properly implemented or deleted, as appropriate.
7. **Fix `any` types in convert.ts if legitimate** — Check architecture and decide whether the `any` is justified or should be typed. Only fix if it's genuinely wrong.
8. **README pitch: make it clear it's not just cursor/claude** — The tool is extensible via plugins; Cline support was started. The README should communicate breadth, not just two tools.
9. **Aggregate Codecov badge on main README** — Add a total-coverage badge. User notes it won't match the per-package CLI badge.

## Constraints

- Do NOT start implementing; plan only, operator will review before build
- Follow TDD process for all code changes
- Existing tests must continue to pass
- No new dependencies unless absolutely necessary
