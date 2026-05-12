# Project Brief: SLOBAC Rework — Cursor Plugin Test Quality

**User Story / Intent:**
Rework the test changes on the `no-cursor-commands` branch to address the 10 test smells identified by the SLOBAC audit (`slobac-audit.md`). The audit found 3× `conditional-logic`, 3× `vacuous-assertion`, and 4× `semantic-redundancy` across the `packages/plugin-cursor/test/` suite.

**Requirements:**
- Address all 10 SLOBAC findings per their prescribed remediations.
- Remove semantically redundant tests (findings 7-10) where the canonical test already exists in a dedicated file.
- Strengthen weak oracles: replace `toBeDefined()` with exact values, replace regex matchers with structural equality where the expected value is knowable (findings 4-6).
- Fix conditional-logic smells: add loop-exit assertions or delete redundant tests that overlap (findings 1-3).
- For the "globs takes precedence" test (finding 3/7): replace the fixture so the test actually witnesses the precedence behavior its title claims.
- Maintain 0 regressions — all 137 tests must continue to pass (some will be deleted, net count will decrease).
- Follow TDD strictly per workspace rules.

**Success Criteria:**
- All 10 SLOBAC findings resolved.
- No new test smells introduced.
- Full test suite passes.
- No regressions in production code.
