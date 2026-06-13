# Active Context

## Current Task: v1-release-rollout-m3
**Phase:** BUILD - COMPLETE → entering QA

## What Was Done
- Dissolved M2 (spurious; folded into M6) and advanced the L4 to M3.
- Classified M3 (Wave A leaf 1.0.0 promotion) as **Level 1**.
- BUILD: `release-as: "1.0.0"` for `models` + `glob-hook`, path-touching README stability notes in each, removed spent M1 `release-as` keys. Commit `98795db7`. Full suite green (17 packages).

## Next Step
- Level 1 QA (`niko-qa` skill): semantic review of the release-config change. On PASS → wrap-up, then operator merges the Release-Please PR (merge-gate: both packages must bump to 1.0.0).
