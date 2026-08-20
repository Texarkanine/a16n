# Project Brief

Resolve all eight `eslint(no-unused-vars)` findings reported by Oxlint in the `@a16njs/models` and `@a16njs/engine` packages for issue #160.

## Requirements

- Clean the four findings in each package without changing exported behavior.
- Do not enable additional Oxlint categories or add lint to CI.
- Do not add change-detector tests; use Oxlint and the existing package tests.
- Keep the grouped models-and-engine scope in one change.
- Validate with `pnpm exec oxlint packages/models packages/engine`.
- Validate with `pnpm --filter @a16njs/models test`.
- Validate with `pnpm --filter @a16njs/engine test`.
- Stop after the REFLECT phase; do not archive, push, or open a pull request.
