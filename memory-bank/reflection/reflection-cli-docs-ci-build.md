# Reflection: CLI Docs CI Build Failure

**Task**: Fix CLI documentation generation failing in CI for v0.11.1
**Complexity**: Level 1 (Bug Fix)
**Date**: 2026-02-09

## Summary

CLI doc generation failed in GitHub Actions CI despite working locally. The `pnpm --filter a16n build` command succeeded locally (stale `dist/` from prior builds) but failed in CI (clean checkout, no `dist/` for workspace dependencies).

## Fix

Changed `pnpm --filter a16n build` to `pnpm --filter a16n... build` in `packages/docs/scripts/generate-cli-docs.ts`. The `...` suffix instructs pnpm to build the target package and all its workspace dependencies in topological order.

## What Went Well

- Clear error message pointed directly to the failing build command
- Existing test infrastructure enabled easy regression coverage
- Fix was surgically small (one-character change + test update)

## Challenges

- The prior fix (commit 12faf3a) addressed two real issues but missed this third CI-specific failure
- "Works locally" masked the problem because `dist/` directories persisted from prior builds

## Lessons Learned

1. **pnpm `--filter pkg` vs `--filter pkg...`**: Without `...`, pnpm only builds the named package, not its workspace dependencies. For packages with workspace deps where `tsc` needs their types, `...` is required.
2. **CI clean-checkout behavior differs from local dev**: Always consider that CI has no build artifacts. A local `pnpm clean && pnpm --filter <pkg> build` would reproduce CI conditions.
3. **Layer your fixes**: When fixing build issues, validate each layer independently — correct filter name, stale artifact cleanup, AND dependency availability.

## Process Improvements

- For build-related fixes, validate by running `pnpm clean` first to simulate CI conditions
- Consider adding a CI-specific integration test that verifies CLI doc generation from a clean state
