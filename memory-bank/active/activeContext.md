# Active Context

## Current Task: v1-release-rollout
**Phase:** PREFLIGHT - COMPLETE (PASS with advisory)

## What Was Done
- Investigated the live breakage: `a16n@latest` (0.15.2) fails to install with `EUNSUPPORTEDPROTOCOL Unsupported URL Type "workspace:": workspace:*`.
- Root-caused it: `@a16njs/plugin-agentsmd@1.0.1` and `1.0.2` were published with a literal `"@a16njs/models": "workspace:*"` in their tarballs (confirmed via `npm view`). Every other package has correctly-rewritten exact pins. Cause: agentsmd was published via manual `npm publish` (the operator's recovery after the automated publish failed on a non-public new scoped package), bypassing pnpm's publish-time `workspace:` rewrite. The untracked `packages/plugin-agentsmd/a16njs-plugin-agentsmd-1.0.2.tgz` corroborates a manual pack/publish.
- Classified the overall effort as **Level 4** and captured validated intent in `projectbrief.md`.
- Generated `memory-bank/active/milestones.md`: 5 milestones (M1 restore installability → M2 harden CI → M3–M5 the `1.0.0` waves leaf→middle→CLI) plus 7 cross-milestone invariants.

## Next Step
- Operator reviews the milestone plan, then runs `/niko` to begin the M1 sub-run (restore `a16n@latest` installability).
