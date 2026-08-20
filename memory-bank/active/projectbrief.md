# Project Brief

Resolve 10 Oxlint errors (`unused-vars` and `irregular-whitespace`) in `plugin-cursor` to make `pnpm exec oxlint packages/plugin-cursor` run cleanly, ensuring tests (`pnpm --filter @a16njs/plugin-cursor test`) continue to pass. Preserve meaning when fixing whitespace, do not write change-detector tests, and rely on linting and existing tests as validation.

References:
- https://github.com/Texarkanine/a16n/issues/158
