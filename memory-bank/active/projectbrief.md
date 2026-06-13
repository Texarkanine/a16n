# Project Brief

**Parent L4 task:** v1-release-rollout (see `memory-bank/active/milestones.md`) — this brief scopes **Milestone 2**.

## User Story

As the maintainer of `a16n`, I want the automated release pipeline to make it *impossible* to publish a non-resolvable package, so that the M1 class of failure (a published tarball carrying a literal `workspace:*` specifier, or a package pinning a sibling version absent from the registry) can never recur — and so that no future release requires manual `npm publish` recovery.

## Use-Case(s)

### Use-Case 1: Every publishable package publishes publicly via the automated path

A release wave that includes any scoped `@a16njs/*` package publishes it publicly through the pipeline's `pnpm publish` path, with no manual `--access public` or manual `npm publish` step. Today only `@a16njs/plugin-agentsmd` declares `publishConfig.access: "public"`; the other six scoped packages rely on implicit/fragile defaults.

### Use-Case 2: A poisoned tarball fails the pipeline before it reaches npm

If any to-be-published tarball's `package.json` contains a `workspace:` specifier, or pins an internal `@a16njs/*` sibling to a version that is neither already on the registry nor part of the same release wave, the publish job fails loudly *before* publishing anything. No poisoned artifact escapes.

### Use-Case 3: The private `docs` package is never published

`packages/docs` (`private: true`) is never attempted by the publish loop, even if Release-Please reports its path.

### Use-Case 4: Poisoning is caught at PR time, not just at release

A pull request that would introduce a tarball-level `workspace:` leak fails CI on the PR (the same tarball guard, run on unbumped versions), so the M1-class failure is surfaced before it can ever reach the release pipeline.

## Requirements

1. Add `publishConfig.access: "public"` to every scoped `@a16njs/*` package that lacks it (`engine`, `models`, `plugin-cursor`, `plugin-claude`, `plugin-a16n`, `glob-hook`), matching `plugin-agentsmd`.
2. Add a pipeline guard that, for each package about to be published, inspects the actual tarball (`pnpm pack`) `package.json` and fails the job if it contains any `workspace:` protocol specifier.
3. Extend that guard to fail if any internal `@a16njs/*` dependency pins a version that is neither present on the npm registry nor part of the current release wave (same-wave siblings count as "will be present").
4. Ensure the publish loop never attempts to publish a `private: true` package (`docs`).
5. Publish in a dependency-safe order within a wave so that, when the registry-presence guard runs, same-wave siblings a package depends on are already published (or the guard correctly treats them as in-wave).
6. Preserve all L4 cross-milestone invariants (`milestones.md`): source stays `workspace:*`, no behavioral code breaks, `docs` never published, `a16n@latest` stays installable, agentsmd never regresses below `1.0.3`.
7. Run the same tarball guard at PR time in `ci.yaml` (pack publishable packages at their current versions; fail the PR on any `workspace:` leak), reusing the release-time analyzer rather than duplicating logic.

## Constraints

1. Source inter-package deps MUST remain `workspace:*`; the concrete version is produced only by pnpm's publish-time rewrite (invariant #3). The guard inspects the *rewritten tarball*, not source.
2. The guard must not produce false positives for legitimate same-wave multi-package releases (e.g. the M4 wave), where several siblings are published together and none is on the registry beforehand.
3. Changes are confined to the release/CI subsystem: `.github/workflows/release.yaml`, `.github/workflows/ci.yaml`, per-package `publishConfig`, and any guard script/test. No behavioral changes to package runtime code.
4. The `1.0.0` promotion waves (M3–M5) are out of scope; M2 only hardens the pipeline they will run through.

## Acceptance Criteria

1. All seven scoped `@a16njs/*` packages declare `publishConfig.access: "public"`.
2. A test/guard demonstrably fails when fed a tarball whose `package.json` contains a `workspace:` specifier, and passes for a correctly-rewritten tarball.
3. The guard fails when an internal pin references a registry-absent, non-in-wave sibling, and passes when the sibling is on the registry or in the same wave.
4. The publish job provably skips `private: true` packages.
5. The release workflow publishes wave members in a dependency-safe order (or the guard is wave-aware), with no false failures for a multi-package wave.
6. Full test suite green; no runtime/behavioral changes to package code.
7. `ci.yaml` runs the tarball guard on PRs and fails when a packed tarball would carry a `workspace:` specifier; the agentsmd `publish-shape.test.ts` is removed, with its assertions covered by the repo-wide guards.
