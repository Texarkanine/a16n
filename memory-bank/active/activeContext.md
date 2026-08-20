# Active Context

## Current Task: issue-161 unused-vars in glob-hook and docs
**Phase:** BUILD - COMPLETE

## What Was Done
- Removed unused `HookInput` type import from `packages/glob-hook/test/io.test.ts`.
- Removed unused `dirname` import from `packages/docs/scripts/generate-cli-docs.ts`.
- Verification: glob-hook 37/37, docs 56/56, grouped oxlint clean.

## Next Step
- QA semantic review of the two-line diff.
