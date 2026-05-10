# Current Task: Cursor Commands deprecation migration (plugin-cursor)

**Complexity:** Level 3

## Plan Summary (from L3 Plan Phase)

**Goal:** Stop emitting deprecated `.cursor/commands/` entirely. Emit `ManualPrompt` items as Agent Skills in `.cursor/skills/<name>/SKILL.md` with `disable-model-invocation: true` (matching Claude Code + new Cursor recommendation). Retain full discover support for legacy Commands. Document non-roundtrip behavior.

**Key Reference:** Claude plugin's `formatManualPromptAsSkill` + ManualPrompt emission path in `packages/plugin-claude/src/emit.ts`.

**Architectural Note (per systemPatterns.md):** Discovery/Emit asymmetries are intentional. This change formalizes one for Commands → Skills.

## Component Analysis
- **emit.ts (primary change target):** Remove all `.cursor/commands/` emission logic for ManualPrompt. Add Skill emission with disable frontmatter. Adapt sanitization/collision logic.
- **discover.ts:** No functional change (keep `discoverCommands`). Add explanatory comment about non-roundtrip.
- **Tests:** Update `emit-manual-prompt.test.ts` expectations; keep `discover-commands.test.ts` intact. Leverage existing fixtures.
- **Docs:** Update plugin-cursor docs + CHANGELOG.md.
- **No changes:** `@a16njs/models` (ManualPrompt type already correct), other emit paths, engine.

**Cross-module deps:** Models types/guards; test helpers (emit-helpers.ts); fixture dirs for commands.

**Invariants preserved:** TDD, discover of Commands, name sanitization (skills are lowercased per spec), relativeDir support, warn-and-continue, collision handling.

**Open Questions resolved (high confidence, no creative needed):**
- Description text: "Invoke with /<promptName>" (exact match to Claude).
- Documentation location: Code comments in emit.ts + discover.ts + test comments + docs site.
- Test approach: Modify existing emit-manual-prompt.test.ts (no new fixture dir required for this migration).

## TDD Test Plan (Behaviors → Tests)
1. ManualPrompt emit produces `.cursor/skills/<name>/SKILL.md` (not commands/) with correct frontmatter + content.
   - Test file: `packages/plugin-cursor/test/emit-manual-prompt.test.ts` (update existing cases)
2. Sanitization, collision handling, relativeDir work for ManualPrompt-as-Skill.
   - Same test file + possibly `emit-filename-case.test.ts` / `emit-source-items.test.ts`
3. Discover Commands still produces ManualPrompt (no regression).
   - `packages/plugin-cursor/test/discover-commands.test.ts` (unchanged)
4. Full engine roundtrip of Command fixture now yields Skill output (asymmetry noted in test comment).
5. No regressions in other Cursor emit paths.

**Edge cases:** Complex commands (already skipped with warning), name collisions, nested relativeDir, empty content.

## Ordered Implementation Plan (TDD Cycles)

**Phase: Preparation (Stubbing) - per always-tdd rule**
1. Update `packages/plugin-cursor/test/emit-manual-prompt.test.ts`:
   - Change assertions to expect Skill output in `.cursor/skills/.../SKILL.md`.
   - Add multi-line comment explaining the migration and non-roundtrip for Commands.
   - Do **not** implement the emit change yet.

2. Stub (if needed) any new helper in emit.ts (e.g., `formatManualPromptAsSkill` signature + JSDoc, empty body). Keep existing command helpers temporarily for compilation.

**Phase: Write Tests (make them fail)**
3. Run the updated `emit-manual-prompt.test.ts` — it must fail (no Skill emission yet).

**Phase: Implement (make tests pass, one cycle at a time)**
4. In `packages/plugin-cursor/src/emit.ts`:
   - Add `formatManualPromptAsSkill(prompt: ManualPrompt): string` (copy pattern from Claude, using YAML frontmatter with disable-model-invocation).
   - Replace the entire "Emit ManualPrompts as .cursor/commands" block with equivalent Skill emission logic (using skills/ dir, sanitizePromptName, getUniqueFilename, collision Set).
   - Remove or guard unused command-specific code (`getUniqueCommandFilename`, commandsDir logic).
   - Add prominent header comment documenting the deprecation, non-roundtrip, and reference to Claude.
   - Update the main emit dispatcher routing for ManualPrompt.

5. In `packages/plugin-cursor/src/discover.ts`:
   - Add clear comment near `discoverCommands` function: "Commands are discovered for legacy support but do not round-trip. Emitted form is now a disable-model-invocation Agent Skill."

6. Run targeted test: `emit-manual-prompt.test.ts` → should pass.

7. Run full Cursor plugin test suite (`npm run test` in package) to catch any cross-test impact.

**Phase: Polish & Docs**
8. Update `packages/plugin-cursor/CHANGELOG.md` with entry for the deprecation migration.
9. Update `packages/docs/docs/plugin-cursor/index.md` if it describes Commands emission (note the new Skill output).
10. Verify no linter/build errors (`npm run lint && npm run build`).

**Verification:** Full test suite across affected packages, TDD adherence (tests written first), commit with conventional message.

## Challenges & Mitigations
- Test suite breakage from emit change: Mitigated by strict TDD order and running targeted tests first.
- Fixture maintenance: Existing command fixtures remain valid for discover tests; emit tests are updated in-place.
- Name collision between former Commands and existing Skills: Handled by existing unique-filename logic now applied uniformly to skills/.
- No Level 4 risk (scoped to one plugin's emit path).

## Technology Validation
No new dependencies or tools. Validation not required.

## Next Actions After Plan Complete
- ✅ Preflight completed: PASS (advisory only - future shared helper opportunity noted but deferred).
- Operator: run `/niko-build` to begin implementation (TDD: stub tests first).
- Then QA → Reflect → Archive per L3 workflow.