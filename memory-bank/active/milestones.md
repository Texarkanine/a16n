# Milestones: v1-release-rollout

## Cross-milestone invariants & constraints

These properties must hold at **every** milestone boundary (i.e., after each PR is merged and its Release-Please publish completes). No sub-run may violate them.

1. **`a16n@latest` is always installable.** `npx a16n@latest` resolves and runs. Once milestone 1 restores this, no later milestone may regress it.
2. **No poisoned artifact.** No published tarball contains a `workspace:` specifier, and every internal (`@a16njs/*`) pin resolves to a version that is present on the npm registry.
3. **Source stays `workspace:*`.** Inter-package dependencies remain the `workspace:*` protocol in source; the concrete version is produced only by pnpm's publish-time rewrite. No milestone hand-pins a sibling version in source.
4. **Forward-only dependency order.** Each release wave depends only on packages already published by earlier milestones. Milestone N never requires work introduced in milestone N+1.
5. **`packages/docs` is never published** (it is `private: true`).
6. **No silent code-breaking changes.** The `0.x → 1.0.0` promotions are version-policy bumps, not behavioral breaks; public CLI/API behavior is preserved unless a milestone explicitly scopes (and documents) a change.
7. **`@a16njs/plugin-agentsmd` never regresses below the corrected version** shipped in milestone 1.

## Execution Order

All milestones are strictly sequential — each depends on the prior one being merged and published. Milestones 1 and 2 establish a safe pipeline; milestones 3→5 are the dependency-ordered `1.0.0` waves (leaf → middle → CLI).

- [ ] **M1 — Restore `a16n@latest` installability.** Republish `@a16njs/plugin-agentsmd` through the pnpm publish path (new patch version, so its `workspace:*` is rewritten to a real `@a16njs/models` version) and re-pin/republish the `a16n` CLI so `npx a16n@latest` resolves again; optionally deprecate the poisoned `agentsmd@1.0.1`/`1.0.2` and `a16n@0.15.2`. — _estimated **L2**_ (spans two packages plus the Release-Please config / forced versions and a post-release install verification; narrow but not single-file).
- [ ] **M2 — Harden release CI so a non-resolvable package can never be published.** Ensure every publishable package publishes publicly via the automated `pnpm publish` path (so manual `npm publish` recovery is never needed), add a guard that fails the pipeline if any to-be-published tarball contains a `workspace:` specifier or pins a registry-absent sibling, and ensure the private `docs` package is never attempted. — _estimated **L2**_ (contained enhancement to the release workflow + `publishConfig`; may classify **L3** at sub-run start if the publish job needs topological ordering/restructuring).
- [ ] **M3 — Wave A: promote `@a16njs/models` (and standalone `@a16njs/glob-hook`) to `1.0.0`.** Force the leaf-layer major via per-package `release-as` in `release-please-config.json`. — _estimated **L1**_ (leaf packages with no internal dependents to coordinate; primarily a release-config change).
- [ ] **M4 — Wave B: promote `@a16njs/plugin-cursor`, `@a16njs/plugin-claude`, `@a16njs/plugin-a16n`, and `@a16njs/engine` to `1.0.0`.** They depend only on the already-published `@a16njs/models@1.0.0` from M3 and have no edges among themselves. — _estimated **L2**_ (coordinated multi-package major bump that must land after Wave A is live).
- [ ] **M5 — Wave C: promote the `a16n` CLI to `1.0.0`.** Re-pins (via pnpm rewrite) to the `1.0.0` engine, plugins, and models published in M3–M4. — _estimated **L1**_ (single package; primarily a forced version bump once its dependencies are all 1.x).
