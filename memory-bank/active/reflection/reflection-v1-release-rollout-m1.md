---
task_id: v1-release-rollout-m1
date: 2026-06-13
complexity_level: 2
---

# Reflection: v1-release-rollout-m1

## Summary

Rework after the first M1 release failed delivered the repo changes needed to republish `@a16njs/plugin-agentsmd@1.0.3` and `a16n@0.15.4` together: path-touching guards in each package, corrected release documentation in tests, and forced `release-as` versions. Code and tests are complete and QA-clean; restoring `npx a16n@latest` still depends on operator merge, release-PR verification, and publish.

## Requirements vs Outcome

All code-bearing requirements (R1–R3 source invariants, R5–R8 rework additions) are implemented. Acceptance criteria #1 and #2 remain operator-gated (post-merge publish). AC#4 was reinterpreted during build: per-package `pnpm pack` tests were dropped as near-tautological; the repo-level source-invariant test plus path-touching commits are the pre-merge proof, with tarball inspection deferred to M2. Optional deprecation (R4) was descoped from code and left as an operator checklist item, consistent with the original plan's optional framing.

## Plan Accuracy

The first plan misidentified the failure mode (`npm publish` bypass) and missed Release-Please's path-inclusion rule — `release-as` overrides a version only when a release is cut, it does not force one. Those gaps caused a shipped release that made things worse (`a16n@0.15.3` pinning poisoned `agentsmd@1.0.2`). The rework plan correctly targeted path-touching commits in both packages, burned-version handling (`0.15.4`), and an operator merge-gate. No further plan surprises during rework build or QA.

## Build & QA Observations

The first build phase completed cleanly by conventional metrics (tests green, PR merged) but failed the actual user story — a sharp reminder that semantic correctness beats green CI. Rework build was straightforward once the root cause was corrected: two small test files, a comment rewrite, and a version bump. QA found no blocking issues; the intentional duplication between agentsmd and CLI workspace-protocol tests is load-bearing for Release-Please, not accidental drift.

## Insights

### Technical
- Release-Please only includes a package in a release when a commit touches that package's path; `release-as` is inert without a path touch.
- When the CLI publishes with `pnpm --filter publish`, sibling `workspace:*` deps rewrite to whatever version exists locally — if agentsmd was never released, the CLI re-pins the stale poisoned version.
- Package-scoped tests that must trigger a release belong under that package's path; repo-wide tests in another package cannot substitute.

### Process
- Before merging any multi-package release PR, verify every target package appears in the manifest bumps — treat a missing package as a stop condition, not a minor oversight.
- Root-cause analysis should trace the actual publish pipeline (`release.yaml`) before writing tests; a plausible-but-wrong theory (`npm publish`) produced tests that could not catch the real failure mode.

### Million-Dollar Question

If release correctness had been a foundational assumption, every publishable package would ship with in-package publish-shape guards (public access + workspace protocol), the release pipeline would fail CI if any to-be-published tarball contains `workspace:` or pins an absent sibling (M2), and merge would be blocked unless the release PR bumps every package in the intended set — ideally enforced automatically rather than via operator checklist.
