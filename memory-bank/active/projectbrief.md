# Project Brief

**Parent L4 task:** v1-release-rollout (see `memory-bank/active/milestones.md`) — this brief scopes **Milestone 4** (Wave B: middle-layer `1.0.0` promotion + agentsmd pin-refresh).

## User Story

As the maintainer of `a16n`, I want to promote the middle-layer packages `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, `@a16njs/plugin-a16n`, and `@a16njs/engine` from `0.x` to `1.0.0` — and re-release the already-`1.x` `@a16njs/plugin-agentsmd` so it re-pins to `@a16njs/models@1.0.0` — so that every package except the top-level `a16n` CLI is on `1.0.0` and the final CLI wave (M5) has a fully-`1.x` dependency set to pin against.

## Use-Case(s)

### Use-Case 1: plugins + engine reach 1.0.0

`@a16njs/plugin-cursor` (0.14.1), `@a16njs/plugin-claude` (0.14.1), `@a16njs/plugin-a16n` (0.7.3), and `@a16njs/engine` (0.8.1) each publish as `1.0.0` on the next release. Because they depend on `@a16njs/models` via `workspace:*`, pnpm's publish-time rewrite re-pins each to the already-published `@a16njs/models@1.0.0` (M3) in the published tarball; source stays `workspace:*`.

### Use-Case 2: agentsmd re-pins to models@1.0.0

`@a16njs/plugin-agentsmd` is already `1.x` (currently `1.0.3`); it is **not** a `0.x → 1.0.0` promotion. It re-releases (a normal SemVer bump) so its published tarball re-pins `@a16njs/models` to `^1.0.0`, replacing its stale `0.x` models pin.

## Requirements

1. Set `release-as: "1.0.0"` for `packages/plugin-cursor`, `packages/plugin-claude`, `packages/plugin-a16n`, and `packages/engine` in `release-please-config.json`.
2. Ensure `@a16njs/plugin-agentsmd` cuts a release that re-pins to `@a16njs/models@1.0.0` (a normal bump, **not** `release-as: "1.0.0"` — it is already past 1.0.0).
3. Land a real, conventional path-touching commit under **each** package that must cut a release, so Release-Please actually includes it (the `release-as`-doesn't-force-inclusion lesson that thrashed M1).
4. Remove any spent `release-as` keys from prior waves (M1/M3) if still present in the config; verify against the manifest before editing.
5. Preserve all L4 cross-milestone invariants: source inter-package deps stay `workspace:*`, no behavioral code changes, `a16n@latest` stays installable, `docs` never published, agentsmd never regresses below its M1-corrected version.

## Constraints

1. **Wave B only.** Do not bump or re-pin the top-level `a16n` CLI — that is M5. Its source stays `workspace:*`; it picks up the `1.0.0` plugins/engine at its own next release.
2. **Depends on Wave A being live.** All Wave B packages depend only on `@a16njs/models@1.0.0` (published in M3 ✅) and have no release edges among themselves.
3. Immutable npm versions — forward-only; these are version-policy promotions, not behavioral breaks.
4. The published tarball of every Wave B package must contain **no** `workspace:` specifier and must pin `@a16njs/models` to a registry-present `1.0.0`.

## Acceptance Criteria

1. `release-please-config.json` declares `release-as: "1.0.0"` for `plugin-cursor`, `plugin-claude`, `plugin-a16n`, and `engine`; agentsmd is configured to cut a normal release (no `1.0.0` force).
2. A path-touching commit exists under each package that must cut a release.
3. The generated Release-Please PR bumps all four `0.x` packages to `1.0.0` and bumps `plugin-agentsmd` (operator merge-gate, per the M1 lesson).
4. After operator merge + publish: `npm view @a16njs/{plugin-cursor,plugin-claude,plugin-a16n,engine}@1.0.0 version` all resolve, and each published package's `@a16njs/models` dependency resolves to `1.0.0` with no `workspace:` specifier.
5. Full test suite green; no runtime/behavioral changes.
