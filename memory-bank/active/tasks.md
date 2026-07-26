# Task: Preserve authored description on ManualPrompt

* Task ID: issue-147-manualprompt-description
* Complexity: Level 2
* Type: simple enhancement / fidelity bug fix

Skills with `disable-model-invocation: true` classify as `ManualPrompt`, which today has no `description` field. Authored prose is dropped at discover; emit always writes `Invoke with /<promptName>`. Add optional `description` to `ManualPrompt`, preserve when present through IR and skill emit, synthesize only when absent, and never silently replace authored text with boilerplate.

**Direction (re-evaluated at plan time):** Option 1. Cursor and Claude both implement `disable-model-invocation`; [agentskills/agentskills#236](https://github.com/agentskills/agentskills/issues/236) proposed standardizing it but it is not in the official spec. Keep ManualPrompt classification (do not load as model-invocable AgentSkillsIO — that would widen the application surface). Do not pre-add the field to our AgentSkills.io spec model; continue special-casing the proprietary/shared-superset flag via classification only. Option 2 (invocation mode as a skill property) remains out of scope.

**Cannot-carry note:** ManualPrompt emit was migrated from Cursor commands to skills (#99). Live skill surfaces (Claude/Cursor `SKILL.md`, `.a16n/`) *can* carry `description`. The live bug is silent *overwrite* on a carrying surface. `agentsmd` still rejects the whole type (`Unsupported`). No new command-emit path.

## Test Plan (TDD)

### Behaviors to Verify

- **B1 Discover Claude:** skill with `disable-model-invocation: true` + authored `description:` → ManualPrompt with that `description`
- **B2 Discover Cursor:** same for `.cursor/skills/**/SKILL.md`
- **B3 Discover commands:** `.cursor/commands/*.md` → ManualPrompt with `description` undefined (no frontmatter)
- **B4 Emit preserve Claude:** ManualPrompt with authored `description` → `SKILL.md` frontmatter uses that text (not `Invoke with /…`)
- **B5 Emit preserve Cursor:** same for Cursor skills emit
- **B6 Emit synthesize:** ManualPrompt with no `description` → both skill emitters still write `Invoke with /<promptName>`
- **B7 IR round-trip:** ManualPrompt with optional `description` survives `plugin-a16n` format → parse → format
- **B8 IR absent:** ManualPrompt without `description` still parses/formats (commands-origin shape)
- **B9 Cannot-carry target:** ManualPrompt (with or without description) → `agentsmd` still warns Unsupported / does not invent a description on a non-skill surface
- **B10 Spec fields regress:** ManualPrompt still carries #143 `AgentSkillSpecFields` alongside optional `description`

### Edge Cases

- Empty-string `description:` — treat as absent for synthesize purposes (same truthy-drop pattern as other frontmatter fields; do not preserve empty as authored)
- Authored description that happens to equal `Invoke with /name` — still treat as authored (preserve bytes; do not "detect" synthetic)
- Round-trip `claude → a16n → claude` and `claude → cursor → claude` keep authored description

### Test Infrastructure

- Framework: Vitest
- Test location: package-local `packages/*/test/`
- Conventions: flat `discover-<domain>.test.ts` / `emit-<domain>.test.ts`; fixtures under `test/fixtures/`; integration under `packages/cli/test/integration/`
- New test files: none required if existing suites absorb cases; prefer extending:
  - `packages/plugin-claude/test/discover-manual-prompt.test.ts`
  - `packages/plugin-claude/test/emit-manual-prompt.test.ts`
  - `packages/plugin-cursor/test/discover-skills.test.ts` (or dedicated manual-prompt discover assertions)
  - `packages/plugin-cursor/test/emit-manual-prompt.test.ts`
  - `packages/plugin-a16n/test/format.test.ts` / `parse.test.ts`
  - `packages/models/test/` (type / version if bumped)
  - Existing `plugin-agentsmd` unsupported emit coverage for B9
  - Optional CLI integration fixture if unit coverage misses claude↔cursor round-trip

## Implementation Plan

Each numbered step is one TDD cycle: write the listed failing tests → implement production code → re-run until green. Do not implement a step's production changes before its tests exist and fail for the right reason.

1. **Models: optional `description` on ManualPrompt**
   - Files: `packages/models/src/types.ts`, `packages/models/src/version.ts`, `packages/models/test/types.test.ts`, `packages/models/test/` version tests if present
   - Tests first: assert ManualPrompt may carry optional `description`; assert `CURRENT_IR_VERSION` is `v1beta4` (or whatever bump lands)
   - Then implement: `description?: string` on `ManualPrompt`; bump `CURRENT_IR_VERSION` v1beta3 → v1beta4 with comment (same pattern as #143)

2. **Discover: preserve when present (Claude + Cursor skills)**
   - Files: `packages/plugin-claude/test/discover-manual-prompt.test.ts`, `packages/plugin-cursor/test/discover-skills.test.ts` (or peer), `packages/plugin-claude/src/discover.ts`, `packages/plugin-cursor/src/discover.ts`
   - Tests first: B1–B3, B10 (failing until discover copies non-empty frontmatter `description`)
   - Then implement: when building ManualPrompt from skill frontmatter, set `description` when non-empty; leave undefined for commands/rules-origin ManualPrompts

3. **IR: format + parse optional description**
   - Files: `packages/plugin-a16n/test/format.test.ts`, `packages/plugin-a16n/test/parse.test.ts`, fixtures under `packages/plugin-a16n/test/fixtures/`, `packages/plugin-a16n/src/format.ts`, `packages/plugin-a16n/src/parse.ts`
   - Tests first: B7–B8
   - Then implement: write `description` when defined; read into ManualPrompt when present

4. **Emit: preserve ‖ synthesize (Claude + Cursor)**
   - Files: `packages/plugin-claude/test/emit-manual-prompt.test.ts`, `packages/plugin-cursor/test/emit-manual-prompt.test.ts`, `packages/plugin-claude/src/emit.ts` (`formatManualPromptAsSkill`), `packages/plugin-cursor/src/emit.ts` (`formatManualPromptAsSkill`)
   - Tests first: B4–B6 (authored preserved; absent still synthesizes); keep existing synthesize assertions
   - Then implement: `const description = prompt.description ?? \`Invoke with /${prompt.promptName}\``

5. **Cannot-carry / agentsmd**
   - Files: `packages/plugin-agentsmd/test/emit-unsupported.test.ts` (extend if needed)
   - Tests first: B9 — ManualPrompt with authored `description` still yields Unsupported (no invented skill/description write)
   - Then implement: only if the test fails (expect no production change)

6. **Docs / patterns**
   - Files: `packages/docs/docs/models/index.md`, light touch plugin READMEs if they hardcode synthesize-only wording; `memory-bank/systemPatterns.md` only if a stated fact is invalidated
   - Changes: document optional authored `description` on ManualPrompt; synthesize-when-absent remains for command-origin
   - (Documentation-only; no behavior tests required beyond prior steps)

7. **Full suite**
   - Run package tests then full `pnpm test` with cache disabled per project practice before declaring build done

## Technology Validation

No new technology - validation not required

## Dependencies

- Builds on #143 / #149 (`AgentSkillSpecFields` already on ManualPrompt)
- Relies on existing ManualPrompt → skill emit (#99); no command emit restoration

## Challenges & Mitigations

- **Fabricated-vs-authored ambiguity remains:** Option 1 accepts this; mitigate by never overwriting when `description` is present, and by not inventing heuristics that treat `Invoke with /…` as synthetic.
- **IR version bump churn:** Old writers omit the field; new readers treat absence as undefined (ok). New writers may emit description; older a16n cannot read v1beta4 — same compatibility story as #143. Document in `version.ts`.
- **Empty-string frontmatter:** Align with existing truthy-drop patterns so empty does not block synthesize.
- **Acceptance "cannot carry" vs #99:** Live skill targets *can* carry the field; do not restore command emit solely to satisfy the issue's historical example. Satisfy via agentsmd Unsupported + never substituting over authored text.

## Pre-Mortem

- **Plan treated "cannot carry" as requiring a new emit surface and overbuilt command emit:** Cut scope — skill preserve + agentsmd Unsupported is enough; already noted under Challenges.
- **Plan skipped IR version bump and `.a16n` round-trips lost description under mixed tooling:** Step 1 includes v1beta4; B7 covers round-trip.
- **Plan accidentally pursued option 2 mid-build after seeing field awkwardness:** Direction locked above; classification stays ManualPrompt.
- **Existing emit tests pinning `Invoke with /review` were "fixed" by weakening assertions instead of adding preserve cases:** Add authored-description cases alongside synthesize cases; keep synthesize tests.

## Preflight Amendments

- Strengthened Implementation Plan so every code step orders failing tests before production changes (TDD encoding gate).
- Confirmed `packages/models/test/types.test.ts` already hosts ManualPrompt shape tests — extend there for optional `description`.
- Confirmed `plugin-agentsmd/test/emit-unsupported.test.ts` already covers ManualPrompt Unsupported — extend with authored-description case for B9.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [ ] Build
- [ ] QA
