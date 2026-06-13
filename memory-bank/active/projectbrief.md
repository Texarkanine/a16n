# Project Brief

**Parent L4 task:** v1-release-rollout (see `memory-bank/active/milestones.md`) — this brief scopes **Milestone 5** (Wave C: `a16n` CLI → `1.0.0`).

## User Story

As the maintainer of `a16n`, I want to promote the top-level `a16n` CLI from `0.x` to `1.0.0` so that the entire published stack is on `1.0.0` and `npx a16n@latest` installs a CLI whose published tarball pins only `1.x` dependencies (engine, plugins, models) via pnpm's publish-time rewrite.

## Use-Case(s)

### Use-Case 1: CLI reaches 1.0.0

`a16n` (currently `0.15.4`) publishes as `1.0.0` on the next release. Because its internal deps are `workspace:*` in source, pnpm's publish rewrite re-pins each to the already-published `1.0.0` siblings from M3–M4 in the published tarball; source stays `workspace:*`.

## Requirements

1. Set `release-as: "1.0.0"` for `packages/cli` in `release-please-config.json`.
2. Land a real, conventional path-touching commit under `packages/cli` so Release-Please actually includes it (`release-as` alone does not force inclusion).
3. Remove spent `release-as` keys from prior waves (M4 engine/plugins) once those packages are confirmed published at `1.0.0`.
4. Preserve all L4 cross-milestone invariants: source inter-package deps stay `workspace:*`, no behavioral code changes, `a16n@latest` stays installable, `docs` never published, agentsmd never regresses below its M1-corrected version.

## Constraints

1. **Wave C only.** Do not touch packages outside `packages/cli` except spent-key cleanup in `release-please-config.json`.
2. **Depends on Wave B being live.** CLI depends on the M3–M4 `1.0.0` packages being published before this wave cuts.
3. Immutable npm versions — forward-only; this is a version-policy promotion, not a behavioral break.

## Acceptance Criteria

1. `release-please-config.json` declares `release-as: "1.0.0"` for `packages/cli`; spent M4 `release-as` keys removed from engine/plugins.
2. A path-touching commit exists under `packages/cli`.
3. The generated Release-Please PR bumps `a16n` to `1.0.0` (operator merge-gate).
4. After operator merge + publish: `npm view a16n@1.0.0 version` resolves; published tarball has no `workspace:` specifiers and pins `1.x` siblings.
5. Full test suite green; no runtime/behavioral changes.
