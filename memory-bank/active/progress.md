# Progress

Build the included plugin `@a16njs/plugin-agentsmd` (Issue #50): discover `AGENTS.md` files at any directory depth as path-scoped GlobalPrompts (the "escape hatch" into Cursor/Claude path-scoped rules), and emit GlobalPrompts back to directory-structured `AGENTS.md` files (lossy; conveyed via standard a16n warnings only). Register as an included plugin in the CLI and document alongside the other included plugins.

**Complexity:** Level 3

## 2026-06-11 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Intent clarified with operator and confirmed (issue #50 as base scope, softened emission stance)
    - Complexity classified as Level 3 (Intermediate Feature)
    - Memory bank ephemeral files initialized
* Decisions made
    - Level 3, not Level 4: multi-component feature but follows established plugin architecture (prior art: plugin-claude, plugin-cursor)
    - No editorial warnings about AGENTS.md; standard lossy/skip warnings carry the message
    - No `--force` gating on emission
    - Claude escape path targets `.claude/rules/*.md` with `paths` frontmatter (existing plugin-claude capability)
* Insights
    - IR already supports path scoping via `relativeDir` on `AgentCustomization` — no model changes anticipated
    - Operator has preauthorized fully autonomous execution through REFLECT

## 2026-06-11 - PLAN - COMPLETE

* Work completed
    - Component analysis: new plugin package + cli + repo config + docs; engine/models/existing plugins confirmed untouched
    - Creative phase 1 (architecture): IR mapping for nested AGENTS.md resolved (FileRule with dir-shaped globs)
    - Creative phase 2 (generic): emission idempotency resolved (deterministic overwrite, Merged/Overwritten warnings)
    - Full TDD test plan (28 behaviors, 7 new test files) and 9-step implementation plan in tasks.md
* Decisions made
    - Nested AGENTS.md → FileRule(globs ['<dir>/**'], relativeDir '<dir>'); root → GlobalPrompt
    - Emission: GlobalPrompts → root AGENTS.md; nested-CLAUDE-style (metadata.nested+sourcePath) → dirname/AGENTS.md; dir-shaped FileRules → <dir>/AGENTS.md; rest → Skipped/unsupported
    - Deterministic overwrite; first use of WarningCode.Overwritten; plain \n\n concatenation, no provenance markers
    - No pathPatterns on the plugin (orphan detection inapplicable); supports = [GlobalPrompt, FileRule]
* Insights
    - plugin-a16n IR serialization keeps relativeDir+globs but strips sourcePath+metadata — globs are the only durable scoping channel
    - WarningCode.Overwritten exists but was never used by any plugin; this is its first legitimate use
    - Engine skips orphan detection cleanly when pathPatterns is absent (verified in transformation.ts guard)

## 2026-06-11 - PREFLIGHT - COMPLETE (PASS)

* Work completed
    - Validated TDD encoding, conventions, dependency impact, conflicts, completeness against codebase reality
    - Amended plan step 8 with four plugin-listing doc touchpoints (root README, packages/README, cli README, CONTRIBUTING)
    - Wrote .preflight-status (PASS)
* Decisions made
    - Advisory (not done): reclassify plugin-claude nested CLAUDE.md as FileRule in a future task
* Insights
    - generate-cli-docs.ts builds the program with engine=null, so the fallback plugin-id string in cli/src/index.ts flows into generated CLI reference docs

## 2026-06-11 - BUILD - COMPLETE

* Work completed
    - Step 1-2: scaffolded packages/plugin-agentsmd (package.json, tsconfig, vitest config, CHANGELOG stub, documented stubs) + stubbed all 6 unit test files with behavior comments (red phase verified)
    - Step 3: discover() — recursive AGENTS.md walk (skips dot-dirs/node_modules), root → GlobalPrompt, nested → FileRule(['<dir>/**'], relativeDir); 10 discovery tests green
    - Step 4-5: emit() — placement matrix, dir-shaped-glob recognizer + traversal guards, deterministic overwrite, \n\n concatenation, Merged/Overwritten/Skipped warnings, unsupported collection, dryRun; plugin definition; 35/35 unit tests green
    - Step 6: CLI integration — plugin registered in src/index.ts (engine + fallback string), workspace dep, createIntegrationEngine, 4 integration tests (agentsmd→cursor, agentsmd→claude escape hatch; cursor→agentsmd lossy entrance; agentsmd→a16n→agentsmd byte-identical round-trip), e2e plugins-list assertion
    - Step 7: release-please config + manifest entries, codecov flag, CI coverage upload step
    - Step 8: README, docs index/api pages, sidebars, apidoc:current chain, stage-changelogs PACKAGE_MAP, generate-versioned-api PACKAGES + WORKSPACE_PACKAGE_PATHS, understanding-conversions AGENTS.md notes, five plugin-listing touchpoints (root README, packages/README, cli README, CONTRIBUTING, docs intro)
    - Step 9: full validation — pnpm build, typecheck, test --force (17/17 tasks, 951 tests, 0 cached), docs:build:current SUCCESS, ReadLints clean
* Decisions made
    - Stale-dist gotcha: CLI integration tests resolve the plugin via dist/, so plugin must be rebuilt after implementing (caught when integration tests failed against stubs)
    - Excluded-dirs discovery test builds its tree programmatically in a temp dir (node_modules fixtures are git-ignored and would not survive CI checkout)
* Insights
    - generate-versioned-api.ts try/catches checkout of paths missing at old tags, so adding plugin-agentsmd/src to WORKSPACE_PACKAGE_PATHS is safe for historical versions
    - Docs build has one pre-existing broken-anchor warning (plugin-development → /models#customizationtype), unrelated to this task

## 2026-06-11 - QA - COMPLETE (PASS)

* Work completed
    - Semantic review of discover.ts/emit.ts/index.ts + tests against the plan and both creative docs (KISS/DRY/YAGNI/Completeness/Regression/Integrity/Documentation)
    - Verified the implemented dir-shaped glob recognizer matches the planned strict form `^(.+?)/\*\*(/\*)?$` (summary-doc drift had suggested a looser regex; actual code is correct)
    - Fixed 4 trivial findings: systemPatterns.md still said "Three plugins are bundled" (+ added agentsmd asymmetry note); emit-helpers.ts doc comment claimed emit-only scope but a discovery test uses it; `.temp-emit/` missing from .gitignore (latent gap shared with plugin-claude); untested `./`-prefix glob normalization in fileRuleTargetDir → added emit test (36th)
    - Full suite re-run after fixes: 17/17 tasks green (plugin-agentsmd 36/36 and CLI 179/179 fresh; rest cached from the earlier uncached verification run)
    - Wrote .qa-validation-status (PASS)
* Decisions made
    - Kept the defensive `dir === ''` skip branch and double containment check in emit.ts — defense-in-depth consistent with relativeDir guards in the other plugins, not over-engineering
* Insights
    - `.temp-emit/` cleanup relies on afterEach; gitignore entry now protects against crash leftovers being committed for both plugins that use the pattern
