---
task_id: m1-slobac-renames
date: 2026-05-01
complexity_level: 2
---

# Reflection: M1 — SLOBAC rename remediation

## Summary

Completed milestone M1 rename-only cleanup for SLOBAC findings 1–3, 7–11, 13, and 16–18 across cli, engine, models, and plugin emit tests; full `pnpm test` is green. Fixed parallel-unsafe temp directories in `plugin-discovery.test.ts` after races appeared under Vitest concurrency, then extended the same `mkdtemp` isolation to four more test files (`workspace.test.ts`, `plugin-loader.test.ts`, `plugin-a16n/discover.test.ts`, `plugin-a16n/emit.test.ts`) in response to PR review feedback.

## Requirements vs Outcome

All planned M1 scopes were met (no bodies changed, no production code). Finding 12 and monolith milestones were intentionally untouched. The `mkdtemp` harness changes were outside M1 scope but necessary to make the suite deterministic — and PR review correctly identified that the fix had been applied inconsistently, leaving four additional files with the same footgun.

## Plan Accuracy

The audit line numbers and file list were accurate drivers. The surprise was **Vitest parallel tests sharing one on-disk scratch directory** in `plugin-discovery.test.ts`, which produced intermittent empty `plugins[]` — orthogonal to SLOBAC wording but blocked verification. The reflection called out the broader pattern as a known gap; the PR review converted that note into an actionable fix before merge.

## Build & QA Observations

Mechanical renames were straightforward; bulk `P*:` stripping via a one-line regex substitution was efficient. QA was light because the work is metadata-only plus isolated test fixes with obvious root causes. Post-PR review added a second small build pass to finish what the first pass started.

## Insights

### Technical

- Shared `tempDir` constants under `packages/**/test` are a footgun when Vitest runs `it` blocks concurrently — prefer `fs.mkdtemp` per `describe` for all filesystem fixtures. The correct scope for the variable is the smallest `describe` block whose lifecycle matches the temp dir's lifetime.
- Writing down a known-but-deferred risk in a reflection doc turns it into a PR review finding rather than a future surprise.

### Process

- A green turbo cache can hide a failing package test until a cache miss occurs; when the suite "flips," suspect cross-test filesystem races before blaming renames.
- Calling out an incomplete fix in the reflection ("this is a footgun we didn't fully fix") is better than leaving it implicit — it surfaced in review within minutes.

### Million-Dollar Question

If all test files had been written with per-`describe` OS temp roots from day one, zero additional churn would have been needed during a metadata-only milestone; the rename work would have stood alone and the PR would have been two commits instead of ten.
