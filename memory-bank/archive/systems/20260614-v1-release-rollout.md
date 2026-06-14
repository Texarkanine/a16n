---
task_id: v1-release-rollout
complexity_level: 4
date: 2026-06-14
status: completed
---

# TASK ARCHIVE: v1 Release Rollout

## SUMMARY

A multi-milestone L4 program to recover the `a16n` publishing pipeline from a poisoned-artifact incident and then promote the entire `@a16njs/*` workspace from `0.x` to `1.0.0`. The program restored `npx a16n@latest` installability, rolled the dependency graph to `1.0.0` in three forward-only waves (leaf → middle → CLI), and closed with a documentation capstone that encodes the hard-won release mechanics so the failure modes cannot recur silently. Throughout, the source-tree invariant held: inter-package dependencies stayed on the `workspace:*` protocol, with concrete versions produced only by pnpm's publish-time rewrite.

## REQUIREMENTS

Program-level goals (the cross-milestone invariants that had to hold at every milestone boundary):

1. `a16n@latest` is always installable — `npx a16n@latest` resolves and runs.
2. No poisoned artifact — no published tarball contains a `workspace:` specifier, and every internal `@a16njs/*` pin resolves to a version present on the npm registry.
3. Source stays `workspace:*` — inter-package deps remain the `workspace:*` protocol in source; the concrete version is produced only by pnpm's publish-time rewrite.
4. Forward-only dependency order — each release wave depends only on packages already published by earlier milestones.
5. `packages/docs` is never published (`private: true`).
6. No silent code-breaking changes — the `0.x → 1.0.0` promotions are version-policy bumps, not behavioral breaks.
7. `@a16njs/plugin-agentsmd` never regresses below the corrected version shipped in milestone 1.

## MILESTONE LIST

The original (and final) milestone set, with evolution noted:

- **M1 — Restore `a16n@latest` installability.** _(L2, completed)_ Republish `@a16njs/plugin-agentsmd` through the pnpm publish path and re-pin/republish the `a16n` CLI so `npx a16n@latest` resolves again.
- **M2 — Harden release CI so a non-resolvable package can never be published.** _**DISSOLVED 2026-06-13 (spurious).**_ Root-cause review showed the M1 poisoning was operator off-pipeline manual `npm publish` recovery plus a missing per-package OIDC trusted publisher — both human-layer failures. The automated `pnpm publish` path already rewrites `workspace:*` correctly, so the proposed machine-layer guards were near-tautological or fought npm's eventual consistency. All substance folded into M6.
- **M3 — Wave A: promote `@a16njs/models` and `@a16njs/glob-hook` to `1.0.0`.** _(L1, completed)_ Leaf-layer major via per-package `release-as`.
- **M4 — Wave B: promote `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, `@a16njs/plugin-a16n`, and `@a16njs/engine` to `1.0.0`; re-release `@a16njs/plugin-agentsmd` to re-pin to `@a16njs/models@1.0.0`.** _(L2, completed)_ Middle layer; agentsmd is a pin-refresh (patch), not a promotion.
- **M5 — Wave C: promote the `a16n` CLI to `1.0.0`.** _(L1, completed)_ Re-pins to the `1.0.0` engine, plugins, and models from M3–M4.
- **M6 — Document the canonical "add a new publishable package" sequence.** _(L1, completed)_ `CONTRIBUTING.md` runbook + `.cursor/rules/` pointer; absorbed dissolved M2.

**Evolution:** The plan was authored with six milestones and finished with five executed plus one dissolved. M2 was the only structural change — dissolved mid-program once root-cause analysis proved its premise (a machine-layer pipeline defect) was wrong. No milestones were added, reordered, or re-scoped beyond M2's dissolution and the folding of its real content into M6.

## SUB-RUN SUMMARIES

### M1 — Restore installability (L2)

**Built:** Path-touching guards in `@a16njs/plugin-agentsmd` and the `a16n` CLI, corrected release documentation in tests, and forced `release-as` versions, enabling a co-published `@a16njs/plugin-agentsmd@1.0.3` + `a16n@0.15.4`.

**Key decisions:** Per-package `pnpm pack` tests were dropped as near-tautological; the repo-level source-invariant test plus path-touching commits became the pre-merge proof. Optional deprecation of poisoned versions was descoped to an operator checklist item.

**Friction:** The *first* M1 attempt shipped a release that made things worse (`a16n@0.15.3` re-pinned the poisoned `agentsmd@1.0.2`) because the original plan misdiagnosed the failure as an `npm publish` bypass and missed Release-Please's path-inclusion rule. Rework corrected the root cause: `release-as` overrides a version only when a release is actually cut — it does not, by itself, force one. A green CI run had masked a broken user story.

### M3 — Wave A, leaf promotion (L1)

**Built:** Forced `@a16njs/models` and `@a16njs/glob-hook` to `1.0.0` via per-package `release-as` in `release-please-config.json`, with a path-touching commit per package. No internal dependents to coordinate.

### M4 — Wave B, middle layer + agentsmd pin-refresh (L2)

**Built:** Promoted `@a16njs/engine`, `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, and `@a16njs/plugin-a16n` to `1.0.0`; set up `@a16njs/plugin-agentsmd` for a *patch* re-release (no `release-as`) to re-pin `@a16njs/models` to `1.0.0`. Spent M3 keys removed from `models`/`glob-hook`. A single `fix(release):` commit touched all five package paths.

**Key decisions:** Distinguished *version promotion* (policy) from *dependency re-pin* (immutable-tarball hygiene) — an operator challenge ("does agentsmd even need a bump?") prevented a wrong `release-as: "1.0.0"` that would have downgraded agentsmd and tripped invariant #7. Used `fix(release):` rather than `chore:` deliberately, because a `chore:` commit would not cut a Release-Please release.

### M5 — Wave C, CLI promotion (L1)

**Built:** Promoted the `a16n` CLI to `1.0.0`, re-pinning (via pnpm rewrite) to the `1.0.0` engine, plugins (including the M4-refreshed `plugin-agentsmd`), and models. Single-package forced bump once all dependencies were `1.x`.

### M6 — Documentation capstone + cruft cleanup (L1)

**Built:** A "Releases" + "Adding a publishable package" runbook in `CONTRIBUTING.md` capturing the four M1 traps, the OIDC first-publish bootstrap, and the post-publish tarball verification; a `.cursor/rules/shared/publishing-packages.mdc` agent-requested rule routing to the runbook; and removal of the last spent `release-as: "1.0.0"` key from `packages/cli` in `release-please-config.json`.

**Key decisions:** The only genuine scaffolding cruft was the spent CLI `release-as` key (a latent bug that would have pinned all future CLI releases to `1.0.0`). The `## Stability` README sections and the `workspace-publish-invariant`/`publish-shape` tests were kept as legitimate permanent docs/guards. M6 absorbed dissolved M2's real lesson: post-publish tarball verification is the safety net, not in-pipeline guards.

## SYSTEM STATE

- The entire published `@a16njs/*` graph is at `1.0.0` (models, glob-hook, engine, plugin-cursor, plugin-claude, plugin-a16n, plugin-agentsmd) and the `a16n` CLI is at `1.0.0`. `npx a16n@latest` resolves and runs.
- No published tarball carries a `workspace:` specifier; every internal pin resolves to a registry-present version. Source inter-package deps remain `workspace:*`, rewritten only at publish time by pnpm.
- `release-please-config.json` carries no `release-as` keys — future releases derive versions from conventional commits.
- `CONTRIBUTING.md` contains the canonical release/add-a-package runbook; `.cursor/rules/shared/publishing-packages.mdc` routes agents to it.
- Permanent guards remain in place: the `workspace-publish-invariant` and `publish-shape` tests, plus per-package `## Stability` README sections.

## TESTING

- Each sub-run ran the full workspace suite (build / test / typecheck) green before its release PR. M6's final run: build 8/8, test 17/17 (workspace-publish-invariant 10/10), typecheck 14/14.
- M1, M3, M4, M5 were operator-merge-gated on the actual npm publish + post-publish installability check (`npx a16n@latest`, `npm view <pkg>@<ver> dependencies` showing no `workspace:`).
- M6 passed `/niko-qa` semantic review (KISS/DRY/YAGNI/completeness/regression/integrity/docs) with one trivial markdown-style fix; `.qa-validation-status` = PASS.

## LESSONS LEARNED

- **Green CI is not a green user story.** M1's first attempt passed all conventional metrics and still shipped a regression. Verify the actual outcome (does `npx a16n@latest` work?), not just the test/PR signals.
- **Release-Please includes a package in a release only when a commit touches that package's path.** `release-as` is inert without a path-touching commit — this single fact drove the per-package commit mechanics of M1, M3, M4, and M5.
- **pnpm's publish-time `workspace:*` rewrite resolves to whatever sibling version exists locally.** If a sibling was never released, a dependent re-pins the stale (possibly poisoned) version. The non-standard rewrite is exactly why *post-publish* tarball verification — not an in-pipeline guard — is the real safety net.
- **Separate version promotion (policy) from dependency re-pin (tarball hygiene).** Conflating them under one "wave" label nearly downgraded agentsmd.
- **Root-cause before remediation.** M2 was a whole milestone built on a misdiagnosis; dissolving it (rather than executing it) avoided building near-tautological machinery against a failure that never occurred.

## PROCESS IMPROVEMENTS

- Before merging any multi-package release PR, verify every intended package appears in the manifest bumps; treat a missing package as a stop condition.
- Trace the actual publish pipeline (`release.yaml`) before writing release tests — a plausible-but-wrong theory produces tests that cannot catch the real failure.
- Operator challenges at milestone boundaries ("does this package even need a bump?") were repeatedly high-value checkpoints; preserve them as explicit gates.
- Use `fix(release):`/`feat(release):` (not `chore:`) for commits intended to cut a release under the current Release-Please config.

## TECHNICAL IMPROVEMENTS

- **The recurring Million-Dollar answer across M1 and M4:** adopt Release-Please's `node-workspace` / `linked-versions` plugin (or equivalent) so dependent re-pins and releases propagate automatically. Its absence is the root reason every wave had to hand-author a path-touching commit per package; with it, Waves A/B/C would collapse into "bump the leaf, let propagation cut the dependents." Deliberately out of scope here (it changes the release architecture, not just config), but it is the real structural fix.
- Consider in-package publish-shape guards on every publishable package (public access + workspace protocol) plus a CI gate that fails if any to-be-published tarball contains `workspace:` or pins an absent sibling — the automated form of the post-publish verification now documented in M6.

## NEXT STEPS

None. The v1 rollout is complete: the full `@a16njs/*` graph and the `a16n` CLI are at `1.0.0`, the pipeline is documented, and spent scaffolding is removed. The `node-workspace`/`linked-versions` plugin adoption is recorded above as the recommended future architectural improvement.
