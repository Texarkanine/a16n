# TASK ARCHIVE: Phase 9 — IR Serialization Plugin

## METADATA

- **Task ID:** PHASE-9-IR-SERIALIZATION
- **Date Started:** 2026-02-03
- **Date Completed:** 2026-02-07
- **Complexity Level:** 4 (Multi-package architectural change)
- **Duration:** ~5 days (M1–M7)
- **PRs:** #32, #35, #36, #37, #38, p9-m7 branch
- **Branch:** p9-m7 (final)
- **Milestones:** 7

---

## SUMMARY

Designed and implemented `@a16njs/plugin-a16n`, a complete bidirectional serialization plugin for the a16n intermediate representation (IR) format. The `.a16n/` directory uses Kubernetes-style versioned YAML frontmatter markdown files, enabling lossless round-trip conversion between Cursor, Claude Code, and the a16n IR format. The plugin serves as a hub format for cross-tool agent configuration portability.

**Key Deliverables:**
- IR versioning system (`v1beta1`, forward-compatible)
- Shared AgentSkills.io parsing utilities in `@a16njs/models`
- YAML frontmatter parser and formatter
- IR emission (`emit()`) with CLI `--to a16n` support
- IR discovery (`discover()`) with CLI `--from a16n` support
- Full round-trip E2E tests (cursor→a16n→cursor, claude→a16n→claude)
- Documentation site integration (overview, API, CHANGELOGs)
- CI hardening (docs build gate, MDX CommonMark fix)

---

## MILESTONES

| # | Milestone | PR | Est. | Actual | Key Deliverable |
|---|-----------|------|------|--------|-----------------|
| M1 | IR Model Versioning | #32 | 5h | 3h | `v1beta1` versioning, `CustomizationType` enum, `AgentCustomization` breaking changes |
| M2 | Plugin Package Setup | #35 | 1h | 15m | `@a16njs/plugin-a16n` scaffold, build pipeline, README |
| M3 | Frontmatter Parse/Format | #36 | 4h | 2.5h | `parseIRFile()`, `formatIRFile()`, 53 unit tests |
| M4 | IR Emission + CLI | #37 | 5h | 4h | `emit()`, path traversal security, CLI integration |
| M5 | IR Discovery | #38 | 4h | 2.5h | `discover()`, 23 unit tests, 7 fixture directories |
| M6 | E2E Testing | #38 | 1h | 0.5h | 7 integration tests, round-trip verification |
| M7 | Docs + Hardening | p9-m7 | 3h | 4h* | Docsite, CHANGELOG, CI gate, MDX fix, deprecated type removal |

*M7 expanded due to emergent work (MDX fix, deprecated AgentSkill removal, CI hardening).

**Total:** Estimated 23h, Actual ~17h (26% faster overall).

---

## REQUIREMENTS

### Core Requirements
1. Serialize agent customizations to `.a16n/` directory with versioned YAML frontmatter
2. Deserialize `.a16n/` directory back to in-memory `AgentCustomization` objects
3. Support all 6 `CustomizationType` values: GlobalPrompt, FileRule, SimpleAgentSkill, AgentSkillIO, AgentIgnore, ManualPrompt
4. Preserve directory structure across conversions via `relativeDir` field
5. Handle AgentSkillIO in verbatim AgentSkills.io format (not IR frontmatter)
6. Emit version compatibility warnings for incompatible IR versions

### Documentation Requirements
7. Plugin overview page on docsite
8. API reference generation via TypeDoc
9. CHANGELOGs baked into docsite for all packages
10. Google Analytics and site verification integration

### Quality Requirements
11. Forward compatibility: newer readers can read older files
12. Path traversal prevention on all filesystem operations
13. Graceful degradation: skip bad files with warnings, continue processing
14. CI gate: doc compilation verified on every PR

---

## ARCHITECTURAL DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Version format | Kubernetes-style `v1beta1` | Clear major/stability/revision semantics, forward-compatible |
| Directory names | `CustomizationType` enum values (kebab-case) | `.a16n/global-prompt/`, `.a16n/file-rule/`, etc. — self-describing |
| AgentSkillIO format | Verbatim AgentSkills.io (not IR frontmatter) | Preserves fidelity, standard IS the IR for this type |
| Shared parsing | `@a16njs/models/agentskills-io.ts` | 3 plugins need it, co-located with types, no circular deps |
| `relativeDir` field | Optional on `AgentCustomization` | Preserves subdirectory structure without breaking existing plugins |
| `sourcePath` | Made optional | IR-emitted items don't have a source path; file path IS identity |
| `metadata` | Not serialized | Transient runtime-only field; IR captures canonical representation |
| ManualPrompt naming | Derived from `relativeDir` + filename | Eliminates redundant `promptName` field in frontmatter |
| Docusaurus markdown | `format: 'detect'` | `.md` = CommonMark (no JSX), `.mdx` = MDX; prevents TypeDoc `<name>` errors |
| CHANGELOG display | Generated at build time via `stage-changelogs.sh` | Single source of truth, no duplication |
| GA tracking | `GTAG_ID` env var | Secrets out of config, graceful degradation when absent |

Full architectural research: `memory-bank/creative/creative-phase9-architecture.md` (archived below).

---

## IMPLEMENTATION

### M1: IR Model Versioning + Extensions
- Added `version: IRVersion` (required) and `relativeDir?: string` (optional) to `AgentCustomization`
- Made `sourcePath` optional (breaking change)
- Created `version.ts`: `parseIRVersion()`, `areVersionsCompatible()`, `CURRENT_IR_VERSION`
- Created `agentskills-io.ts`: `parseSkillFrontmatter()`, `readSkillFiles()`, `writeAgentSkillIO()`, `readAgentSkillIO()`
- Updated all 3 plugins + CLI for breaking interface changes
- 30 new unit tests

### M2: Plugin Package Setup
- Scaffolded `packages/plugin-a16n/` from existing plugin template
- package.json, tsconfig.json, vitest.config.ts, placeholder index.ts
- Turbo detected automatically, zero config changes needed

### M3: Frontmatter Parse/Format
- `parseIRFile()`: YAML frontmatter → `AgentCustomization` with type-specific field mapping
- `formatIRFile()`: `AgentCustomization` → markdown with YAML frontmatter (clean PLAIN-style output)
- Utility functions: `extractRelativeDir()`, `slugify()`, `getNameWithoutExtension()`
- 53 new tests (27 parse + 26 format) covering all 6 types + edge cases

### M4: IR Emission + CLI
- `emit()`: Groups items by type, creates `.a16n/<type>/` directories, writes frontmatter markdown
- Special AgentSkillIO handling via `writeAgentSkillIO()` (verbatim format)
- Path traversal prevention on `relativeDir`
- CLI integration: `--to a16n` works end-to-end
- Relative paths in output, clean slugified filenames
- 19 tests (16 initial + 3 edge cases from CodeRabbit feedback)

### M5: IR Discovery
- `discover()`: Scans `.a16n/<type>/` directories, parses frontmatter, validates versions
- Helper decomposition: `discoverStandardType()`, `discoverAgentSkillIO()`, `findMdFiles()`
- Warning system: `WarningCode.Skipped` (bad files), `WarningCode.VersionMismatch` (incompatible versions)
- 23 unit tests, 7 fixture directories

### M6: E2E Integration
- 7 integration tests in CLI test suite
- Round-trip tests: cursor→a16n→cursor, claude→a16n→claude
- Direct conversion tests: a16n→cursor, a16n→claude
- All 6 IR types exercised in fixtures

### M7: Docs + Hardening
- Plugin-a16n docsite pages (overview + API reference)
- TypeDoc generation pipeline extended for plugin-a16n
- `stage-changelogs.sh`: 7 CHANGELOG pages baked into docsite
- Google Analytics (gtag + site verification meta tag)
- `markdown.format: 'detect'` — fixes MDX `<name>` compilation errors
- `build:current` CI step — doc compilation gate on every PR
- Removed deprecated `AgentSkill` type alias across all code/tests/docs
- `packages/README.md` — fixes GitHub directory README display

### Cross-Package Bug Fixes (discovered during M4 review)
- **plugin-cursor**: `discoverCommands()` missing `relativeDir` for nested commands (data loss)
- **plugin-cursor + plugin-claude**: `readSkillFiles()` non-recursive, dropping subdirectory files (data loss)
- **plugin-a16n**: `emitAgentSkillIO()` using wrong name source (mangled naming)

---

## TESTING

### Test Coverage Growth

| Milestone | Tests Added | Total Tests |
|-----------|-------------|-------------|
| M1 | 30 | 493 |
| M2 | 0 | 493 |
| M3 | 53 | 546 |
| M4 | 19 (+3 bug fixes) | 536* |
| M5 | 23 | ~560 |
| M6 | 7 | 567 |
| M7 | 3 (cross-format E2E) | 111** |

*Test count varies due to concurrent test removals/refactors across PRs.
**M7 count is per-session (111 across 15 task packages).

### Testing Approach
- **Strict TDD**: Tests written first in every milestone
- **Fixture-driven**: Real file structures as test inputs
- **Round-trip verification**: Data survives cursor→a16n→cursor and claude→a16n→claude
- **Warning coverage**: Version mismatches, invalid frontmatter, unknown directories
- **Security testing**: Path traversal prevention validated
- **Edge cases**: Empty directories, malformed IDs, missing fields

---

## LESSONS LEARNED

### Top 5 Lessons (Across All Milestones)

1. **TDD is faster, not slower.** Every milestone finished ahead of estimate. Writing tests first eliminated rework, caught design issues early, and provided instant validation. Total: 26% faster than estimated across 7 milestones.

2. **"Escape the content" is usually the wrong answer.** When MDX choked on `<name>`, the instinct was to escape it. The right question was "should this parser process this content at all?" — leading to `format: 'detect'`, a one-line fix that eliminates the entire class of problems.

3. **Review comments are investigation triggers.** A CodeRabbit nitpick about `relativeDir` validation led to discovering 3 real bugs (2 causing silent data loss) across 3 packages. Always investigate deeply rather than dismissing.

4. **Immutable releases demand pre-release validation.** The `<name>` in TypeDoc output was already released in v0.7.0 and couldn't be fixed retroactively. This motivated adding `build:current` to CI — catch issues before they become permanent.

5. **Pattern reuse dramatically accelerates scaffolding.** M2 (plugin setup) took 15 minutes vs 1 hour estimated — 75% faster — because existing plugins provided a complete template. Established patterns remove decision-making overhead.

### Process Improvements Shipped

| Improvement | Impact |
|-------------|--------|
| `markdown.format: 'detect'` | Prevents all MDX/JSX false-positive errors in generated docs |
| `build:current` CI step | Catches doc compilation issues before merge |
| `stage-changelogs.sh` | CHANGELOGs on docsite without duplication |
| Path traversal validation | Security hardening on all filesystem operations |
| Warning system | Graceful degradation: skip bad items, continue processing |

### Recurring Themes

- **Breaking changes in foundational packages require coordinated updates** — M1's `AgentCustomization` changes touched 4 packages simultaneously
- **TypeScript strict mode is worth the friction** — caught missing `version` fields, optional property misuse, type narrowing gaps
- **Helper function decomposition pays off** — `discoverStandardType()` vs `discoverAgentSkillIO()` made code self-documenting
- **Fixture organization matters** — 7 focused fixture directories > 1 kitchen-sink fixture

---

## FILES CHANGED (Cumulative)

### New Files Created
- `packages/plugin-a16n/` — entire package (src/, test/, fixtures)
- `packages/models/src/agentskills-io.ts` — shared AgentSkills.io utilities
- `packages/models/src/version.ts` — IR versioning utilities
- `packages/docs/docs/plugin-a16n/index.md` — plugin overview
- `packages/docs/docs/plugin-a16n/api.mdx` — API reference wrapper
- `packages/docs/scripts/stage-changelogs.sh` — CHANGELOG generation
- `packages/README.md` — monorepo packages overview

### Key Files Modified
- `packages/models/src/types.ts` — `AgentCustomization` breaking changes
- `packages/models/src/index.ts` — new exports
- `packages/plugin-cursor/src/discover.ts` — `relativeDir`, `readSkillFiles` recursive
- `packages/plugin-claude/src/discover.ts` — `readSkillFiles` recursive
- `packages/cli/test/integration/integration.test.ts` — E2E tests
- `packages/docs/docusaurus.config.js` — `format: 'detect'`, gtag, headTags
- `.github/workflows/ci.yaml` — `build:current` doc gate

---

## REFERENCES

### PRs
- #32 — M1: IR Model Versioning
- #35 — M2: Plugin Package Setup
- #36 — M3: Frontmatter Parse/Format
- #37 — M4: IR Emission + CLI Integration
- #38 — M5+M6: IR Discovery + E2E Integration
- p9-m7 branch — M7: Docs + Hardening

### Specification
- `planning/PHASE_9_SPEC.md` — Full phase specification

### Reflections (archived)
- `reflection-phase9-m1.md` — Versioning, breaking changes, TDD
- `reflection-phase9-m2.md` — Pattern reuse, scaffolding speed
- `reflection-phase9-m3.md` — Frontmatter, YAML formatting, discriminated unions
- `reflection-phase9-m4.md` — Emission, security, CodeRabbit iteration, cross-package bugs
- `reflection-phase9-m5-m6.md` — Discovery, fixtures, warning system, round-trip
- `reflection-phase9-m7.md` — Docs, MDX CommonMark, CI gate, deprecated removal

### Creative Phase (archived)
- `creative-phase9-architecture.md` — Architectural research and decisions (Q1–Q3, D1–D6, 10 amendments)
