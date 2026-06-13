---
task_id: v1-release-rollout-m4
date: 2026-06-13
complexity_level: 2
---

# Reflection: Wave B — middle-layer 1.0.0 promotion + agentsmd pin-refresh

## Summary

Promoted `@a16njs/engine`, `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, and `@a16njs/plugin-a16n` from `0.x` to `1.0.0` via per-package `release-as`, and set up `@a16njs/plugin-agentsmd` for a patch re-release (no `release-as`) to re-pin its `@a16njs/models` dependency to `1.0.0`. Clean execution; full suite green; no QA findings. Release itself is operator-merge-gated.

## Requirements vs Outcome

Delivered every requirement: `release-as: "1.0.0"` on the four promotions, spent M3 keys removed from `models`/`glob-hook`, agentsmd left without `release-as`, and a path-touching README note on all five packages. No scope drift. The one mid-flight refinement was operator-driven: confirming agentsmd is a *pin-refresh* (patch), not a *promotion* — which the brief already framed correctly, so it validated rather than changed the plan.

## Plan Accuracy

The plan was accurate end to end. The single `fix(release):` commit touching all five package paths matched the proven M3/M1 recipe, and the identified challenges (release-as-doesn't-force-inclusion; agentsmd-must-not-downgrade; spent-key removal; pnpm rewrite depends on workspace `models` version) were exactly the ones that mattered — no surprises came from elsewhere. Preflight's verification that the RP config has no `linked-versions` plugin was the key fact that justified the per-package path-touch.

## Build & QA Observations

Build was mechanical and fast; the full suite (build/test/typecheck) was green on the first run with no iteration. QA found nothing substantive — the change is config + honest docs. The only nuance worth recording: the deliverable commit deliberately used `fix(release):` rather than the workflow's generic `chore: saving work` wording, because a `chore:` commit would not cut a Release-Please release (the M1 trap).

## Insights

### Technical
- The absence of a `linked-versions`/`node-workspace` plugin in `release-please-config.json` is the root reason every release wave must hand-author a path-touching commit per package: RP releases each package independently and `release-as` only sets the version *if* a release is already being cut. This is the single fact that has driven the mechanics of M1, M3, and M4.

### Process
- The operator's "does agentsmd even need a bump?" challenge was a high-value checkpoint: it forced an explicit distinction between *version promotion* (policy) and *dependency re-pin* (immutable-tarball hygiene). Surfacing that two operations were wearing one "Wave B" label early prevented a wrong `release-as: "1.0.0"` that would have downgraded agentsmd and tripped invariant #7.

### Million-Dollar Question
- The genuinely elegant foundational change is the one already flagged as advisory and owned by M6: adopting RP's `node-workspace`/`linked-versions` plugin (or equivalent) so dependent re-pins and releases propagate automatically. Had that been the foundational assumption, Waves A/B/C would collapse into "bump the leaf, let propagation cut the dependents" — eliminating the per-package path-touch ritual that has been the recurring source of friction. It is deliberately out of scope here (it would change the release architecture, not just M4's config), but it is the real answer.
