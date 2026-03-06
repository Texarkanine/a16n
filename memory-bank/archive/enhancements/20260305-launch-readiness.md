---
task_id: launch-readiness
complexity_level: 3
date: 2026-03-05
status: completed
---

# TASK ARCHIVE: Launch Readiness Polish

## SUMMARY

Launch-readiness polish delivered all nine requirements for public announcement: a security fix (path traversal in plugin-claude AgentSkillIO emission), documentation (CONTRIBUTING.md, fixed broken docs links), CLI UX (dynamic error suggestions and help text for `--from`/`--to`), package metadata (engines >=22.0.0 across all packages, CI aligned to `.nvmrc`), type safety (replaced `any` in convert.ts), stubbed tests fully implemented, and README updates (pitch breadth, Codecov badge, Supported Tools table). One pre-existing bug was found and fixed during test implementation (match mode bypassed conflict detection due to an early return). QA passed with one trivial fix. Reflection was updated after PR feedback with additional technical and process insights; several PR-driven fixes were applied (segment-based `..` detection, SKILL.md overwrite guard, path.resolve consistency, test renames and boundary assertions).

## REQUIREMENTS

- **Security:** Path traversal validation in plugin-claude `emitAgentSkillIO` — reject absolute paths, `..` segments, and paths resolving outside the skill directory; emit `WarningCode.Skipped` for unsafe resource filenames.
- **Documentation:** Create CONTRIBUTING.md at repo root; fix broken docs links (`/plugin-cursorrules`, CLI reference label in intro).
- **CLI UX:** Improve invalid `--from`/`--to` error messages with dynamic "Available agents: …" suggestion; show available agents in option descriptions.
- **Package metadata:** Align `engines.node` to `>=22.0.0` across all packages; make docs CI use `node-version-file: '.nvmrc'`.
- **Stubbed tests:** Implement or delete all 11 empty test bodies in `cli.test.ts` (sourceItems conflict detection + `--if-gitignore-conflict` flag).
- **Type safety:** Replace `any` in `routeConflict`/`routeConflictSimple` with proper types (`SourceStatusEntry`, `AgentCustomization`).
- **README:** Widen pitch to plugin extensibility; add Codecov badge; add "Your tool here" row to Supported Tools table.

Constraints: TDD for code changes; no new dependencies; existing tests must pass.

## IMPLEMENTATION

**Approach:** Eight ordered steps. Security fix (Step 1) followed TDD: tests for absolute path, `..` in path, resolve-outside-dir, and valid nested paths in `packages/plugin-claude/test/emit.test.ts`, then implementation in `emitAgentSkillIO` with a `warnings` parameter and three-layer validation. Steps 2–3 were type and error-message changes; Step 4 implemented all 11 stubbed CLI tests (git init/config/add/commit choreography, conflict scenarios). Step 4 revealed a pre-existing bug: `handleGitIgnore` returned early when `newFiles.length === 0`, so match mode never ran for existing tracked outputs; fix was to run match mode before that early return. Steps 5–8 were engines, CONTRIBUTING.md, docs link fixes, and README updates.

**Key files:** `packages/plugin-claude/src/emit.ts` (path traversal, later segment-based `..` check, empty/dot rejection, SKILL.md overwrite guard, `path.resolve` for skillDir/skillPath), `packages/plugin-claude/test/emit.test.ts` (path traversal and overwrite tests), `packages/cli/src/commands/convert.ts` (SourceStatusEntry types, error suggestion, match-mode ordering), `packages/cli/src/commands/discover.ts` (error suggestion), `packages/cli/src/index.ts` (dynamic plugin IDs in option descriptions), `packages/cli/test/cli.test.ts` (conflict and flag tests, `git check-ignore` assertion, test rename), root and package `package.json` (engines), `.github/workflows/docs.yaml`, `CONTRIBUTING.md`, `README.md`, docs links.

**Post–PR feedback fixes (inlined into codebase and reflection):** (1) Replaced `filename.includes('..')` with segment-equality check (`split(/[/\\]/).some(seg => seg === '..')`) to allow basenames like `notes..md`. (2) Rejected resource paths that resolve to the skill dir itself (removed `resolvedPath !== baseDir` exception) to avoid EISDIR. (3) Guard to skip any resource whose basename is `skill.md` (case-insensitive) in the skill root, so the canonical SKILL.md is not overwritten. (4) `skillDir` and `skillPath` switched from `path.join` to `path.resolve` for consistent absolute paths in the written array. (5) Case 3 test renamed and documented to reflect what it actually tests (per-output git status mirroring), with a NOTE that multi-source conflict is covered in unit tests. (6) Commit conflict test: added `git check-ignore` assertion. (7) Emit tests: added filesystem absence assertions (e.g. `sibling/payload.sh` must not exist, readdir/cleanup in dot-slash test).

## TESTING

- **Unit/plugin:** `pnpm --filter @a16njs/plugin-claude test` — path traversal, overwrite guard, valid basenames including `notes..md`/`v1..2.bak`, empty/dot/dot-slash rejection, filesystem absence checks.
- **CLI:** `pnpm --filter a16n test` — all 164 tests including conflict detection, `--if-gitignore-conflict` values, error message suggestions, `git check-ignore` in commit test. Timeout increased to 15s for git-heavy tests.
- **Full suite:** `pnpm test` across all packages; `pnpm build` and typecheck.
- **QA:** Semantic review (KISS, DRY, YAGNI, Completeness, Regression, Integrity, Documentation); one trivial fix (CONTRIBUTING pnpm filter syntax).

## LESSONS LEARNED

- **Multi-mode dispatch:** Functions like `handleGitIgnore` with multiple modes are fragile when one mode has different preconditions; early returns that assume all callers share preconditions can silently break one mode (match needed both new and existing files).
- **Compound path guards:** Two independent bugs in one block (substring `..` false positive; `resolvedPath !== baseDir` allowing directory targets). Test each guard condition separately.
- **Traversal vs. overwrite:** Path guards prevent escape; they do not prevent a resource named `SKILL.md` from overwriting the canonical file written earlier in the same call. Emit logic must protect its own prior outputs.
- **path.join vs path.resolve:** For paths returned to callers, use `path.resolve` so formats are consistently absolute; `path.join` with a relative root yields mixed arrays.
- **Security review:** Evaluate execution context (e.g. who creates the directory) before implementing; the symlink concern was valid in class but inapplicable because the emitter creates the skill dir.
- **Stubbed tests:** Treat as high-priority debt; they hide bugs behind false green. Implementing them immediately revealed the handleGitIgnore bug.
- **Test assertions:** For security-relevant behavior, assert outcome at the system boundary (file absent, git not ignoring) not only the implementation artifact (warning emitted).
- **Test names:** Inaccurate names (e.g. "Case 3 conflicting sources") mislead maintainers and reviewers; rename when the test covers something narrower.

## PROCESS IMPROVEMENTS

- Preflight amendment (e.g. `warnings` param) prevented build-time rework.
- Plan "Challenges & Mitigations" correctly predicted stubbed tests might reveal bugs; fix the code, not the test.
- PR review repeatedly caught "warning asserted, harmful outcome not asserted"; add boundary checks by default for safety-related tests.

## TECHNICAL IMPROVEMENTS

- Consider applying the same segment-based `..` check and SKILL.md overwrite guard in plugin-cursor emit for consistency.
- Document that `WrittenFile.path` is always absolute when the emitter uses `path.resolve` for all outputs.

## NEXT STEPS

None. Memory bank cleared; next task can start with `/niko`.
