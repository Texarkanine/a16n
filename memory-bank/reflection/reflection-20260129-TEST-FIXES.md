# Level 2 Enhancement Reflection: Test Failures & Build Optimization

**Task ID:** TEST-FIXES-20260129
**Date:** 2026-01-29
**Complexity:** Level 2 (Bug Fix / Enhancement)

## Enhancement Summary

Fixed multiple test failures and optimized the build pipeline. The main issues were: (1) a rebase error that renamed `ManualPrompt` to `AgentCommand` incorrectly across multiple packages, (2) missing `tsx` dependency causing glob-hook CLI tests to fail, and (3) `pnpm test` unnecessarily building documentation. All issues were resolved and the test suite now passes (365 tests across 7 packages).

## What Went Well

- **Systematic diagnosis**: Used git history comparison to identify that `main` branch had `ManualPrompt` while the working branch had `AgentCommand` - a clear rebase error
- **Targeted restoration**: Used `git checkout main -- <files>` to restore affected files to their correct state
- **Surgical turbo.json fix**: The `docs#test` override pattern elegantly separates test dependencies per-package without affecting global behavior
- **Comprehensive verification**: Ran full test suite multiple times to confirm fixes

## Challenges Encountered

- **Aggressive turbo caching**: Even after restoring source files via git checkout, turbo's cache continued serving old `dist/` outputs with `AgentCommand` references
- **Cascading type errors**: The ManualPrompt→AgentCommand rename affected multiple packages (`models`, `plugin-claude`, `plugin-cursor`) due to shared type exports
- **Hidden dependency**: glob-hook CLI tests used `npx tsx` but `tsx` wasn't in devDependencies - tests passed locally due to global installation

## Solutions Applied

- **Cache busting**: Deleted all `packages/*/dist` folders, cleared `~/.turbo/cache` and `node_modules/.cache`, stopped turbo daemon
- **Multi-package restoration**: Identified all affected files across packages and restored them systematically from `main`
- **Explicit dependency**: Added `tsx` to glob-hook's devDependencies to ensure CI reproducibility
- **Task-specific turbo override**: Added `"docs#test": { "dependsOn": [] }` to turbo.json to decouple docs tests from docs build

## Key Technical Insights

- **Turbo cache fingerprints source files**: When turbo's cache hash matches, it replays outputs regardless of actual file content. Forcing rebuild (`--force`) or clearing cache is required after out-of-band file modifications
- **Package-specific turbo tasks**: The `package#task` syntax allows per-package task configuration overrides - powerful for handling exceptions to global rules
- **npx caching behavior**: `npx` will use globally installed packages if available, masking missing devDependencies. Always verify with fresh installs
- **Type guard exports matter**: When changing enum values like `CustomizationType.ManualPrompt`, all type guards (`isManualPrompt`) and their exports must be updated atomically

## Process Insights

- **Rebase errors compound**: A single incorrect resolution during rebase (choosing wrong version of types.ts) cascaded into failures across multiple packages
- **Test failures are symptoms**: The `isManualPrompt is not a function` error indicated the export was missing, not that the function didn't exist
- **CI vs local divergence**: Tests passing locally but failing in CI often indicates environment-specific dependencies

## Action Items for Future Work

1. **Document turbo cache clearing**: Add troubleshooting note about clearing turbo cache when git operations modify source files
2. **Add CI dependency check**: Consider adding a step to verify all `npx` commands have corresponding devDependencies
3. **Rebase verification checklist**: When rebasing long-lived branches, run full test suite immediately after rebase, not just lint

## Time Estimation Accuracy

- Estimated time: N/A (reactive bug fix session)
- Actual time: ~45 minutes
- Key time sink: Diagnosing turbo cache behavior (~20 minutes)

## Files Changed

| File | Change |
|------|--------|
| `packages/glob-hook/package.json` | Added tsx devDependency |
| `turbo.json` | Added `docs#test` override |
| `pnpm-lock.yaml` | Updated for tsx |

## Verification

```
✓ pnpm run test - All 365 tests pass
✓ docs#test runs without docs#build
✓ All packages build successfully
```
