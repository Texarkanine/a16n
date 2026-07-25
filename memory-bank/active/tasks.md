# Task: Realign conversion gates with the AgentSkills.io spec

* Task ID: issue-142-spec-compliance-gates
* Complexity: Level 3
* Type: bugfix + feature (gate removal on one plugin, spec-compliance detection on another)

Delete the obsolete four-pattern complexity gate from `plugin-cursor` command discovery ([issue #142](https://github.com/Texarkanine/a16n/issues/142)), and add AgentSkills.io spec-compliance detection to `plugin-claude` skill discovery covering all non-spec Claude features, reported as one advisory warning per skill.

## Pinned Info

### Where the gate belongs

Pinned because the whole task turns on this inversion: a16n gated the nearly-spec-compliant harness and left the genuine superset ungated. Every implementation decision follows from reading this correctly.

```mermaid
flowchart LR
    subgraph Cursor["Cursor (near-spec)"]
        C1["paths"]
        C2["disable-model-invocation"]
    end

    subgraph Spec["AgentSkills.io spec<br/>name · description · license<br/>compatibility · metadata · allowed-tools"]
    end

    subgraph Claude["Claude (large superset)"]
        K1["$ARGUMENTS · $N · $name"]
        K2["!`cmd` injection"]
        K3["@path includes"]
        K4["${CLAUDE_*}"]
        K5["argument-hint · arguments"]
        K6["model · effort · context · agent"]
        K7["shell · disallowed-tools · user-invocable"]
        K8["hooks"]
    end

    Cursor -->|"discover"| IR(["a16n IR<br/>(spec-shaped)"])
    Claude -->|"discover"| IR

    IR -.->|"REMOVE:<br/>4-pattern gate<br/>(wrong side)"| Cursor
    IR -.->|"ADD:<br/>spec-compliance<br/>detection"| Claude

    style Cursor fill:#2d4a3e,color:#fff
    style Claude fill:#5a2d2d,color:#fff
    style Spec fill:#2d3a5a,color:#fff
```

### Fidelity taxonomy

Pinned because it defines exactly which features are reportable.

| Category | Spec? | Modeled by a16n IR? | Survives conversion? | In scope |
|---|---|---|---|---|
| A | No | No | **No** — silently lost | **Yes** — this task |
| B | Yes | No | **No** — silently lost | No — separate issue |
| C | No | Yes | Yes | No — nothing lost |
| D | Yes | Yes | Yes | No — nothing lost |

Category A is what this task detects. Category B (`allowed-tools`, `license`, `compatibility`) is a newly discovered, separate defect. Category C is `paths` (Claude rules) and `disable-model-invocation`.

### Disposition rule (from OQ2)

Pinned because it classifies every present and future Claude feature without re-litigating OQ2.

> **Loss that silently removes an author-specified restriction → fail closed (`Skipped`).
> Loss that visibly breaks a substitution → fail open (`Approximated`).**

`hooks:` is the sole fail-closed case. Everything else in Category A is fail-open.

## Component Analysis

### Affected Components

- **`packages/plugin-cursor/src/discover.ts`**: gates `.cursor/commands/**/*.md` behind `COMPLEX_COMMAND_PATTERNS` + `isComplexCommand()` → delete both; every command becomes a ManualPrompt with no warnings.
- **`packages/plugin-claude/src/spec-compliance.ts`** *(new)*: pure `detectNonSpecFeatures(frontmatter, body): string[]`.
- **`packages/plugin-claude/src/discover.ts`**: retain raw frontmatter keys in `parseSkillFrontmatter()`; call detection in `discoverSkills()`; emit one `Approximated` warning per skill. `hooks:` skip unchanged.
- **`packages/plugin-cursor/test/discover-commands.test.ts`**: `describe('complex commands (skipped)')` asserts deleted behavior → invert; add #142 regressions.
- **`packages/plugin-cursor/test/fixtures/cursor-command-complex/`, `cursor-command-mixed/`**: repurpose as "these all convert"; add `cursor-command-mentions/` for #142.
- **`packages/cli/test/integration/integration-commands.test.ts`**: `cursor-command-complex-skipped` (lines 64–94) → invert.
- **`packages/plugin-claude/test/spec-compliance.test.ts`** *(new)*, **`discover-spec-compliance.test.ts`** *(new)*, **`fixtures/claude-skills-nonspec/`** *(new)*.
- **`packages/plugin-cursor/README.md`** lines 48–56, **`packages/plugin-claude/README.md`** line 44.
- **`memory-bank/systemPatterns.md`**: Claude classification order — unchanged per OQ2, but the warn-and-continue section gains the disposition rule.

### Cross-Module Dependencies

- `plugin-cursor.discover` → `@a16njs/models`: drops `WarningCode.Skipped` for commands.
- `plugin-claude.discover` → new local `spec-compliance.ts` (pure, no I/O) → gains `WarningCode.Approximated`.
- `plugin-claude.discover` → `gray-matter`: reuses the existing `matter()` parse; no new dependency.
- `engine.convert` aggregates warnings from both; no engine change, but its integration tests shift.

### Boundary Changes

- **No `A16nPlugin` interface change.** `discover()` stays target-unaware.
- **Observable warning-surface change** (the real blast radius): commands that produced `Skipped` now produce nothing; Claude skills that produced nothing now produce `Approximated`.
- **No IR schema change.** Category-A features stay inline in `content`.

### Invariants & Constraints

1. Detection must not recreate the #142 false-positive class.
2. Every reportable feature must be Category A.
3. Warning text references the AgentSkills.io spec, never a destination harness.
4. `discover()` remains target-unaware.
5. Content is never mutated — observe only.
6. Cursor commands remain discover-only legacy support, emitting as skills.
7. TDD: tests written and failing first.

## Open Questions

- [x] **OQ1 — Body-level detection strategy** → Resolved: frontmatter-gated hybrid; shape-tightened regexes with `$N` gated on an independent argument signal. Fence-stripping rejected as semantically wrong (Claude substitutes inside fences). See `creative-body-feature-detection.md`.
- [x] **OQ2 — `hooks:` disposition** → Resolved: keep hard `Skipped`, justified by the new fail-closed/fail-open rule. Zero churn to existing hooks tests/docs. See `creative-hooks-disposition.md`.
- [x] **OQ3 — Warning axis** → Resolved in-plan: axis is non-spec (Category A). Category B filed separately.

## Test Plan (TDD)

### Test Infrastructure

- Framework: Vitest, run via `pnpm test` (Turbo → per-package `vitest.config.ts`).
- Test location: `packages/<pkg>/test/`, flat layout, one root `describe` per file.
- Conventions: `discover-<domain>.test.ts`; fixtures at `test/fixtures/<name>/from-<tool>/`; `discoverFixturesDir(import.meta.url)` helper.
- New test files: `packages/plugin-claude/test/spec-compliance.test.ts`, `packages/plugin-claude/test/discover-spec-compliance.test.ts`.
- New fixtures: `packages/plugin-cursor/test/fixtures/cursor-command-mentions/`, `packages/plugin-claude/test/fixtures/claude-skills-nonspec/`.

### Behaviors to Verify

**plugin-cursor — gate removal**

- Command containing `@src/utils/helpers.js` → discovered as ManualPrompt, zero warnings
- Command containing `$ARGUMENTS` → discovered, zero warnings
- Command containing `$1` / `$2` → discovered, zero warnings
- Command containing `` !`git branch --show-current` `` → discovered, zero warnings
- Command with `allowed-tools:` frontmatter → discovered, zero warnings
- *(#142)* Command with prose `@author` / `@reviewer` → discovered, zero warnings
- *(#142)* Command with `@coderabbitai` inside a shell string → discovered, zero warnings
- Mixed fixture → **2** commands discovered (was 1), zero warnings
- Command content is byte-identical to source — no `@mention` mutation

**plugin-claude — `detectNonSpecFeatures()` unit**

- Spec-only frontmatter (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) + plain body → `[]`
- `$ARGUMENTS` → detected; `$ARGUMENTS[0]` → detected
- `$1` with **no** argument signal → **not** detected *(the `awk '{print $1}'` case)*
- `$1` **with** `argument-hint:` → detected
- `$1` **with** `$ARGUMENTS` also present → detected
- `` !`gh pr diff` `` at line start → detected; after whitespace → detected
- `` KEY=!`cmd` `` → **not** detected
- `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PROJECT_DIR}` → detected
- `@src/utils.js`, `@./docs/foo.md`, `@../x/y.ts` → detected
- `@reviewer`, `@author`, `@coderabbitai` → **not** detected
- `foo@bar.com` → **not** detected
- `@modelcontextprotocol/sdk` → **not** detected *(accepted false negative)*
- Each of `argument-hint`, `arguments`, `model`, `effort`, `context`, `agent`, `shell`, `disallowed-tools`, `user-invocable` → detected
- `paths`, `disable-model-invocation` (Category C) → **not** detected
- Multiple features → all returned, deduplicated, stable order

**plugin-claude — discovery integration**

- Skill using non-spec features → item still discovered **and** exactly one `Approximated` warning naming them
- Spec-clean skill → zero warnings
- Hooks skill → exactly one `Skipped`, zero `Approximated` *(OQ2)*
- Warning message contains "AgentSkills.io" and names no destination harness

**CLI integration**

- cursor→claude with a `$ARGUMENTS` command → ManualPrompt discovered, no skip warning (inverted from current test)

### Integration Tests

- `packages/cli/test/integration/integration-commands.test.ts` — engine-level cursor→claude conversion, asserting the inverted command behavior.
- `packages/plugin-claude/test/discover-spec-compliance.test.ts` — fixture-driven, exercising `discover()` end to end rather than the pure function.

## Implementation Plan

1. **Add #142 regression fixture** (test-only, proves the bug)
    - Files: `packages/plugin-cursor/test/fixtures/cursor-command-mentions/from-cursor/.cursor/commands/{pr-feedback-judge.md,coderabbit-pr.md}`
    - Changes: reduced excerpts from the issue — `by @author`, `| @reviewer |` table cells, and `gh pr comment <n> --body "@coderabbitai review"`.
2. **Write failing cursor tests**
    - Files: `packages/plugin-cursor/test/discover-commands.test.ts`
    - Changes: replace `describe('complex commands (skipped)')` with `describe('commands with runtime features (discovered)')`; add `describe('@mention false positives (#142)')`; update mixed-fixture count 1 → 2; add content-fidelity assertion.
3. **Delete the gate**
    - Files: `packages/plugin-cursor/src/discover.ts`
    - Changes: remove `COMPLEX_COMMAND_PATTERNS` (lines ~144–156) and `isComplexCommand()` (~158–179); drop the `isComplex` branch in `discoverCommands()` (~233–245). Verify `WarningCode` import is still needed elsewhere in the file.
4. **Invert the CLI integration test**
    - Files: `packages/cli/test/integration/integration-commands.test.ts`
    - Changes: rewrite `cursor-command-complex-skipped` → `cursor-command-with-runtime-features-converts`; assert 1 ManualPrompt and no skip warning.
5. **Write failing unit tests for detection**
    - Files: `packages/plugin-claude/test/spec-compliance.test.ts` *(new)*
    - Changes: full behavior table above against `detectNonSpecFeatures()`.
    - Creative ref: `creative-body-feature-detection.md`
6. **Implement the detection module**
    - Files: `packages/plugin-claude/src/spec-compliance.ts` *(new)*
    - Changes: `SPEC_FRONTMATTER_KEYS` / `MODELED_FRONTMATTER_KEYS` sets; per-feature body patterns; `$N` gating; export `detectNonSpecFeatures(frontmatter: Record<string, unknown>, body: string): string[]`.
    - Creative ref: `creative-body-feature-detection.md`
7. **Write failing discovery-integration tests + fixture**
    - Files: `packages/plugin-claude/test/discover-spec-compliance.test.ts` *(new)*, `packages/plugin-claude/test/fixtures/claude-skills-nonspec/from-claude/.claude/skills/{deploy,clean}/SKILL.md` *(new)*
    - Changes: one skill using several non-spec features, one fully spec-clean.
8. **Wire detection into discovery**
    - Files: `packages/plugin-claude/src/discover.ts`
    - Changes: extend `SkillFrontmatter` with the raw key list; call `detectNonSpecFeatures()` after the `hooks:` skip; push a single `Approximated` warning when non-empty. Add the disposition-rule comment above the hooks skip.
    - Creative ref: `creative-hooks-disposition.md`
9. **Documentation**
    - Files: `packages/plugin-cursor/README.md`, `packages/plugin-claude/README.md`, `memory-bank/systemPatterns.md`
    - Changes: delete the cursor "Complex commands" table and explain that all commands convert; document the Claude spec-compliance advisory and its feature list; add the disposition rule to the warn-and-continue section of `systemPatterns.md`.
10. **File the Category-B follow-up issue**
    - Changes: `gh issue create` describing spec-compliant fields (`allowed-tools`, `license`, `compatibility`) that a16n's IR silently drops.
11. **Full verification**
    - Changes: `pnpm build && pnpm test && pnpm lint && pnpm typecheck`.

## Technology Validation

No new technology — validation not required. Detection uses native `RegExp` and the `gray-matter` parse already performed by `plugin-claude`. No new dependency, build-tool, or config change.

## Challenges & Mitigations

- **`$N` gating misfires on skills that legitimately use bare `$1` without declaring arguments**: accepted, documented false negative. The advisory cost model (OQ1) makes a miss cheaper than noise, and `$ARGUMENTS`-in-body is a second gate that catches most real cases.
- **`@path` shape rule mis-sorts extensionless refs**: `@src/utils` is not detected because it is lexically identical to a scoped npm package. Documented in the creative doc; pinned by a test so it is a known behavior rather than a latent surprise.
- **Deleting the gate changes warning counts in tests that assert aggregate totals**: grep for warning-count assertions across `packages/cli/test/` before declaring done, not only the three files already identified.
- **`parseSkillFrontmatter()` currently drops unknown keys**, so frontmatter detection sees nothing until it retains them: sequenced as an explicit sub-step of step 8, with a unit test that a `model:` key is detected end to end.
- **Repurposed fixtures keep misleading names** (`cursor-command-complex` no longer describes anything complex): rename to `cursor-command-runtime-features`, updating both referencing test files.

## Pre-Mortem

- **The premise is wrong — Cursor commands *do* expand `@path`, undocumented.** This is the highest-consequence failure: removing the gate would then genuinely break conversions. Mitigation already in the plan: content is never mutated (invariant 5), so even under this scenario the worst outcome is a missing advisory, not corrupted output. The gate's current behavior (hard skip) would still be wrong. Plan unchanged, risk accepted and bounded.
- **We fix the reported bug and ship a new one in the detector.** The detector is the same *kind* of code that caused #142. Response: the false-positive cases are first-class test behaviors, not afterthoughts — `@reviewer`, `foo@bar.com`, `awk '{print $1}'`, and `` KEY=!`cmd` `` each get a dedicated negative assertion before any detector code is written.
- **Scope creep into Category B.** The `allowed-tools`/`license`/`compatibility` drop is a real, tempting, adjacent defect. Response: OQ3 resolved it out of scope and step 10 makes filing it an explicit deliverable, so it is discharged rather than absorbed.
- **The new warnings are so noisy on real Claude repos that users ignore all warnings.** Response: one warning per skill (operator decision), silence as the default for spec-clean skills, and Category C excluded. If real-world output still proves noisy, the gating thresholds in `spec-compliance.ts` are the single tuning point.
- **Turbo caching masks stale test results across the two packages.** Response: step 11 runs the full pipeline; if results look inconsistent, re-run with cache disabled before trusting them.

## Status

- [x] Component analysis complete
- [x] Open questions resolved
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
