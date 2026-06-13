# Progress

Milestone 6 (documentation capstone) of the v1 rollout: write the canonical "add a new publishable package" runbook (`CONTRIBUTING.md` section + a `.cursor/rules/` rule pointing to it) capturing the four M1 traps, the OIDC first-publish bootstrap, the post-publish verification, and the dissolved-M2 lesson (post-publish tarball verification is the real safety net). Plus the operator-requested rollout cruft cleanup: remove the last spent `release-as: "1.0.0"` key from `packages/cli`.

**Complexity:** Level 1

## 2026-06-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Advanced the L4 from M5 to M6: marked M5 `- [x]`, cleared M5 sub-run ephemerals (operator confirmed `a16n@1.0.0` is live on npm).
    - Classified M6 as **Level 1**: documentation + one rule file + one spent config-key removal.
    - Re-scoped `projectbrief.md` to M6, folding in the operator's "cleanup cruft" request.
* Decisions made
    - Only genuine scaffolding cruft is the spent `release-as: "1.0.0"` on `packages/cli` — remove it (leaving it would force all future CLI releases to 1.0.0).
    - Keep the `## Stability` README sections (legitimate semver-contract docs) and the publish-invariant/publish-shape tests (permanent guards).
* Insights
    - M6 documents exactly the mechanic that makes the spent-key removal necessary: `release-as` only sets a version when a release is already cut, so a stale forced version silently pins future releases.
