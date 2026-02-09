# Bug Fix Archive: CLI Docs CI Build Failure

## Metadata
- **Task ID**: cli-docs-ci-build
- **Date**: 2026-02-09
- **Complexity**: Level 1 (Bug Fix)

## Summary

CLI documentation generation failed in GitHub Actions CI despite working locally. The `pnpm --filter a16n build` command succeeded locally (stale `dist/` from prior builds) but failed in CI (clean checkout, no `dist/` for workspace dependencies). Fixed by changing the pnpm filter from `--filter a16n` to `--filter a16n...` so that workspace dependencies are built in topological order.

## Requirements

- CLI doc generation must succeed in CI clean-checkout environments
- Workspace dependencies must be built before the CLI package

## Implementation

- Changed `pnpm --filter a16n build` to `pnpm --filter a16n... build` in `packages/docs/scripts/generate-cli-docs.ts`
- The `...` suffix instructs pnpm to build the target package and all its workspace dependencies in topological order
- Updated corresponding test

## Testing

- Verified fix passes in CI environment (clean checkout, no stale dist)
- Existing test infrastructure provided regression coverage

## Lessons Learned

1. **pnpm `--filter pkg` vs `--filter pkg...`**: Without `...`, pnpm only builds the named package, not its workspace dependencies. For packages with workspace deps where `tsc` needs their types, `...` is required.
2. **CI clean-checkout behavior differs from local dev**: Always consider that CI has no build artifacts. A local `pnpm clean && pnpm --filter <pkg> build` would reproduce CI conditions.
3. **Layer your fixes**: When fixing build issues, validate each layer independently — correct filter name, stale artifact cleanup, AND dependency availability.

## References

- Reflection: `memory-bank/reflection/reflection-cli-docs-ci-build.md` (archived)
- Related archive: `memory-bank/archive/bug-fixes/20260209-cli-docs.md` (first CLI docs fix)
