# Project Brief

## User Story

As a developer on the a16n monorepo, I want test invocations to work reliably regardless of where I run them from, so I don't hit "works on my machine / doesn't work on my machine" problems.

## Background

`packages/glob-hook/test/cli.test.ts` spawns child processes via `npx tsx` with `cwd: process.cwd()`. When Vitest is run from the **monorepo root** (e.g. `npx vitest run packages/glob-hook/...`), `tsx` is not present in the root `node_modules/.bin/` — it only lives in `packages/glob-hook/node_modules/.bin/tsx`. This causes all 12 CLI integration tests to time out (5 s default, vs. the package-level 15 s config that is never applied).

CI runs `pnpm test` via Turbo, which runs Vitest **inside** each package — so `tsx` resolves correctly and `testTimeout: 15000` is applied. Tests pass.

## Requirements

1. `pnpm test` (via Turbo) remains the canonical, always-correct way to run tests.
2. Direct `vitest` invocations (for a single test, a single file, or a whole package's suite) must **not break** — either by fixing the root cause or by providing clear developer documentation on the correct invocation pattern.
3. If the fix is code-only (e.g. make `runCli` cwd-independent), it must be covered by the existing test infrastructure.
4. If the fix includes documentation, it should live somewhere discoverable (techContext, CONTRIBUTING, README, or inline vitest config comment).

## Acceptance Criteria

- Running `npx vitest run packages/glob-hook/test/cli.test.ts` from the monorepo root either passes, or emits a helpful error/comment directing the developer to the correct command.
- CI continues to pass without change.
- Developers have a documented, unambiguous way to run a single test / suite / package from the monorepo.
