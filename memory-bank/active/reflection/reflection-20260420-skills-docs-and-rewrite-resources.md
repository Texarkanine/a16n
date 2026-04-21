---
task_id: 20260420-skills-docs-and-rewrite-resources
date: 2026-04-21
complexity_level: 2
---

# Reflection: Fix skills docs + `--rewrite-path-refs` for AgentSkillIO

## Summary

Fixed three related defects surfaced by a single repro: inaccurate plugin-{cursor,claude} docs for complex skills, `--rewrite-path-refs` missing mappings for AgentSkillIO ride-along resource files, and an unrewritten-refs gap inside those ride-along files. Shipped a minimal, IR-preserving engine change (`WrittenFile.sourcePaths?`) plus a bounded spec-aligned rewrite scope (`scripts/`, `references/`). QA surfaced a latent CLI symlink bug that was not originally in scope but was trivial and production-relevant, and got folded in.

## Requirements vs Outcome

Delivered all three original defects plus the two preflight-time additions (Behavior 2b collision-detection lint, and the post-preflight scope expansion to rewrite inside `scripts/**` / `references/**` while leaving `assets/**` and unknown subtrees alone). No requirement was dropped, reinterpreted, or stubbed. One **out-of-scope addition**: during QA the full test suite surfaced a flaky `CLI --help through a symlink` test whose root cause was a latent silent-no-op in `cli/src/index.ts` (affects every `npx a16n` invocation since `.bin/a16n` is a symlink). Fixed in the same session; not what was asked for, but the gating test for the QA pass and unambiguously a correctness bug.

## Plan Accuracy

The plan was accurate where it mattered most — the design-decision table (Option A phantom items / B IR field / **C `WrittenFile.sourcePaths?`**) pre-chose the least-invasive route and it held up. The preflight-added Behavior 2b (collision lint on `buildMapping`) was a speculative-sounding "defensive lint" that earned its keep immediately: it forced the `{ mapping, warnings }` contract change early and now catches the exact class of bug this task itself fixed. The post-preflight scope expansion (scripts/ + references/) cleanly slotted into the existing step structure without re-opening design.

What surprised me was not in the code but in the **memory-bank state itself**: build phase recorded CI1–CI4 as "blocked by a pre-existing Workspace refactor" and propagated that narrative through `activeContext.md`, `progress.md`, and a 9-line `NOTE:` comment inside the CI4 test. QA running on Node 22 proved the "blocker" never existed; it was a Node-20 artifact masquerading as a repo-level failure. The code was correct all along; the **documentation about the code** was wrong.

## Build & QA Observations

Build was smooth: 9 plan steps, 9 independent conventional commits (`6c7337c5..327c4ee2`), no reorderings, no splits. The engine changes stayed surgical — `applyMapping` extraction removed the content/files duplication, `isRewritableSkillResource` stayed private to `path-rewriter.ts` as planned. Cursor and Claude emit changes are byte-symmetric, which was satisfying.

QA was the phase that earned its keep: it caught two documentation-integrity failures (the false-blocker narrative in two memory-bank files and a NOTE comment in the CI4 test) that no lint/build/test step would have flagged, and it surfaced the CLI symlink flake as a byproduct of running the full suite end-to-end rather than only the packages changed by this task. Neither was a code-review finding; both came from **actually running everything on the right runtime**.

## Insights

### Technical

- `WrittenFile.sourcePaths` as an *optional* additive field, with `sourceItems`-fallback preserved, was the right tradeoff. The moment it is set, it *replaces* the `sourceItems` derivation for that file specifically — this prevents the 1:N clobber (every resource's `sourceItems[0].sourcePath` equals the SKILL.md path). The next plugin that does 1:N emission without populating `sourcePaths` will trip the collision lint and be told, in the warning text, exactly what to fix. That's a rare case of a defensive lint that also onboards future authors.
- `realpathSync`-string-compare is a fragile way to detect "am I the main module?" — its documented failure mode (throw → `path.resolve(symlink)` fallback → comparison fails) silently reduces to "exit 0 with empty stdout," the worst possible CLI behavior. Device+inode comparison via `statSync` is the canonical Unix answer and happens to also be symlink-transparent by construction. The long-term fix (split library `index.ts` from executable `run.ts`) is captured in `planning/cli-entry-point-split.md`.
- Private-to-module helpers (`isRewritableSkillResource`) with a "promote on second caller" rule kept the change small. No second caller appeared during the task. The rule works.

### Process

- **Node-version drift causes narrative pollution, not just test flakes.** The build phase's accidental Node 20 run produced a failing test that got written into memory-bank files and test comments as a "pre-existing blocker." Hours of downstream confusion came from that one missing `nvm use 22`. For future builds, validation runs should explicitly print/assert the Node version before running tests, and phases that commit memory-bank narrative should treat any "pre-existing failure" claim with suspicion until re-verified.
- **Run the full test suite in QA, not just the changed-packages subset.** This Level 2 touched `engine`, `plugin-cursor`, `plugin-claude`, `cli` (integration). Running the full matrix in QA caught (a) that CI4 actually passes and (b) an unrelated CLI symlink bug. Neither would have been caught by running only changed-package tests.
- **Mid-phase preflight amendments worked.** Appending Behavior 2b and the scope expansion directly into `tasks.md` + `.preflight-status` (rather than opening a new plan cycle) kept momentum without losing the audit trail. Recommend continuing that pattern for Level 2 when amendments don't touch the design-decision tier.

### Million-Dollar Question

If "rewrite path refs into and out of AgentSkillIO ride-along files" had been a foundational assumption at `WrittenFile` design time, `sourcePaths: readonly string[]` would be the *only* source-attribution field — no `sourceItems`, no `itemCount`, no fallback. Consumers that need the rich IR item (`--delete-source`, git-ignore match mode, etc.) would look it up via a `Map<sourcePath, AgentCustomization>` that the engine already has from discovery. Path rewriting would not be a special case at all: every emitted file declares its source paths; references inside those files' content would be rewritten via the same mapping the engine builds for everything else. The `scripts/` + `references/` allowlist would still exist — it is a spec-driven safety boundary, not a design artifact — but it would most naturally live as plugin-side metadata ("this ride-along is text-by-convention, scan it") rather than a private helper in the engine.

That design is already captured as `planning/writtenfile-clean-break.md` (Flavor B). So the honest answer is: we did the right shape of fix, and the "most elegant" version of it is a pre-1.0 cleanup task away, not a different architecture.
