# Active Context

## Current Task: v1-release-rollout
**Phase:** COMPLEXITY-ANALYSIS - COMPLETE

## What Was Done
- Investigated the live breakage: `a16n@latest` (0.15.2) fails to install with `EUNSUPPORTEDPROTOCOL Unsupported URL Type "workspace:": workspace:*`.
- Root-caused it: `@a16njs/plugin-agentsmd@1.0.1` and `1.0.2` were published with a literal `"@a16njs/models": "workspace:*"` in their tarballs (confirmed via `npm view`). Every other package has correctly-rewritten exact pins. Cause: agentsmd was published via manual `npm publish` (the operator's recovery after the automated publish failed on a non-public new scoped package), bypassing pnpm's publish-time `workspace:` rewrite. The untracked `packages/plugin-agentsmd/a16njs-plugin-agentsmd-1.0.2.tgz` corroborates a manual pack/publish.
- Classified the overall effort as **Level 4** (system-wide release-architecture change across every package + CI, decomposed into ordered waves).
- Operator approved the restated intent (3 phases: fix broken package → harden CI → 1.x waves).

## Next Step
- Load the Level 4 workflow and run the Plan phase to generate `memory-bank/active/milestones.md`.
