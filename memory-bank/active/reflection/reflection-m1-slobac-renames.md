---
task_id: m1-slobac-renames
date: 2026-05-01
complexity_level: 2
---

# Reflection: M1 — SLOBAC rename remediation

## Summary

Completed milestone M1 rename-only cleanup for SLOBAC findings 1–3, 7–11, 13, and 16–18 across cli, engine, models, and plugin emit tests; full `pnpm test` is green. Added parallel-safe temp directories in `plugin-discovery.test.ts` after races appeared under Vitest concurrency.

## Requirements vs Outcome

All planned M1 scopes were met (no bodies changed, no production code). Finding 12 and monolith milestones were intentionally untouched. The extra plugin-discovery harness change was not in M1 text but was necessary to make the suite deterministic under parallel execution.

## Plan Accuracy

The audit line numbers and file list were accurate drivers. The surprise was **Vitest parallel tests sharing one on-disk scratch directory** in `plugin-discovery.test.ts`, which produced intermittent empty `plugins[]` — orthogonal to SLOBAC wording but blocked verification.

## Build & QA Observations

Mechanical renames were straightforward; bulk `P*:` stripping via a one-line regex substitution was efficient. QA was light because the work is metadata-only plus an isolated test fix with an obvious root cause.

## Insights

### Technical

- Shared `tempDir` constants under `packages/**/test` are a footgun when Vitest runs `it` blocks concurrently — prefer `fs.mkdtemp` per `describe` or per test for filesystem fixtures.

### Process

- A green turbo cache can hide a failing package test until a cache miss occurs; when the suite “flips,” suspect cross-test filesystem races before blaming renames.

### Million-Dollar Question

If plugin discovery tests had been written with per-test OS temp roots from day one, zero additional churn would have been needed during a later metadata-only milestone; the rename work would have stood alone.
