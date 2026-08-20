# Project Brief

Resolve [issue #157](https://github.com/Texarkanine/a16n/issues/157) by removing the 11 unused declarations reported by Oxlint across the CLI package's test suites.

## Requirements

- Limit code changes to unused-variable cleanup in the nine listed CLI test files.
- Do not enable additional Oxlint rule categories.
- Do not add linting to CI.
- Do not add change-detector tests; this cleanup does not change executable behavior.
- `pnpm exec oxlint packages/cli` must report no findings.
- `pnpm --filter a16n test` must pass.
