# Project Brief

## User Story

As the maintainer of `a16n`, I want to move every published package off major version `0.x` onto real `1.x` semver — without ever shipping a broken package — so that the library and all its components leave "beta" on a stable, trustworthy release footing.

## Use-Case(s)

### Use-Case 1: A user can always install the latest CLI

`npx a16n@latest` (and `npm install -g a16n`) resolves and runs at every point during and after the rollout. The currently-published `latest` is broken and must be repaired first.

### Use-Case 2: The release pipeline cannot silently ship a broken package

A newly-added or republished package can never reach npm with an unresolved `workspace:` specifier or a pin to a sibling version that is absent from the registry. The failure mode that produced the current breakage is structurally prevented.

### Use-Case 3: Every component reaches 1.0.0 in a safe, ordered rollout

Each package is promoted to `1.0.0` (or already-1.x stays 1.x) through dependency-ordered waves, each wave landing as its own PR + merge + Release-Please publish, with no broken intermediate state.

## Requirements

1. Repair `a16n@latest` so it installs cleanly again (root cause: `@a16njs/plugin-agentsmd@1.0.1`/`1.0.2` were published with a literal `"@a16njs/models": "workspace:*"` because they were published via manual `npm publish`, bypassing pnpm's publish-time `workspace:` rewrite; `a16n@0.15.2` exact-pins the poisoned `1.0.2`).
2. Harden the release/publish CI so the "new scoped package → automated publish fails → manual `npm publish` recovery → leaked `workspace:` protocol / phantom version" chain cannot recur, and so a non-resolvable package is never published.
3. Promote all `0.x` packages to `1.0.0` in dependency order: leaf layer (`@a16njs/models`, plus standalone `@a16njs/glob-hook`) → middle layer (`@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, `@a16njs/plugin-a16n`, `@a16njs/engine`) → `a16n` CLI. (`@a16njs/plugin-agentsmd` is already `1.x`.)
4. Each milestone is shaped so the normal Niko workflow — PR + merge to `main` + Release-Please publish, performed by the operator after each milestone — makes the rollout "work out" with no broken publish.

## Constraints

1. Inter-package dependencies remain `workspace:*` in source; the concrete version is produced by pnpm's rewrite at publish time. We do not hand-pin sibling versions in source.
2. Already-published immutable versions (`agentsmd@1.0.1`/`1.0.2`, `a16n@0.15.2`) cannot be edited in place; repair is by publishing new, correct versions (and optionally deprecating the poisoned ones).
3. `packages/docs` is `private: true` and must never be published to npm.
4. `bump-minor-pre-major: true` is set, so `0.x → 1.0.0` will not happen organically from conventional commits; each promotion must be explicitly forced (per-package `release-as` in `release-please-config.json`).
5. The operator performs all PR merges and Release-Please publishes; this work produces the changes that, once merged and released, make each milestone land.

## Acceptance Criteria

1. `npx a16n@latest` installs and runs successfully — verified after milestone 1 and preserved at every subsequent milestone boundary.
2. No published package tarball contains a `workspace:` specifier, and every internal pin resolves to a version present on the registry.
3. CI cannot publish a non-resolvable package: a regression that would ship one fails the pipeline loudly instead of silently succeeding.
4. Every published package is at `1.x` (none remain on `0.x`), each having been promoted via a dependency-ordered wave with no broken intermediate publish.
