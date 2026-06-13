# Project Brief

**Parent L4 task:** v1-release-rollout (see `memory-bank/active/milestones.md`) — this brief scopes **Milestone 3** (Wave A: leaf-layer `1.0.0` promotion).

## User Story

As the maintainer of `a16n`, I want to promote the leaf-layer packages `@a16njs/models` and the standalone `@a16njs/glob-hook` from `0.x` to `1.0.0`, so that the dependency-ordered `1.0.0` rollout can begin with packages that have no internal dependents to coordinate.

## Use-Case(s)

### Use-Case 1: models reaches 1.0.0

`@a16njs/models` publishes as `1.0.0` on the next release. Existing published dependents (plugins/engine/CLI) are unaffected — they pin the exact prior `models` version (e.g. `0.14.1`), which remains on the registry; they will re-pin to `1.0.0` in their own later waves (M4/M5).

### Use-Case 2: glob-hook reaches 1.0.0

`@a16njs/glob-hook` (standalone; not part of the conversion pipeline) publishes as `1.0.0`.

## Requirements

1. Set `release-as: "1.0.0"` for `packages/models` and `packages/glob-hook` in `release-please-config.json`.
2. Land a real, conventional path-touching commit under **each** of `packages/models/` and `packages/glob-hook/` so Release-Please actually cuts a release for each. (`release-as` overrides the *version* only if a release is cut; it does **not** force inclusion — the lesson that thrashed M1.)
3. Preserve all L4 cross-milestone invariants: source inter-package deps stay `workspace:*`, no behavioral code changes, `a16n@latest` stays installable, `docs` never published.

## Constraints

1. **Wave A only.** Do not bump or re-pin dependents (`engine`, the `plugin-*` packages, the `a16n` CLI) — those are M4/M5. Their source stays `workspace:*`; they pick up `models@1.0.0` at their own next release.
2. The CLI's temporary `release-as: "0.15.4"` and agentsmd's `release-as: "1.0.3"` keys from M1 should be removed if still present (they are spent; leaving them risks re-triggering or pinning stale versions). Verify against the manifest before editing.
3. Immutable npm versions — forward-only; this is a version-policy promotion, not a behavioral break.

## Acceptance Criteria

1. `release-please-config.json` declares `release-as: "1.0.0"` for both `packages/models` and `packages/glob-hook`.
2. A path-touching commit exists under each of `packages/models/` and `packages/glob-hook/`.
3. The generated Release-Please PR bumps **both** `@a16njs/models → 1.0.0` and `@a16njs/glob-hook → 1.0.0` (operator merge-gate, per the M1 lesson).
4. After operator merge + publish: `npm view @a16njs/models@1.0.0 version` and `npm view @a16njs/glob-hook@1.0.0 version` both resolve.
5. Full test suite green; no runtime/behavioral changes.
